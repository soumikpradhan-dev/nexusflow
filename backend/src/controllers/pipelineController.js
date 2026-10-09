const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/db');
const { pipelineManager } = require('../engine/pipelineManager');

const DEFAULT_TEMPLATES = [
  {
    id: 'template-turbine-overheat',
    name: 'Turbine Overheat Moving Average SMS',
    description: 'Calculates rolling average of Turbine Core Casing Temp and sends emergency SMS alert if > 80°C',
    category: 'Thermal Protection',
    active: true,
    isDefault: true,
    nodes: [
      {
        id: 'node-sensor-turbine',
        type: 'sensorInput',
        position: { x: 80, y: 180 },
        data: {
          label: 'Turbine Sensor',
          deviceId: 'TURBINE-01',
          sensorType: 'temperature',
          metric: 'Core Casing Temp',
          unit: '°C'
        }
      },
      {
        id: 'node-mavg-filter',
        type: 'movingAverage',
        position: { x: 380, y: 180 },
        data: {
          label: 'Moving Average Filter',
          windowSize: 5,
          field: 'value'
        }
      },
      {
        id: 'node-threshold-overheat',
        type: 'thresholdComparator',
        position: { x: 680, y: 180 },
        data: {
          label: 'Overheat Threshold (>80°C)',
          operator: '>',
          threshold: 80.0,
          field: 'movingAverage',
          unit: '°C'
        }
      },
      {
        id: 'node-sms-alert',
        type: 'smsAlert',
        position: { x: 980, y: 180 },
        data: {
          label: 'SMS Alert Dispatcher',
          recipient: '+1 (555) 019-2834',
          severity: 'CRITICAL',
          message: 'CRITICAL ALERT: Factory Sector-7 Heavy Turbine #1 Temperature exceeded safe threshold! Moving Average: {{movingAverage}}°C (Raw: {{value}}°C). Immediate inspection required.',
          cooldownMs: 4000
        }
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-sensor-turbine',
        target: 'node-mavg-filter',
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 }
      },
      {
        id: 'edge-2',
        source: 'node-mavg-filter',
        target: 'node-threshold-overheat',
        animated: true,
        style: { stroke: '#06b6d4', strokeWidth: 2 }
      },
      {
        id: 'edge-3',
        source: 'node-threshold-overheat',
        target: 'node-sms-alert',
        animated: true,
        style: { stroke: '#f59e0b', strokeWidth: 2 }
      }
    ]
  },
  {
    id: 'template-vibration-shutdown',
    name: 'Shaft Vibration Emergency Trip',
    description: 'Detects extreme mechanical vibration spike (> 5.0 mm/s) and triggers automated SCADA emergency throttle',
    category: 'Mechanical Safety',
    active: false,
    nodes: [
      {
        id: 'node-sensor-vib',
        type: 'sensorInput',
        position: { x: 80, y: 180 },
        data: {
          label: 'Turbine Vibration Sensor',
          deviceId: 'TURBINE-01',
          sensorType: 'vibration',
          metric: 'Shaft Vibration',
          unit: 'mm/s'
        }
      },
      {
        id: 'node-comparator-vib',
        type: 'thresholdComparator',
        position: { x: 420, y: 180 },
        data: {
          label: 'Vibration Trip (> 5.0 mm/s)',
          operator: '>',
          threshold: 5.0,
          field: 'value',
          unit: 'mm/s'
        }
      },
      {
        id: 'node-actuator-trip',
        type: 'machineActuator',
        position: { x: 780, y: 180 },
        data: {
          label: 'PLC Emergency Actuator',
          targetSystem: 'TURBINE_MAIN_PLC',
          action: 'EXECUTE_EMERGENCY_LOAD_REDUCTION',
          cooldownMs: 5000
        }
      }
    ],
    edges: [
      { id: 'e-vib-1', source: 'node-sensor-vib', target: 'node-comparator-vib', animated: true },
      { id: 'e-vib-2', source: 'node-comparator-vib', target: 'node-actuator-trip', animated: true }
    ]
  },
  {
    id: 'template-boiler-leak',
    name: 'Boiler Pressure Loss Leak Detection',
    description: 'Monitors Steam Drum Pressure and fires high-priority warning if pressure drops below 30.0 bar',
    category: 'Pressure Systems',
    active: false,
    nodes: [
      {
        id: 'node-sensor-boiler',
        type: 'sensorInput',
        position: { x: 80, y: 180 },
        data: {
          label: 'Boiler Pressure Transducer',
          deviceId: 'BOILER-02',
          sensorType: 'pressure',
          metric: 'Drum Pressure',
          unit: 'bar'
        }
      },
      {
        id: 'node-mavg-boiler',
        type: 'movingAverage',
        position: { x: 380, y: 180 },
        data: {
          label: 'Smoothing Filter',
          windowSize: 4,
          field: 'value'
        }
      },
      {
        id: 'node-comparator-boiler',
        type: 'thresholdComparator',
        position: { x: 680, y: 180 },
        data: {
          label: 'Pressure Drop (< 30.0 bar)',
          operator: '<',
          threshold: 30.0,
          field: 'movingAverage',
          unit: 'bar'
        }
      },
      {
        id: 'node-sms-boiler',
        type: 'smsAlert',
        position: { x: 980, y: 180 },
        data: {
          label: 'SMS Leak Dispatch',
          recipient: '+1 (555) 019-9481',
          severity: 'CRITICAL',
          message: 'BOILER PRESSURE DROP DETECTED: Steam Drum reading dropped to {{movingAverage}} bar. Potential valve leak.',
          cooldownMs: 4000
        }
      }
    ],
    edges: [
      { id: 'e-b-1', source: 'node-sensor-boiler', target: 'node-mavg-boiler', animated: true },
      { id: 'e-b-2', source: 'node-mavg-boiler', target: 'node-comparator-boiler', animated: true },
      { id: 'e-b-3', source: 'node-comparator-boiler', target: 'node-sms-boiler', animated: true }
    ]
  }
];

