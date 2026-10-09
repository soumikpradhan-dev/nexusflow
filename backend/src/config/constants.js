const DEVICES = [
  {
    id: 'TURBINE-01',
    name: 'Heavy Gas Turbine #1',
    type: 'Turbine',
    location: 'Sector 7 - Heavy Power Bay',
    sensors: [
      { type: 'temperature', unit: '°C', normalMin: 65, normalMax: 78, criticalThreshold: 85, metric: 'Core Casing Temp' },
      { type: 'vibration', unit: 'mm/s', normalMin: 1.2, normalMax: 3.5, criticalThreshold: 5.0, metric: 'Shaft Vibration' },
      { type: 'pressure', unit: 'bar', normalMin: 12.0, normalMax: 15.5, criticalThreshold: 18.0, metric: 'Lube Oil Pressure' },
      { type: 'rpm', unit: 'RPM', normalMin: 2980, normalMax: 3020, criticalThreshold: 3150, metric: 'Rotor Speed' }
    ]
  },
  {
    id: 'GENERATOR-04',
    name: 'Synchronous Generator #4',
    type: 'Generator',
    location: 'Sector 4 - High Voltage Substation',
    sensors: [
      { type: 'temperature', unit: '°C', normalMin: 55, normalMax: 70, criticalThreshold: 80, metric: 'Stator Winding Temp' },
      { type: 'voltage', unit: 'kV', normalMin: 10.8, normalMax: 11.2, criticalThreshold: 11.8, metric: 'Terminal Output Voltage' },
      { type: 'frequency', unit: 'Hz', normalMin: 49.8, normalMax: 50.2, criticalThreshold: 51.0, metric: 'Grid Frequency' },
      { type: 'power', unit: 'MW', normalMin: 40.0, normalMax: 48.0, criticalThreshold: 52.0, metric: 'Active Output Power' }
    ]
  },
  {
    id: 'BOILER-02',
    name: 'Industrial Steam Boiler #2',
    type: 'Boiler',
    location: 'Sector 2 - Thermal Utility Wing',
    sensors: [
      { type: 'temperature', unit: '°C', normalMin: 180, normalMax: 220, criticalThreshold: 245, metric: 'Steam Drum Temp' },
      { type: 'pressure', unit: 'bar', normalMin: 35.0, normalMax: 42.0, criticalThreshold: 48.0, metric: 'Drum Pressure' },
      { type: 'water_level', unit: '%', normalMin: 45, normalMax: 60, criticalThreshold: 30, metric: 'Feedwater Drum Level' }
    ]
  },
  {
    id: 'CHILLER-03',
    name: 'Cryo-Loop Chiller Unit #3',
    type: 'Cooling',
    location: 'Sector 3 - Primary Refrigeration Plant',
    sensors: [
      { type: 'temperature', unit: '°C', normalMin: 4.0, normalMax: 8.5, criticalThreshold: 12.0, metric: 'Supply Chilled Water' },
      { type: 'flow_rate', unit: 'm³/h', normalMin: 110, normalMax: 140, criticalThreshold: 85, metric: 'Coolant Flow Rate' },
      { type: 'compressor_power', unit: 'kW', normalMin: 70, normalMax: 95, criticalThreshold: 115, metric: 'Compressor Draw' }
    ]
  }
];

const NODE_TYPES = {
  // Source
  SENSOR_INPUT: 'sensorInput',
  // Processors / Filters
  MOVING_AVERAGE: 'movingAverage',
  THRESHOLD_COMPARATOR: 'thresholdComparator',
  RATE_OF_CHANGE: 'rateOfChange',
  ANOMALY_DETECTOR: 'anomalyDetector',
  // Combiner
  LOGIC_GATE: 'logicGate',
  // Sinks / Actions
  SMS_ALERT: 'smsAlert',
  MACHINE_ACTUATOR: 'machineActuator',
  WEBHOOK: 'webhook',
  LOG_SINK: 'logSink'
};

const SEVERITY_LEVELS = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  EMERGENCY: 'EMERGENCY'
};

module.exports = {
  DEVICES,
  NODE_TYPES,
  SEVERITY_LEVELS
};
