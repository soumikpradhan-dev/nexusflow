const { filter, tap, throttleTime } = require('rxjs/operators');
const { NODE_TYPES } = require('../config/constants');
const { movingAverage } = require('./operators/movingAverage');
const { thresholdFilter } = require('./operators/thresholdFilter');
const { rateOfChange } = require('./operators/rateOfChange');
const { anomalyDetector } = require('./operators/anomalyDetector');
const { createLogicGate } = require('./operators/logicGate');

class StreamCompiler {
  /**
   * Compiles a visual node-and-edge graph into an executable RxJS pipeline
   * @param {Object} graph - { id, name, nodes, edges }
   * @param {Subject} telemetry$ - Central telemetry stream
   * @param {Function} onNodeEvent - Callback when data passes through a node
   * @param {Function} onActionTrigger - Callback when an action/sink node fires
   * @returns {Object} { subscription, stats, validation }
   */
  static compile(graph, telemetry$, onNodeEvent, onActionTrigger) {
    const { id: pipelineId, nodes = [], edges = [] } = graph;

    // 1. Validation
    const validation = this.validateGraph(nodes, edges);
    if (!validation.valid) {
      throw new Error(`Graph validation error: ${validation.errors.join(', ')}`);
    }

    // 2. Build graph maps
    const nodeMap = new Map();
    const incomingEdges = new Map(); // targetId -> [sourceId, ...]
    const outgoingEdges = new Map(); // sourceId -> [targetId, ...]

    nodes.forEach(node => {
      nodeMap.set(node.id, node);
      incomingEdges.set(node.id, []);
      outgoingEdges.set(node.id, []);
    });

    edges.forEach(edge => {
      if (incomingEdges.has(edge.target)) {
        incomingEdges.get(edge.target).push(edge.source);
      }
      if (outgoingEdges.has(edge.source)) {
        outgoingEdges.get(edge.source).push(edge.target);
      }
    });

    // 3. Topological sort
    const executionOrder = this.topologicalSort(nodes, incomingEdges, outgoingEdges);

    // 4. Create Observable streams for each node
    const streamMap = new Map(); // nodeId -> Observable
    const nodeStats = new Map(); // nodeId -> { processedCount, triggeredCount, lastTimestamp }

    nodes.forEach(n => {
      nodeStats.set(n.id, { processedCount: 0, triggeredCount: 0, lastTimestamp: null });
    });

    const pipelineStats = {
      pipelineId,
      totalIngested: 0,
      totalAlerts: 0,
      startTime: new Date(),
      lastActive: new Date()
    };

    // Build streams according to execution order
    for (const nodeId of executionOrder) {
      const node = nodeMap.get(nodeId);
      const parents = incomingEdges.get(nodeId) || [];

      let node$ = null;

      if (node.type === NODE_TYPES.SENSOR_INPUT || node.type === 'sensorNode' || node.type === 'sensorInput') {
        // Root / Sensor Node: filters from master telemetry stream
        const deviceId = node.data?.deviceId;
        const sensorType = node.data?.sensorType;

        node$ = telemetry$.pipe(
          filter(data => {
            if (!data || !data.metadata) return false;
            if (deviceId && deviceId !== 'ALL' && data.metadata.deviceId !== deviceId) {
              return false;
            }
            if (sensorType && sensorType !== 'ALL' && data.metadata.sensorType !== sensorType) {
              return false;
            }
            return true;
          }),
          tap(item => {
            pipelineStats.totalIngested++;
            pipelineStats.lastActive = new Date();
            const stats = nodeStats.get(nodeId);
            stats.processedCount++;
            stats.lastTimestamp = new Date();

            if (onNodeEvent) {
              onNodeEvent({
                pipelineId,
                nodeId,
                nodeType: node.type,
                timestamp: new Date(),
                value: item.value,
                unit: item.metadata?.unit || '',
                deviceId: item.metadata?.deviceId,
                displayValue: `${item.value} ${item.metadata?.unit || ''}`
              });
            }
          })
        );
      } else if (node.type === NODE_TYPES.LOGIC_GATE || node.type === 'logicGate') {
        // Logic Gate node: combines parents
        const parentStreams = parents.map(pid => streamMap.get(pid)).filter(Boolean);
        if (parentStreams.length === 0) continue;

        node$ = createLogicGate(parentStreams, node.data).pipe(
          tap(item => {
            const stats = nodeStats.get(nodeId);
            stats.processedCount++;
            stats.lastTimestamp = new Date();

            if (onNodeEvent) {
              onNodeEvent({
                pipelineId,
                nodeId,
                nodeType: node.type,
                timestamp: new Date(),
                value: item.value,
                displayValue: item._displayValue || 'LOGIC SATISFIED'
              });
            }
          })
        );
      } else {
        // Single parent / intermediate or sink node
        const primaryParentId = parents[0];
        const parent$ = primaryParentId ? streamMap.get(primaryParentId) : null;

        if (!parent$) {
          console.warn(`[StreamCompiler] Node ${nodeId} (${node.type}) has no parent stream.`);
          continue;
        }

        switch (node.type) {
          case NODE_TYPES.MOVING_AVERAGE:
          case 'movingAverageNode':
          case 'movingAverage':
            node$ = parent$.pipe(
              movingAverage(node.data),
              tap(item => {
                const stats = nodeStats.get(nodeId);
                stats.processedCount++;
                stats.lastTimestamp = new Date();

                if (onNodeEvent) {
                  onNodeEvent({
                    pipelineId,
                    nodeId,
                    nodeType: node.type,
                    timestamp: new Date(),
                    movingAverage: item.movingAverage,
                    rawVal: item.value,
                    displayValue: item._displayValue
                  });
                }
              })
            );
            break;

          case NODE_TYPES.THRESHOLD_COMPARATOR:
          case 'comparatorNode':
          case 'thresholdComparator':
            node$ = parent$.pipe(
              thresholdFilter(node.data),
              tap(item => {
                const stats = nodeStats.get(nodeId);
                stats.processedCount++;
                stats.triggeredCount++;
                stats.lastTimestamp = new Date();

                if (onNodeEvent) {
                  onNodeEvent({
                    pipelineId,
                    nodeId,
                    nodeType: node.type,
                    timestamp: new Date(),
                    passed: true,
                    evaluatedValue: item._comparatorResult?.evaluatedValue,
                    displayValue: item._displayValue
                  });
                }
              })
            );
            break;

          case NODE_TYPES.RATE_OF_CHANGE:
          case 'rateOfChangeNode':
          case 'rateOfChange':
            node$ = parent$.pipe(
              rateOfChange(node.data),
              tap(item => {
                const stats = nodeStats.get(nodeId);
                stats.processedCount++;
                stats.triggeredCount++;
                stats.lastTimestamp = new Date();

                if (onNodeEvent) {
                  onNodeEvent({
                    pipelineId,
                    nodeId,
                    nodeType: node.type,
                    timestamp: new Date(),
                    rateOfChange: item.rateOfChange,
                    displayValue: item._displayValue
                  });
                }
              })
            );
            break;

          case NODE_TYPES.ANOMALY_DETECTOR:
          case 'anomalyDetectorNode':
          case 'anomalyDetector':
            node$ = parent$.pipe(
              anomalyDetector(node.data),
              tap(item => {
                const stats = nodeStats.get(nodeId);
                stats.processedCount++;
                stats.triggeredCount++;
                stats.lastTimestamp = new Date();

                if (onNodeEvent) {
                  onNodeEvent({
                    pipelineId,
                    nodeId,
                    nodeType: node.type,
                    timestamp: new Date(),
                    zScore: item.anomaly?.zScore,
                    displayValue: item._displayValue
                  });
                }
              })
            );
            break;

          case NODE_TYPES.SMS_ALERT:
          case NODE_TYPES.MACHINE_ACTUATOR:
          case NODE_TYPES.WEBHOOK:
          case NODE_TYPES.LOG_SINK:
          case 'actionNode':
          case 'smsAlert':
          case 'machineActuator':
            // Action sinks with configurable throttle / cooldown (default 3000ms)
            const cooldownMs = node.data?.cooldownMs !== undefined ? parseInt(node.data.cooldownMs, 10) : 3000;
            node$ = parent$.pipe(
              throttleTime(cooldownMs),
              tap(item => {
                pipelineStats.totalAlerts++;
                const stats = nodeStats.get(nodeId);
                stats.triggeredCount++;
                stats.lastTimestamp = new Date();

                if (onNodeEvent) {
                  onNodeEvent({
                    pipelineId,
                    nodeId,
                    nodeType: node.type,
                    timestamp: new Date(),
                    isActionTrigger: true,
                    actionType: node.type,
                    displayValue: `ACTION TRIGGERED: ${node.data?.label || node.type}`
                  });
                }

                if (onActionTrigger) {
                  onActionTrigger({
                    pipelineId,
                    nodeId,
                    node,
                    data: item,
                    timestamp: new Date()
                  });
                }
              })
            );
            break;

          default:
            console.warn(`[StreamCompiler] Unhandled node type: ${node.type}`);
            node$ = parent$;
            break;
        }
      }

      if (node$) {
        streamMap.set(nodeId, node$);
      }
    }

    // Find all terminal/action sink nodes to subscribe to
    const terminalNodes = nodes.filter(n => {
      const outgoing = outgoingEdges.get(n.id) || [];
      return (
        outgoing.length === 0 ||
        [NODE_TYPES.SMS_ALERT, NODE_TYPES.MACHINE_ACTUATOR, NODE_TYPES.WEBHOOK, 'actionNode', 'smsAlert', 'machineActuator'].includes(n.type)
      );
    });

    const subscriptions = [];

    // Subscribe to all terminal node streams to drive the reactive pipeline
    for (const termNode of terminalNodes) {
      const termStream$ = streamMap.get(termNode.id);
      if (termStream$) {
        const sub = termStream$.subscribe({
          error: (err) => console.error(`[StreamCompiler] Error in node ${termNode.id}:`, err)
        });
        subscriptions.push(sub);
      }
    }

    return {
      pipelineId,
      pipelineStats,
      nodeStats,
      unsubscribe: () => {
        subscriptions.forEach(s => s.unsubscribe());
      }
    };
  }

