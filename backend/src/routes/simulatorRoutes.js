const express = require('express');
const router = express.Router();
const { SimulatorController } = require('../controllers/simulatorController');

router.get('/status', SimulatorController.getStatus);
router.post('/start', SimulatorController.start);
router.post('/stop', SimulatorController.stop);
router.post('/rate', SimulatorController.setRate);
router.post('/inject', SimulatorController.injectAnomaly);
router.post('/clear', SimulatorController.clearAnomaly);

module.exports = router;
