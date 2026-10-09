const { DEVICES } = require('../config/constants');

class HardwareSimulator {
  constructor(onTelemetryEmit) {
    this.onTelemetryEmit = onTelemetryEmit; // callback: (point) => void
    this.isRunning = false;
    this.intervalId = null;
    this.intervalMs = parseInt(process.env.SIMULATOR_INTERVAL_MS, 10) || 400;
    this.tick = 0;

    // Device state tracking with realistic baseline dynamics
    this.deviceStates = {
      'TURBINE-01': {
        temperature: 71.5,
        vibration: 2.1,
        pressure: 14.2,
        rpm: 3000,
        anomalyMode: null, // 'OVERHEAT' | 'VIBRATION_SPIKE' | null
        anomalyTicksRemaining: 0
      },
      'GENERATOR-04': {
        temperature: 63.0,
        voltage: 11.02,
        frequency: 50.01,
        power: 44.5,
        anomalyMode: null,
        anomalyTicksRemaining: 0
      },
      'BOILER-02': {
        temperature: 202.0,
        pressure: 38.2,
        water_level: 52.0,
        anomalyMode: null,
        anomalyTicksRemaining: 0
      },
      'CHILLER-03': {
        temperature: 6.4,
        flow_rate: 126.0,
        compressor_power: 82.0,
        anomalyMode: null,
        anomalyTicksRemaining: 0
      }
    };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[HardwareSimulator] Started IoT telemetry stream at ${this.intervalMs}ms interval`);

    this.intervalId = setInterval(() => {
      this.generateTick();
    }, this.intervalMs);
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[HardwareSimulator] Stopped IoT telemetry stream');
  }

  setIntervalMs(ms) {
    this.intervalMs = Math.max(50, parseInt(ms, 10) || 400);
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Inject anomaly into a specific machine
   * @param {string} deviceId - 'TURBINE-01', etc.
   * @param {string} anomalyType - 'OVERHEAT', 'VIBRATION_SPIKE', 'PRESSURE_DROP', 'COOLING_FAILURE'
   * @param {number} durationTicks - how many ticks the anomaly lasts (e.g. 25 ticks)
   */
  injectAnomaly(deviceId, anomalyType, durationTicks = 30) {
    const state = this.deviceStates[deviceId];
    if (!state) {
      throw new Error(`Device ${deviceId} not found`);
    }

    state.anomalyMode = anomalyType;
    state.anomalyTicksRemaining = durationTicks;
    console.log(`[HardwareSimulator] Injected anomaly ${anomalyType} on ${deviceId} for ${durationTicks} ticks`);

    return {
      deviceId,
      anomalyType,
      durationTicks,
      status: 'ACTIVE'
    };
  }

  clearAnomaly(deviceId) {
    const state = this.deviceStates[deviceId];
    if (state) {
      state.anomalyMode = null;
      state.anomalyTicksRemaining = 0;
    }
  }

  generateTick() {
    this.tick++;
    const now = new Date();

    // Iterate through devices and generate realistic sensor data
    for (const dev of DEVICES) {
      const state = this.deviceStates[dev.id];
      if (!state) continue;

      const isAnomaly = state.anomalyTicksRemaining > 0;
      if (isAnomaly) {
        state.anomalyTicksRemaining--;
        if (state.anomalyTicksRemaining === 0) {
          state.anomalyMode = null;
        }
      }

      for (const sensor of dev.sensors) {
        let value = 0;
        const noise = (Math.random() - 0.5) * 0.4; // micro-jitter
        const wave = Math.sin(this.tick * 0.1) * 0.8;

        if (dev.id === 'TURBINE-01') {
          if (sensor.type === 'temperature') {
            if (state.anomalyMode === 'OVERHEAT') {
              // Rapid thermal climb above 80°C towards 88-94°C
              state.temperature = Math.min(94.5, state.temperature + 1.2 + Math.random() * 0.5);
            } else {
              // Gradual return to baseline 70-74°C
              state.temperature = Math.max(71.0, state.temperature - 0.4);
              state.temperature = 72.0 + Math.sin(this.tick * 0.05) * 2.5 + noise;
            }
            value = state.temperature;
          } else if (sensor.type === 'vibration') {
            if (state.anomalyMode === 'VIBRATION_SPIKE') {
              value = 6.2 + Math.random() * 1.8;
            } else {
              value = 2.2 + Math.abs(Math.sin(this.tick * 0.08)) * 0.9 + noise * 0.5;
            }
          } else if (sensor.type === 'pressure') {
            value = 14.2 + wave * 0.5 + noise * 0.2;
          } else if (sensor.type === 'rpm') {
            value = 3000 + Math.sin(this.tick * 0.12) * 8 + (Math.random() - 0.5) * 4;
          }
        } else if (dev.id === 'GENERATOR-04') {
          if (sensor.type === 'voltage') {
            value = 11.0 + wave * 0.08 + noise * 0.02;
          } else if (sensor.type === 'temperature') {
            value = 64.0 + wave * 1.5 + noise;
          } else if (sensor.type === 'frequency') {
            value = 50.0 + (Math.random() - 0.5) * 0.04;
          } else if (sensor.type === 'power') {
            value = 44.5 + wave * 1.2 + noise * 0.4;
          }
        } else if (dev.id === 'BOILER-02') {
          if (sensor.type === 'pressure') {
            if (state.anomalyMode === 'PRESSURE_DROP') {
              value = 22.0 + Math.random() * 2.0; // severe drop / leak
            } else {
              value = 38.5 + wave * 0.8 + noise * 0.3;
            }
          } else if (sensor.type === 'temperature') {
            value = 205.0 + wave * 2.0 + noise;
          } else if (sensor.type === 'water_level') {
            value = 53.0 + wave * 1.5 + noise;
          }
        } else if (dev.id === 'CHILLER-03') {
          if (sensor.type === 'temperature') {
            if (state.anomalyMode === 'COOLING_FAILURE') {
              value = 14.5 + Math.random() * 1.5;
            } else {
              value = 6.2 + wave * 0.4 + noise * 0.1;
            }
          } else if (sensor.type === 'flow_rate') {
            if (state.anomalyMode === 'COOLING_FAILURE') {
              value = 45.0 + Math.random() * 5.0;
            } else {
              value = 125.0 + wave * 3.0 + noise;
            }
          } else if (sensor.type === 'compressor_power') {
            value = 82.0 + wave * 2.0 + noise;
          }
        }

        const point = {
          timestamp: now,
          metadata: {
            deviceId: dev.id,
            deviceName: dev.name,
            sensorType: sensor.type,
            metric: sensor.metric,
            unit: sensor.unit,
            location: dev.location
          },
          value: parseFloat(value.toFixed(2))
        };

        if (this.onTelemetryEmit) {
          this.onTelemetryEmit(point);
        }
      }
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
      tick: this.tick,
      deviceStates: this.deviceStates
    };
  }
}

module.exports = { HardwareSimulator };
