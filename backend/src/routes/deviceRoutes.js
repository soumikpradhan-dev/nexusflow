const express = require('express');
const router = express.Router();
const { DeviceController } = require('../controllers/deviceController');

router.get('/', DeviceController.getDevices);
router.get('/:id', DeviceController.getDeviceById);

module.exports = router;
