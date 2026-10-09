const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/db');

class AlertService {
  constructor() {
    this.eventEmitter = null;
    this.recentAlerts = [];
  }

  setEventEmitter(emitter) {
    this.eventEmitter = emitter;
  }

  /**
   * Handle an action trigger from the RxJS Stream Compiler
   */
  async handleTrigger(trigger) {
    const { pipelineId, nodeId, node, data, timestamp } = trigger;
    const db = getDB();

    const deviceId = data.metadata?.deviceId || 'UNKNOWN';
    const sensorType = data.metadata?.sensorType || 'sensor';
    const value = data.value;
    const movingAverage = data.movingAverage;
    const unit = data.metadata?.unit || '';

    let alertType = 'ALERT';
    let details = {};

    if (node.type === 'smsAlert' || node.type === 'actionNode') {
      alertType = 'SMS_ALERT';
      const template = node.data?.message || 'Warning: Anomaly detected on {{deviceId}}. Current reading: {{value}} {{unit}}';
      const recipient = node.data?.recipient || '+1 (555) 019-2834';
      const severity = node.data?.severity || 'CRITICAL';

      // Interpolate message template
      const formattedMessage = template
        .replace(/{{deviceId}}/g, deviceId)
        .replace(/{{sensorType}}/g, sensorType)
        .replace(/{{value}}/g, value)
        .replace(/{{movingAverage}}/g, movingAverage !== undefined ? movingAverage : value)
        .replace(/{{unit}}/g, unit);

      // Simulated SMS Gateway Dispatch (Twilio / AWS SNS carrier emulation)
      const smsDispatch = {
        sid: `SM${uuidv4().replace(/-/g, '').substring(0, 24)}`,
        carrier: 'Nexmo/Twilio IoT Gateway',
        to: recipient,
        body: formattedMessage,
        status: 'DELIVERED',
        dispatchedAt: new Date(),
        networkLatencyMs: Math.floor(Math.random() * 30) + 25
      };

      details = {
        recipient,
        severity,
        message: formattedMessage,
        smsDispatch
      };
    } else if (node.type === 'machineActuator') {
      alertType = 'ACTUATOR_COMMAND';
      const action = node.data?.action || 'ENGAGE_COOLING_VALVE';
      const targetSystem = node.data?.targetSystem || 'PLANT_SCADA_PLC';

      details = {
        action,
        targetSystem,
        status: 'EXECUTED',
        ackCode: `ACK_PLC_${Date.now()}`
      };
    } else {
      alertType = node.type.toUpperCase();
      details = node.data || {};
    }

    const alertDoc = {
      alertId: uuidv4(),
      pipelineId,
      nodeId,
      alertType,
      deviceId,
      sensorType,
      value,
      movingAverage,
      unit,
      timestamp: timestamp || new Date(),
      status: 'ACTIVE',
      details
    };

    try {
      await db.collection('alerts').insertOne(alertDoc);
    } catch (err) {
      console.error('[AlertService] Failed to persist alert to MongoDB:', err.message);
    }

    this.recentAlerts.unshift(alertDoc);
    if (this.recentAlerts.length > 50) this.recentAlerts.pop();

    if (this.eventEmitter) {
      this.eventEmitter.emitAlert(alertDoc);
    }

    return alertDoc;
  }

  async getRecentAlerts({ limit = 30, deviceId, status }) {
    const db = getDB();
    const query = {};
    if (deviceId && deviceId !== 'ALL') query.deviceId = deviceId;
    if (status) query.status = status;

    return await db.collection('alerts')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10))
      .toArray();
  }

  async acknowledgeAlert(alertId, notes = '') {
    const db = getDB();
    const result = await db.collection('alerts').updateOne(
      { alertId },
      {
        $set: {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date(),
          notes
        }
      }
    );
    return result.modifiedCount > 0;
  }
}

const alertService = new AlertService();
module.exports = { alertService };
