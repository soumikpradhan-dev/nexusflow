const express = require('express');
const router = express.Router();
const { AlertController } = require('../controllers/alertController');

router.get('/', AlertController.getAlerts);
router.post('/:id/ack', AlertController.acknowledgeAlert);

module.exports = router;
