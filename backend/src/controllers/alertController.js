const { alertService } = require('../services/alertService');

class AlertController {
  static async getAlerts(req, res) {
    try {
      const { limit, deviceId, status } = req.query;
      const alerts = await alertService.getRecentAlerts({
        limit: limit || 50,
        deviceId,
        status
      });
      res.json({ success: true, count: alerts.length, alerts });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async acknowledgeAlert(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const ok = await alertService.acknowledgeAlert(id, notes);
      if (!ok) {
        return res.status(404).json({ success: false, error: 'Alert not found or already acknowledged' });
      }
      res.json({ success: true, message: 'Alert acknowledged' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = { AlertController };
