import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Activity, Gauge } from 'lucide-react';

export default function MovingAverageNode({ id, data, selected }) {
  const isPulsing = data._isPulsing;
  const liveAvg = data._liveAvg !== undefined ? data._liveAvg : '--';
  const windowSize = data.windowSize || 5;

  return (
    <div
      className={`relative min-w-[240px] rounded-xl border bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md transition-all duration-200 ${
        selected ? 'ring-2 ring-cyan-400 border-cyan-500 shadow-cyan-950/50' : 'border-slate-700/80 hover:border-slate-600'
      } ${isPulsing ? 'shadow-[0_0_20px_rgba(6,182,212,0.35)] border-cyan-400' : ''}`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />

      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-wide uppercase text-slate-400">Transform Node</h4>
            <div className="text-sm font-bold text-slate-100">{data.label || 'Moving Average'}</div>
          </div>
        </div>
      </div>

      {/* Body Metadata */}
      <div className="mt-2.5 space-y-1.5 text-xs text-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Sliding Window:</span>
          <span className="font-mono font-medium text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            {windowSize} samples
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Smoothing Algo:</span>
          <span className="font-medium text-slate-200">Sliding SMA (RxJS scan)</span>
        </div>
      </div>

      {/* Real-Time Value Badge */}
      <div className="mt-3 rounded-lg bg-slate-950/80 p-2 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Gauge className="h-3.5 w-3.5 text-cyan-400" />
          <span>Rolling Average:</span>
        </div>
        <div className="font-mono font-bold text-base text-cyan-400 flex items-baseline gap-1">
          <span>{liveAvg}</span>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />
    </div>
  );
}
