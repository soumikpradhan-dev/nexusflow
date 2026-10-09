import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Sliders, CheckCircle2, XCircle } from 'lucide-react';

export default function ComparatorNode({ id, data, selected }) {
  const isPulsing = data._isPulsing;
  const passed = data._passed;
  const evalVal = data._evalVal !== undefined ? data._evalVal : '--';
  const operator = data.operator || '>';
  const threshold = data.threshold !== undefined ? data.threshold : 80;
  const unit = data.unit || '';

  return (
    <div
      className={`relative min-w-[240px] rounded-xl border bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md transition-all duration-200 ${
        selected ? 'ring-2 ring-amber-400 border-amber-500 shadow-amber-950/50' : 'border-slate-700/80 hover:border-slate-600'
      } ${isPulsing ? 'shadow-[0_0_20px_rgba(245,158,11,0.45)] border-amber-400' : ''}`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />

      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-wide uppercase text-slate-400">Rule Logic</h4>
            <div className="text-sm font-bold text-slate-100">{data.label || 'Threshold Filter'}</div>
          </div>
        </div>
      </div>

      {/* Body Metadata */}
      <div className="mt-2.5 space-y-1.5 text-xs text-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Condition:</span>
          <span className="font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
            {operator} {threshold} {unit}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Target Field:</span>
          <span className="font-medium text-slate-200">{data.field || 'movingAverage'}</span>
        </div>
      </div>

      {/* Real-Time Value Badge */}
      <div className="mt-3 rounded-lg bg-slate-950/80 p-2 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          {passed ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-slate-500" />
          )}
          <span>Eval State:</span>
        </div>
        <div className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
          passed ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
        }`}>
          {passed ? `TRIGGERED (${evalVal})` : 'IDLE / FILTERED'}
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />
    </div>
  );
}
