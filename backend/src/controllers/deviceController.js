const { getDB } = require('../config/db');
const { DEVICES } = require('../config/constants');

class DeviceController {
  static async getDevices(req, res) {
    try {
      const db = getDB();
      const devices = await db.collection('devices').find().toArray();
      res.json({ success: true, devices: devices.length > 0 ? devices : DEVICES });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getDeviceById(req, res) {
    try {
      const db = getDB();
      const device = await db.collection('devices').findOne({ id: req.params.id });
      if (!device) {
        return res.status(404).json({ success: false, error: 'Device not found' });
      }
      res.json({ success: true, device });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = { DeviceController };
