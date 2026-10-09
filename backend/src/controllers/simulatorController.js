let simulatorInstance = null;

function setSimulatorInstance(instance) {
  simulatorInstance = instance;
}

class SimulatorController {
  static getStatus(req, res) {
    if (!simulatorInstance) {
      return res.status(503).json({ success: false, error: 'Simulator not initialized' });
    }
    res.json({ success: true, ...simulatorInstance.getStatus() });
  }

  static start(req, res) {
    if (!simulatorInstance) {
      return res.status(503).json({ success: false, error: 'Simulator not initialized' });
    }
    simulatorInstance.start();
    res.json({ success: true, message: 'Hardware simulation started', isRunning: true });
  }

  static stop(req, res) {
    if (!simulatorInstance) {
      return res.status(503).json({ success: false, error: 'Simulator not initialized' });
    }
    simulatorInstance.stop();
    res.json({ success: true, message: 'Hardware simulation stopped', isRunning: false });
  }

  static setRate(req, res) {
    if (!simulatorInstance) {
      return res.status(503).json({ success: false, error: 'Simulator not initialized' });
    }
    const { intervalMs } = req.body;
    simulatorInstance.setIntervalMs(intervalMs);
    res.json({ success: true, message: `Interval updated to ${intervalMs}ms`, intervalMs });
  }

  static injectAnomaly(req, res) {
    if (!simulatorInstance) {
      return res.status(503).json({ success: false, error: 'Simulator not initialized' });
    }
    const { deviceId, anomalyType, durationTicks } = req.body;
    try {
      const result = simulatorInstance.injectAnomaly(
        deviceId || 'TURBINE-01',
        anomalyType || 'OVERHEAT',
        durationTicks || 30
      );
      res.json({ success: true, message: 'Anomaly injected', result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static clearAnomaly(req, res) {
    if (!simulatorInstance) {
      return res.status(503).json({ success: false, error: 'Simulator not initialized' });
    }
    const { deviceId } = req.body;
    simulatorInstance.clearAnomaly(deviceId || 'TURBINE-01');
    res.json({ success: true, message: `Anomaly cleared for ${deviceId}` });
  }
}

module.exports = { SimulatorController, setSimulatorInstance };
