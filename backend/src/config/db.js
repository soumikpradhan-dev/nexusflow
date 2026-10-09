const { MongoClient } = require('mongodb');
const { DEVICES } = require('./constants');

let db = null;
let client = null;

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.DB_NAME || 'nexusflow';

  client = new MongoClient(uri, {
    maxPoolSize: 50,
    minPoolSize: 10,
    serverSelectionTimeoutMS: 5000
  });

  await client.connect();
  db = client.db(dbName);
  console.log(`[MongoDB] Connected to database: ${dbName}`);

  await initCollections();
  return db;
}

async function initCollections() {
  try {
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // 1. Native Time-Series Collection: telemetry
    if (!collectionNames.includes('telemetry')) {
      console.log('[MongoDB] Creating native Time-Series collection: telemetry...');
      await db.createCollection('telemetry', {
        timeseries: {
          timeField: 'timestamp',
          metaField: 'metadata',
          granularity: 'seconds'
        }
      });
      console.log('[MongoDB] Created native Time-Series collection: telemetry');
    } else {
      console.log('[MongoDB] Time-Series collection "telemetry" already exists');
    }

    // Index on metadata and time for time-series queries
    await db.collection('telemetry').createIndex(
      { 'metadata.deviceId': 1, 'metadata.sensorType': 1, timestamp: -1 },
      { background: true }
    );

    // 2. Regular collection: pipelines
    if (!collectionNames.includes('pipelines')) {
      await db.createCollection('pipelines');
    }
    await db.collection('pipelines').createIndex({ isDefault: 1 });
    await db.collection('pipelines').createIndex({ active: 1 });

    // 3. Regular collection: alerts
    if (!collectionNames.includes('alerts')) {
      await db.createCollection('alerts');
    }
    await db.collection('alerts').createIndex({ timestamp: -1 });
    await db.collection('alerts').createIndex({ deviceId: 1, status: 1 });

    // 4. Regular collection: devices
    if (!collectionNames.includes('devices')) {
      await db.createCollection('devices');
    }
    await db.collection('devices').createIndex({ id: 1 }, { unique: true });

    // Seed devices if empty
    const deviceCount = await db.collection('devices').countDocuments();
    if (deviceCount === 0) {
      console.log('[MongoDB] Seeding default device inventory...');
      await db.collection('devices').insertMany(
        DEVICES.map(d => ({
          ...d,
          status: 'ONLINE',
          lastSeen: new Date(),
          createdAt: new Date()
        }))
      );
    }

    console.log('[MongoDB] All collections & indexes initialized.');
  } catch (error) {
    console.error('[MongoDB] Error during collections initialization:', error);
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

function getClient() {
  return client;
}

module.exports = {
  connectDB,
  getDB,
  getClient
};
