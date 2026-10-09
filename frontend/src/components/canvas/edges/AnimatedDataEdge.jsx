import React from 'react';
import { BaseEdge, getSmoothStepPath } from '@xyflow/react';

export default function AnimatedDataEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd
}) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16
  });

  return (
    <>
      {/* Background glow stroke */}
      <path
        id={`${id}-glow`}
        d={edgePath}
        fill="none"
        stroke="rgba(16, 185, 129, 0.25)"
        strokeWidth={7}
        className="react-flow__edge-glow"
      />
      {/* Main animated data beam */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: '#10b981',
          strokeWidth: 2.5,
          strokeDasharray: '6, 6',
          animation: 'dataPulse 1.2s linear infinite'
        }}
      />
      <style>{`
        @keyframes dataPulse {
          from {
            stroke-dashoffset: 24;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </>
  );
}
