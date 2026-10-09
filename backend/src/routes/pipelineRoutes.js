const express = require('express');
const router = express.Router();
const { PipelineController } = require('../controllers/pipelineController');

router.get('/templates', PipelineController.getTemplates);
router.get('/stats', PipelineController.getPipelineStats);
router.get('/', PipelineController.getPipelines);
router.get('/:id', PipelineController.getPipelineById);
router.post('/', PipelineController.savePipeline);
router.post('/:id/deploy', PipelineController.deployPipeline);
router.post('/:id/stop', PipelineController.stopPipeline);
router.delete('/:id', PipelineController.deletePipeline);

module.exports = router;
