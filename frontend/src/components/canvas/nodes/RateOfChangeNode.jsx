import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { TrendingUp } from 'lucide-react';

export default function RateOfChangeNode({ id, data, selected }) {
  const isPulsing = data._isPulsing;
  const maxRate = data.maxRate || 5.0;
  const liveRate = data._liveRate !== undefined ? data._liveRate : '--';

  return (
    <div
      className={`relative min-w-[240px] rounded-xl border bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md transition-all duration-200 ${
        selected ? 'ring-2 ring-purple-400 border-purple-500 shadow-purple-950/50' : 'border-slate-700/80 hover:border-slate-600'
      } ${isPulsing ? 'shadow-[0_0_20px_rgba(168,85,247,0.35)] border-purple-400' : ''}`}
    >
      <Handle type="target" position={Position.Left} id="in" className="!w-3 !h-3 !bg-purple-400 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-wide uppercase text-slate-400">Transform</h4>
            <div className="text-sm font-bold text-slate-100">{data.label || 'Rate of Change'}</div>
          </div>
        </div>
      </div>
      <div className="mt-2.5 space-y-1.5 text-xs text-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Max Δ Rate:</span>
          <span className="font-mono font-medium text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
            &gt; {maxRate} / sec
          </span>
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-slate-950/80 p-2 border border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400">Current Δ:</span>
        <span className="font-mono font-bold text-sm text-purple-400">{liveRate}</span>
      </div>
      <Handle type="source" position={Position.Right} id="out" className="!w-3 !h-3 !bg-purple-400 !border-2 !border-slate-900" />
    </div>
  );
}