  /**
   * Validates topological integrity and required rules
   */
  static validateGraph(nodes, edges) {
    const errors = [];
    if (!nodes || nodes.length === 0) {
      return { valid: false, errors: ['Graph has no nodes'] };
    }

    const sensorNodes = nodes.filter(n =>
      n.type === NODE_TYPES.SENSOR_INPUT || n.type === 'sensorNode' || n.type === 'sensorInput'
    );
    if (sensorNodes.length === 0) {
      errors.push('Pipeline must have at least one Sensor Input node');
    }

    const actionNodes = nodes.filter(n =>
      [NODE_TYPES.SMS_ALERT, NODE_TYPES.MACHINE_ACTUATOR, NODE_TYPES.WEBHOOK, NODE_TYPES.LOG_SINK, 'actionNode', 'smsAlert', 'machineActuator'].includes(n.type)
    );
    if (actionNodes.length === 0) {
      errors.push('Pipeline must have at least one Action / Sink node (e.g. SMS Alert or Machine Actuator)');
    }

    // Check for cycles
    if (this.hasCycle(nodes, edges)) {
      errors.push('Pipeline contains a cyclic dependency, which is not permitted in DAG streams');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Cycle detection using DFS
   */
  static hasCycle(nodes, edges) {
    const adj = new Map();
    nodes.forEach(n => adj.set(n.id, []));
    edges.forEach(e => {
      if (adj.has(e.source)) {
        adj.get(e.source).push(e.target);
      }
    });

    const visited = new Set();
    const recStack = new Set();

    function dfs(nodeId) {
      visited.add(nodeId);
      recStack.add(nodeId);

      const neighbors = adj.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    }

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) return true;
      }
    }
    return false;
  }

  /**
   * Kahn's algorithm or DFS topological sort
   */
  static topologicalSort(nodes, incomingEdges, outgoingEdges) {
    const inDegree = new Map();
    nodes.forEach(n => {
      inDegree.set(n.id, (incomingEdges.get(n.id) || []).length);
    });

    const queue = [];
    nodes.forEach(n => {
      if (inDegree.get(n.id) === 0) {
        queue.push(n.id);
      }
    });

    const result = [];
    while (queue.length > 0) {
      const curr = queue.shift();
      result.push(curr);

      const targets = outgoingEdges.get(curr) || [];
      targets.forEach(tgt => {
        const deg = inDegree.get(tgt) - 1;
        inDegree.set(tgt, deg);
        if (deg === 0) {
          queue.push(tgt);
        }
      });
    }

    return result;
  }
}

module.exports = { StreamCompiler };
