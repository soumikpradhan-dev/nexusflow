const { Subject } = require('rxjs');
const { StreamCompiler } = require('./streamCompiler');

class PipelineManager {
  constructor() {
    this.telemetry$ = new Subject();
    this.activePipelines = new Map(); // id -> compiledPipeline
    this.pipelineMetadata = new Map(); // id -> graph
    this.eventEmitter = null; // Socket.io or event callback
    this.actionHandler = null; // AlertService / Actuator callback
  }

  setEventEmitter(emitter) {
    this.eventEmitter = emitter;
  }

  setActionHandler(handler) {
    this.actionHandler = handler;
  }

  /**
   * Pushes raw telemetry point into the central stream
   */
  ingest(point) {
    this.telemetry$.next(point);
  }

  /**
   * Activates / compiles a visual pipeline
   */
  deployPipeline(graph) {
    if (!graph || !graph.id) {
      throw new Error('Pipeline graph must have an ID');
    }

    // Stop existing instance if already running
    if (this.activePipelines.has(graph.id)) {
      this.stopPipeline(graph.id);
    }

    console.log(`[PipelineManager] Compiling and deploying pipeline: ${graph.name || graph.id}`);

    const onNodeEvent = (event) => {
      if (this.eventEmitter) {
        this.eventEmitter.emitNodePulse(event);
      }
    };

    const onActionTrigger = (trigger) => {
      console.log(`[PipelineManager] Action triggered for pipeline ${trigger.pipelineId}:`, trigger.node.data?.label || trigger.node.type);
      if (this.actionHandler) {
        this.actionHandler(trigger);
      }
    };

    const compiled = StreamCompiler.compile(
      graph,
      this.telemetry$,
      onNodeEvent,
      onActionTrigger
    );

    this.activePipelines.set(graph.id, compiled);
    this.pipelineMetadata.set(graph.id, graph);

    return {
      status: 'DEPLOYED',
      pipelineId: graph.id,
      name: graph.name
    };
  }

  stopPipeline(pipelineId) {
    if (this.activePipelines.has(pipelineId)) {
      const instance = this.activePipelines.get(pipelineId);
      instance.unsubscribe();
      this.activePipelines.delete(pipelineId);
      console.log(`[PipelineManager] Stopped pipeline: ${pipelineId}`);
      return true;
    }
    return false;
  }

  isPipelineActive(pipelineId) {
    return this.activePipelines.has(pipelineId);
  }

  getActivePipelineIds() {
    return Array.from(this.activePipelines.keys());
  }

  getPipelineStats(pipelineId) {
    const instance = this.activePipelines.get(pipelineId);
    if (!instance) return null;
    return {
      stats: instance.pipelineStats,
      nodeStats: Object.fromEntries(instance.nodeStats)
    };
  }

  getAllStats() {
    const result = {};
    for (const [id, instance] of this.activePipelines.entries()) {
      result[id] = {
        name: this.pipelineMetadata.get(id)?.name,
        stats: instance.pipelineStats,
        nodeStats: Object.fromEntries(instance.nodeStats)
      };
    }
    return result;
  }
}

const pipelineManager = new PipelineManager();
module.exports = { pipelineManager, PipelineManager };
