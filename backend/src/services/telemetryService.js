const { getDB } = require('../config/db');

class TelemetryService {
  constructor() {
    this.batchQueue = [];
    this.batchSize = parseInt(process.env.BATCH_SIZE, 10) || 100;
    this.flushIntervalMs = parseInt(process.env.BATCH_FLUSH_INTERVAL_MS, 10) || 1000;
    this.timer = null;
    this.totalIngested = 0;
    this.totalFlushedToDB = 0;
    this.recentPointsSecond = 0;
    this.pointsPerSecond = 0;
    this.lastSecondMark = Date.now();

    // Start rate calculation timer
    setInterval(() => {
      const now = Date.now();
      const elapsed = (now - this.lastSecondMark) / 1000;
      this.pointsPerSecond = Math.round(this.recentPointsSecond / elapsed);
      this.recentPointsSecond = 0;
      this.lastSecondMark = now;
    }, 1000);
  }

  startBatchFlusher() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.flushQueue();
    }, this.flushIntervalMs);
  }

  /**
   * Enqueue telemetry reading for bulk insert into MongoDB Time-Series
   */
  queuePoint(point) {
    const doc = {
      timestamp: point.timestamp ? new Date(point.timestamp) : new Date(),
      metadata: {
        deviceId: point.metadata?.deviceId || point.deviceId || 'UNKNOWN',
        sensorType: point.metadata?.sensorType || point.sensorType || 'metric',
        unit: point.metadata?.unit || point.unit || '',
        location: point.metadata?.location || point.location || 'Default Zone'
      },
      value: typeof point.value === 'number' ? point.value : parseFloat(point.value) || 0
    };

    this.batchQueue.push(doc);
    this.totalIngested++;
    this.recentPointsSecond++;

    if (this.batchQueue.length >= this.batchSize) {
      this.flushQueue();
    }

    return doc;
  }

  /**
   * Bulk insert into native MongoDB Time-Series collection
   */
  async flushQueue() {
    if (this.batchQueue.length === 0) return;

    const batch = this.batchQueue.splice(0, this.batchSize);
    try {
      const db = getDB();
      const result = await db.collection('telemetry').insertMany(batch, { ordered: false });
      this.totalFlushedToDB += result.insertedCount || batch.length;
    } catch (err) {
      console.error('[TelemetryService] Bulk insert into time-series collection error:', err.message);
    }
  }

  /**
   * Query recent time-series data
   */
  async getRecentTelemetry({ deviceId, sensorType, limit = 100, minutes = 10 }) {
    const db = getDB();
    const query = {};

    if (deviceId && deviceId !== 'ALL') {
      query['metadata.deviceId'] = deviceId;
    }
    if (sensorType && sensorType !== 'ALL') {
      query['metadata.sensorType'] = sensorType;
    }

    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    query.timestamp = { $gte: cutoff };

    const docs = await db
      .collection('telemetry')
      .find(query)
      .sort({ timestamp: 1 })
      .limit(parseInt(limit, 10))
      .toArray();

    return docs;
  }

  /**
   * Time-series downsampling aggregation using MongoDB $dateTrunc
   */
  async getAggregatedTelemetry({ deviceId, sensorType, intervalUnit = 'second', intervalBin = 5, minutes = 30 }) {
    const db = getDB();
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);

    const match = {
      timestamp: { $gte: cutoff }
    };
    if (deviceId && deviceId !== 'ALL') match['metadata.deviceId'] = deviceId;
    if (sensorType && sensorType !== 'ALL') match['metadata.sensorType'] = sensorType;

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            bucket: {
              $dateTrunc: {
                date: '$timestamp',
                unit: intervalUnit,
                binSize: intervalBin
              }
            },
            deviceId: '$metadata.deviceId',
            sensorType: '$metadata.sensorType'
          },
          avgValue: { $avg: '$value' },
          minValue: { $min: '$value' },
          maxValue: { $max: '$value' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.bucket': 1 } }
    ];

    const results = await db.collection('telemetry').aggregate(pipeline).toArray();
    return results.map(r => ({
      timestamp: r._id.bucket,
      deviceId: r._id.deviceId,
      sensorType: r._id.sensorType,
      avg: parseFloat(r.avgValue.toFixed(2)),
      min: parseFloat(r.minValue.toFixed(2)),
      max: parseFloat(r.maxValue.toFixed(2)),
      count: r.count
    }));
  }

  getMetrics() {
    return {
      totalIngested: this.totalIngested,
      totalFlushedToDB: this.totalFlushedToDB,
      queueLength: this.batchQueue.length,
      pointsPerSecond: this.pointsPerSecond
    };
  }
}

const telemetryService = new TelemetryService();
module.exports = { telemetryService };
