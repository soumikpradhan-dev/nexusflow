const express = require('express');
const router = express.Router();
const { TelemetryController } = require('../controllers/telemetryController');

router.post('/ingest', TelemetryController.ingest);
router.get('/history', TelemetryController.getHistory);
router.get('/aggregate', TelemetryController.getAggregate);
router.get('/metrics', TelemetryController.getMetrics);

module.exports = router;
