import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant
} from '@xyflow/react';

import SensorNode from './nodes/SensorNode';
import MovingAverageNode from './nodes/MovingAverageNode';
import ComparatorNode from './nodes/ComparatorNode';
import RateOfChangeNode from './nodes/RateOfChangeNode';
import LogicGateNode from './nodes/LogicGateNode';
import ActionNode from './nodes/ActionNode';
import AnimatedDataEdge from './edges/AnimatedDataEdge';

import NodePalette from './NodePalette';
import NodeConfigDrawer from './NodeConfigDrawer';
import PipelineToolbar from './PipelineToolbar';

const nodeTypes = {
  sensorInput: SensorNode,
  sensorNode: SensorNode,
  movingAverage: MovingAverageNode,
  movingAverageNode: MovingAverageNode,
  thresholdComparator: ComparatorNode,
  comparatorNode: ComparatorNode,
  rateOfChange: RateOfChangeNode,
  rateOfChangeNode: RateOfChangeNode,
  logicGate: LogicGateNode,
  smsAlert: ActionNode,
  machineActuator: ActionNode,
  actionNode: ActionNode
};

const edgeTypes = {
  animated: AnimatedDataEdge,
  default: AnimatedDataEdge
};

export default function VisualGraphBuilder({
  currentPipeline,
  isActive,
  templates,
  onDeploy,
  onStop,
  onSave,
  onLoadTemplate,
  onInjectAnomaly,
  latestNodePulses,
  latestAlert
}) {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(currentPipeline?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(currentPipeline?.edges || []);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [pipelineName, setPipelineName] = useState(currentPipeline?.name || 'Untitled Pipeline');

  // Sync state when currentPipeline changes externally (e.g. template loaded)
  useEffect(() => {
    if (currentPipeline) {
      setNodes(currentPipeline.nodes || []);
      setEdges(currentPipeline.edges || []);
      setPipelineName(currentPipeline.name || 'Untitled Pipeline');
    }
  }, [currentPipeline, setNodes, setEdges]);

  // Handle incoming live node pulses from the RxJS Stream Engine
  useEffect(() => {
    if (!latestNodePulses || latestNodePulses.length === 0) return;
    const latest = latestNodePulses[latestNodePulses.length - 1];
    if (!latest || !latest.nodeId) return;

    setNodes(nds =>
      nds.map(node => {
        if (node.id === latest.nodeId) {
          const updatedData = { ...node.data, _isPulsing: true };

          if (latest.value !== undefined) updatedData._liveValue = latest.value;
          if (latest.movingAverage !== undefined) updatedData._liveAvg = latest.movingAverage;
          if (latest.passed !== undefined) {
            updatedData._passed = latest.passed;
            updatedData._evalVal = latest.evaluatedValue;
          }
          if (latest.rateOfChange !== undefined) updatedData._liveRate = latest.rateOfChange;
          if (latest.isActionTrigger) {
            updatedData._fireCount = (updatedData._fireCount || 0) + 1;
          }

          return { ...node, data: updatedData };
        }
        return node;
      })
    );

    // Turn off pulse after 350ms
    const timer = setTimeout(() => {
      setNodes(nds =>
        nds.map(node =>
          node.id === latest.nodeId
            ? { ...node, data: { ...node.data, _isPulsing: false } }
            : node
        )
      );
    }, 350);

    return () => clearTimeout(timer);
  }, [latestNodePulses, setNodes]);

  // Handle alert trigger pulse on action nodes
  useEffect(() => {
    if (!latestAlert || !latestAlert.nodeId) return;
    setNodes(nds =>
      nds.map(node => {
        if (node.id === latestAlert.nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              _isPulsing: true,
              _fireCount: (node.data._fireCount || 0) + 1
            }
          };
        }
        return node;
      })
    );
  }, [latestAlert, setNodes]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, type: 'animated' }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData) return;

      const item = JSON.parse(rawData);
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 40
      };

      const newNode = {
        id: `node-${Date.now()}`,
        type: item.type,
        position,
        data: {
          ...item.defaultData,
          label: item.label
        }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleUpdateNode = useCallback(
    (nodeId, newData) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: newData } : n))
      );
    },
    [setNodes]
  );

  const handleDeleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNodeId(null);
    },
    [setNodes, setEdges]
  );

  const handleSave = () => {
    const updated = {
      ...currentPipeline,
      name: pipelineName,
      nodes,
      edges
    };
    onSave(updated);
  };

  const handleDeploy = () => {
    const updated = {
      ...currentPipeline,
      name: pipelineName,
      nodes,
      edges
    };
    onDeploy(updated);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="flex h-full flex-col bg-slate-950 overflow-hidden">
      {/* Top Toolbar */}
      <PipelineToolbar
        pipeline={{ ...currentPipeline, name: pipelineName }}
        isActive={isActive}
        templates={templates}
        onDeploy={handleDeploy}
        onStop={onStop}
        onSave={handleSave}
        onLoadTemplate={onLoadTemplate}
        onClear={() => {
          setNodes([]);
          setEdges([]);
        }}
        onInjectAnomaly={onInjectAnomaly}
        onNameChange={setPipelineName}
      />

      {/* Main Canvas Area */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Palette */}
        <NodePalette />

        {/* Center Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            defaultEdgeOptions={{ animated: true, type: 'animated' }}
            className="bg-slate-950"
          >
            <Background color="#1e293b" gap={20} size={1.5} variant={BackgroundVariant.Dots} />
            <Controls className="!bg-slate-900 !border-slate-800 !fill-slate-300" />
            <MiniMap
              nodeColor={(n) => {
                if (n.type.includes('sensor')) return '#10b981';
                if (n.type.includes('movingAverage')) return '#06b6d4';
                if (n.type.includes('threshold') || n.type.includes('comparator')) return '#f59e0b';
                if (n.type.includes('sms') || n.type.includes('action')) return '#f43f5e';
                return '#8b5cf6';
              }}
              className="!bg-slate-900/90 !border-slate-800 rounded-lg overflow-hidden"
              maskColor="rgba(15, 23, 42, 0.7)"
            />
          </ReactFlow>

          {/* Quick instructions overlay */}
          <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-slate-900/80 px-3 py-1.5 text-[11px] text-slate-400 border border-slate-800 backdrop-blur pointer-events-none">
            ⚡ Drag nodes from left sidebar &bull; Connect output handles to inputs &bull; Click any node to configure
          </div>
        </div>

        {/* Right Properties Drawer */}
        {selectedNode && (
          <NodeConfigDrawer
            selectedNode={selectedNode}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>
    </div>
  );
}