class PipelineController {
  static async getPipelines(req, res) {
    try {
      const db = getDB();
      let pipelines = await db.collection('pipelines').find().toArray();

      // Seed default templates into DB if empty
      if (pipelines.length === 0) {
        await db.collection('pipelines').insertMany(
          DEFAULT_TEMPLATES.map(t => ({
            ...t,
            createdAt: new Date(),
            updatedAt: new Date()
          }))
        );
        pipelines = await db.collection('pipelines').find().toArray();
      }

      // Annotate active status from running engine
      const activeIds = pipelineManager.getActivePipelineIds();
      const enriched = pipelines.map(p => ({
        ...p,
        active: activeIds.includes(p.id)
      }));

      res.json({ success: true, pipelines: enriched });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getPipelineById(req, res) {
    try {
      const db = getDB();
      const pipeline = await db.collection('pipelines').findOne({ id: req.params.id });
      if (!pipeline) {
        return res.status(404).json({ success: false, error: 'Pipeline not found' });
      }
      res.json({
        success: true,
        pipeline: {
          ...pipeline,
          active: pipelineManager.isPipelineActive(pipeline.id)
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async savePipeline(req, res) {
    try {
      const db = getDB();
      const { id, name, description, nodes, edges, active } = req.body;

      const pipelineId = id || `pipeline-${uuidv4().substring(0, 8)}`;
      const doc = {
        id: pipelineId,
        name: name || 'Untitled Flow',
        description: description || '',
        nodes: nodes || [],
        edges: edges || [],
        updatedAt: new Date()
      };

      await db.collection('pipelines').updateOne(
        { id: pipelineId },
        {
          $set: doc,
          $setOnInsert: { createdAt: new Date(), isDefault: false }
        },
        { upsert: true }
      );

      // If active requested or already active, recompile in engine
      if (active || pipelineManager.isPipelineActive(pipelineId)) {
        pipelineManager.deployPipeline(doc);
      }

      res.json({
        success: true,
        pipeline: {
          ...doc,
          active: pipelineManager.isPipelineActive(pipelineId)
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deployPipeline(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;

      let pipeline = await db.collection('pipelines').findOne({ id });
      if (!pipeline) {
        // Check template
        pipeline = DEFAULT_TEMPLATES.find(t => t.id === id);
        if (!pipeline) {
          return res.status(404).json({ success: false, error: 'Pipeline not found' });
        }
      }

      const result = pipelineManager.deployPipeline(pipeline);
      await db.collection('pipelines').updateOne({ id }, { $set: { active: true } });

      res.json({ success: true, message: 'Pipeline deployed to reactive engine', result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async stopPipeline(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;

      const stopped = pipelineManager.stopPipeline(id);
      await db.collection('pipelines').updateOne({ id }, { $set: { active: false } });

      res.json({ success: true, message: 'Pipeline execution stopped', stopped });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deletePipeline(req, res) {
    try {
      const db = getDB();
      const { id } = req.params;

      pipelineManager.stopPipeline(id);
      await db.collection('pipelines').deleteOne({ id });

      res.json({ success: true, message: 'Pipeline deleted' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getTemplates(req, res) {
    res.json({ success: true, templates: DEFAULT_TEMPLATES });
  }

  static async getPipelineStats(req, res) {
    try {
      const stats = pipelineManager.getAllStats();
      res.json({ success: true, stats });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = { PipelineController, DEFAULT_TEMPLATES };
