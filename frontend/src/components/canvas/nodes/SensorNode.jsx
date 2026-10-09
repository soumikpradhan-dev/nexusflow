import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Radio, Cpu, Activity } from 'lucide-react';

export default function SensorNode({ id, data, selected }) {
  const isPulsing = data._isPulsing;
  const liveVal = data._liveValue !== undefined ? data._liveValue : '--';
  const unit = data.unit || '°C';

  return (
    <div
      className={`relative min-w-[240px] rounded-xl border bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md transition-all duration-200 ${
        selected ? 'ring-2 ring-emerald-400 border-emerald-500 shadow-emerald-950/50' : 'border-slate-700/80 hover:border-slate-600'
      } ${isPulsing ? 'shadow-[0_0_20px_rgba(16,185,129,0.35)] border-emerald-400' : ''}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-wide uppercase text-slate-400">Source Node</h4>
            <div className="text-sm font-bold text-slate-100">{data.label || 'Sensor Input'}</div>
          </div>
        </div>
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
      </div>

      {/* Body Metadata */}
      <div className="mt-2.5 space-y-1.5 text-xs text-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Device:</span>
          <span className="font-mono font-medium text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            {data.deviceId || 'TURBINE-01'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Sensor:</span>
          <span className="font-medium text-slate-200 capitalize">
            {data.sensorType || 'temperature'} ({unit})
          </span>
        </div>
      </div>

      {/* Real-Time Value Badge */}
      <div className="mt-3 rounded-lg bg-slate-950/80 p-2 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span>Real-Time Stream:</span>
        </div>
        <div className="font-mono font-bold text-base text-emerald-400 flex items-baseline gap-1">
          <span>{liveVal}</span>
          <span className="text-xs text-emerald-500/80">{unit}</span>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />
    </div>
  );
}
