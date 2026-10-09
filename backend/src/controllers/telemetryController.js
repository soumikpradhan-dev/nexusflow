const { telemetryService } = require('../services/telemetryService');
const { pipelineManager } = require('../engine/pipelineManager');
const { socketHandler } = require('../websocket/socketHandler');

class TelemetryController {
  /**
   * Ingestion API: Receives mock/real hardware telemetry
   * Supports both single point and batch arrays
   */
  static async ingest(req, res) {
    try {
      const payload = req.body;
      const points = Array.isArray(payload) ? payload : [payload];

      for (const raw of points) {
        // Enqueue to Time-Series DB buffer
        const formattedPoint = telemetryService.queuePoint(raw);

        // Instantly push to RxJS reactive stream compiler
        pipelineManager.ingest(formattedPoint);

        // Broadcast to WebSocket clients
        socketHandler.emitLiveTelemetry(formattedPoint);
      }

      res.status(202).json({
        success: true,
        acceptedCount: points.length,
        status: 'INGESTED'
      });
    } catch (err) {
      console.error('[TelemetryController] Ingest error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getHistory(req, res) {
    try {
      const { deviceId, sensorType, limit, minutes } = req.query;
      const history = await telemetryService.getRecentTelemetry({
        deviceId: deviceId || 'TURBINE-01',
        sensorType: sensorType || 'temperature',
        limit: limit || 100,
        minutes: minutes || 15
      });
      res.json({ success: true, count: history.length, data: history });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getAggregate(req, res) {
    try {
      const { deviceId, sensorType, intervalUnit, intervalBin, minutes } = req.query;
      const aggregated = await telemetryService.getAggregatedTelemetry({
        deviceId: deviceId || 'TURBINE-01',
        sensorType: sensorType || 'temperature',
        intervalUnit: intervalUnit || 'second',
        intervalBin: parseInt(intervalBin, 10) || 5,
        minutes: parseInt(minutes, 10) || 30
      });
      res.json({ success: true, count: aggregated.length, data: aggregated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getMetrics(req, res) {
    try {
      const metrics = telemetryService.getMetrics();
      res.json({ success: true, metrics });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = { TelemetryController };
