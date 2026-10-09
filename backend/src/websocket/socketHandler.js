class SocketHandler {
  constructor() {
    this.io = null;
    this.connectedSocketsCount = 0;
  }

  init(io) {
    this.io = io;

    io.on('connection', (socket) => {
      this.connectedSocketsCount++;
      console.log(`[Socket.io] Client connected: ${socket.id} (total: ${this.connectedSocketsCount})`);

      socket.on('disconnect', () => {
        this.connectedSocketsCount--;
        console.log(`[Socket.io] Client disconnected: ${socket.id} (remaining: ${this.connectedSocketsCount})`);
      });

      socket.on('subscribe:device', (deviceId) => {
        socket.join(`device:${deviceId}`);
      });

      socket.on('unsubscribe:device', (deviceId) => {
        socket.leave(`device:${deviceId}`);
      });
    });
  }

  emitNodePulse(event) {
    if (!this.io) return;
    this.io.emit('pipeline:node_pulse', event);
  }

  emitAlert(alert) {
    if (!this.io) return;
    this.io.emit('pipeline:alert', alert);
  }

  emitLiveTelemetry(point) {
    if (!this.io) return;
    this.io.emit('telemetry:data', point);
    if (point.metadata?.deviceId) {
      this.io.to(`device:${point.metadata.deviceId}`).emit('telemetry:device_data', point);
    }
  }

  emitMetrics(metrics) {
    if (!this.io) return;
    this.io.emit('system:metrics', metrics);
  }
}

const socketHandler = new SocketHandler();
module.exports = { socketHandler };
