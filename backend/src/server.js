require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const { connectDB } = require('./config/db');
const { socketHandler } = require('./websocket/socketHandler');
const { pipelineManager } = require('./engine/pipelineManager');
const { telemetryService } = require('./services/telemetryService');
const { alertService } = require('./services/alertService');
const { HardwareSimulator } = require('./simulator/hardwareSimulator');
const { setSimulatorInstance } = require('./controllers/simulatorController');
const { DEFAULT_TEMPLATES } = require('./controllers/pipelineController');

const pipelineRoutes = require('./routes/pipelineRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const alertRoutes = require('./routes/alertRoutes');
const simulatorRoutes = require('./routes/simulatorRoutes');

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '10mb' }));

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  socketHandler.init(io);

  // Connect to native MongoDB Time-Series DB
  await connectDB();

  // Wire up reactive Stream Engine & Alert Service
  pipelineManager.setEventEmitter(socketHandler);
  pipelineManager.setActionHandler(trigger => alertService.handleTrigger(trigger));
  alertService.setEventEmitter(socketHandler);

  // Start background Time-Series batch ingestion flusher
  telemetryService.startBatchFlusher();

  // Create Hardware Simulator
  const simulator = new HardwareSimulator((point) => {
    // 1. Buffer to native MongoDB Time-Series
    telemetryService.queuePoint(point);
    // 2. Feed into reactive RxJS Stream Compiler
    pipelineManager.ingest(point);
    // 3. Broadcast to real-time client UI
    socketHandler.emitLiveTelemetry(point);
  });
  setSimulatorInstance(simulator);

  // Auto-start IoT simulator
  simulator.start();

  // Auto-deploy default "Turbine Overheat Moving Average SMS" pipeline
  try {
    const defaultTemplate = DEFAULT_TEMPLATES[0];
    if (defaultTemplate) {
      console.log(`[Server] Compiling default reactive pipeline: ${defaultTemplate.name}`);
      pipelineManager.deployPipeline(defaultTemplate);
    }
  } catch (err) {
    console.error('[Server] Failed to compile default template:', err);
  }

  // Periodic metrics broadcast to Socket.io clients
  setInterval(() => {
    const metrics = {
      telemetry: telemetryService.getMetrics(),
      activePipelines: pipelineManager.getActivePipelineIds().length,
      connectedClients: socketHandler.connectedSocketsCount,
      timestamp: new Date()
    };
    socketHandler.emitMetrics(metrics);
  }, 2000);

  // Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'UP',
      time: new Date(),
      activePipelines: pipelineManager.getActivePipelineIds(),
      telemetry: telemetryService.getMetrics()
    });
  });

  app.use('/api/pipelines', pipelineRoutes);
  app.use('/api/telemetry', telemetryRoutes);
  app.use('/api/devices', deviceRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/simulator', simulatorRoutes);

  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`⚡ NexusFlow Engine running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket ready on ws://localhost:${PORT}`);
    console.log(`📈 Native Time-Series ingestion & RxJS Stream Compiler ready`);
    console.log(`====================================================`);
  });
}

startServer().catch(err => {
  console.error('[Fatal] Server failed to start:', err);
  process.exit(1);
});
