import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitMerge } from 'lucide-react';

export default function LogicGateNode({ id, data, selected }) {
  const isPulsing = data._isPulsing;
  const gateType = (data.gateType || 'AND').toUpperCase();

  return (
    <div
      className={`relative min-w-[220px] rounded-xl border bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md transition-all duration-200 ${
        selected ? 'ring-2 ring-violet-400 border-violet-500 shadow-violet-950/50' : 'border-slate-700/80 hover:border-slate-600'
      } ${isPulsing ? 'shadow-[0_0_20px_rgba(139,92,246,0.35)] border-violet-400' : ''}`}
    >
      <Handle type="target" position={Position.Left} id="in" className="!w-3 !h-3 !bg-violet-400 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400">
            <GitMerge className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-wide uppercase text-slate-400">Gate</h4>
            <div className="text-sm font-bold text-slate-100">{data.label || 'Logic Combiner'}</div>
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-300">
        <span className="text-slate-400">Operation:</span>
        <span className="font-mono font-bold text-violet-300 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-800/40">
          LOGICAL {gateType}
        </span>
      </div>
      <div className="mt-3 rounded-lg bg-slate-950/80 p-2 border border-slate-800 text-center">
        <span className="text-xs font-mono text-violet-400 font-semibold">
          {gateType === 'AND' ? 'All Inputs Must Pass' : 'Any Input Passes'}
        </span>
      </div>
      <Handle type="source" position={Position.Right} id="out" className="!w-3 !h-3 !bg-violet-400 !border-2 !border-slate-900" />
    </div>
  );
}
