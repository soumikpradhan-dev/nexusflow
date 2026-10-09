export const DEVICES = [
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

export const NODE_PALETTE_ITEMS = [
  {
    type: 'sensorInput',
    category: 'Source',
    label: 'Sensor Input',
    description: 'Ingests real-time telemetry from IoT device',
    icon: 'Radio',
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-400',
    defaultData: {
      label: 'Turbine Sensor',
      deviceId: 'TURBINE-01',
      sensorType: 'temperature',
      metric: 'Core Casing Temp',
      unit: '°C'
    }
  },
  {
    type: 'movingAverage',
    category: 'Transform',
    label: 'Moving Average',
    description: 'Sliding window rolling average filter',
    icon: 'Activity',
    color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/40 text-cyan-400',
    defaultData: {
      label: 'Moving Average Filter',
      windowSize: 5,
      field: 'value'
    }
  },
  {
    type: 'thresholdComparator',
    category: 'Rules',
    label: 'Threshold Comparator',
    description: 'Condition evaluator (>, <, ==, between)',
    icon: 'Sliders',
    color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/40 text-amber-400',
    defaultData: {
      label: 'Threshold Filter (>80°C)',
      operator: '>',
      threshold: 80.0,
      field: 'movingAverage',
      unit: '°C'
    }
  },
  {
    type: 'rateOfChange',
    category: 'Transform',
    label: 'Rate of Change',
    description: 'Derivative delta spike detector',
    icon: 'TrendingUp',
    color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/40 text-purple-400',
    defaultData: {
      label: 'Rate of Change (Spike)',
      maxRate: 5.0,
      condition: '>'
    }
  },
  {
    type: 'anomalyDetector',
    category: 'Transform',
    label: 'Z-Score Anomaly',
    description: 'Statistical deviation outlier detector',
    icon: 'Zap',
    color: 'from-fuchsia-500/20 to-pink-500/10 border-fuchsia-500/40 text-fuchsia-400',
    defaultData: {
      label: 'Z-Score Detector',
      zThreshold: 2.5,
      windowSize: 15
    }
  },
  {
    type: 'logicGate',
    category: 'Rules',
    label: 'Logic Gate',
    description: 'AND / OR combiner for multi-branch rules',
    icon: 'GitMerge',
    color: 'from-violet-500/20 to-purple-500/10 border-violet-500/40 text-violet-400',
    defaultData: {
      label: 'Logic Gate',
      gateType: 'AND',
      maxTimeDiffMs: 5000
    }
  },
  {
    type: 'smsAlert',
    category: 'Action',
    label: 'SMS Alert',
    description: 'Dispatches emergency SMS notification',
    icon: 'MessageSquare',
    color: 'from-rose-500/20 to-red-500/10 border-rose-500/40 text-rose-400',
    defaultData: {
      label: 'SMS Alert Dispatcher',
      recipient: '+1 (555) 019-2834',
      severity: 'CRITICAL',
      message: 'CRITICAL ALERT: Factory Sector-7 Heavy Turbine #1 Temperature exceeded safe threshold! Moving Average: {{movingAverage}}°C (Raw: {{value}}°C). Immediate inspection required.',
      cooldownMs: 4000
    }
  },
  {
    type: 'machineActuator',
    category: 'Action',
    label: 'Machine Actuator',
    description: 'Sends automated PLC control command',
    icon: 'ShieldAlert',
    color: 'from-orange-500/20 to-amber-500/10 border-orange-500/40 text-orange-400',
    defaultData: {
      label: 'PLC Emergency Actuator',
      targetSystem: 'TURBINE_MAIN_PLC',
      action: 'EXECUTE_EMERGENCY_LOAD_REDUCTION',
      cooldownMs: 5000
    }
  }
];
