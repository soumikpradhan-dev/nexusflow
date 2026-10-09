import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageSquare, ShieldAlert, Webhook, BellRing } from 'lucide-react';

export default function ActionNode({ id, data, selected }) {
  const isPulsing = data._isPulsing;
  const isSms = data.actionType === 'smsAlert' || data.recipient !== undefined || id.includes('sms');
  const fireCount = data._fireCount || 0;

  return (
    <div
      className={`relative min-w-[250px] rounded-xl border bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md transition-all duration-200 ${
        selected ? 'ring-2 ring-rose-400 border-rose-500 shadow-rose-950/50' : 'border-slate-700/80 hover:border-slate-600'
      } ${isPulsing ? 'shadow-[0_0_25px_rgba(244,63,94,0.6)] border-rose-400 animate-pulse' : ''}`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!w-3 !h-3 !bg-rose-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />

      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
            {isSms ? <MessageSquare className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-wide uppercase text-slate-400">Sink Node</h4>
            <div className="text-sm font-bold text-slate-100">{data.label || (isSms ? 'SMS Alert' : 'Actuator')}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-rose-950/80 text-rose-300 border border-rose-800/40 text-[10px] font-mono px-1.5 py-0.5 rounded">
          <BellRing className="h-3 w-3" />
          <span>{fireCount}</span>
        </div>
      </div>

      {/* Body Metadata */}
      <div className="mt-2.5 space-y-1.5 text-xs text-slate-300">
        {isSms ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Recipient:</span>
              <span className="font-mono font-medium text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/30">
                {data.recipient || '+1 (555) 019-2834'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Gateway:</span>
              <span className="font-medium text-slate-300">Nexmo / Twilio SMS</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 italic line-clamp-2 bg-slate-950/50 p-1.5 rounded border border-slate-800/60">
              "{data.message ? data.message.substring(0, 60) + '...' : 'CRITICAL ALERT dispatched to manager'}"
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Target System:</span>
              <span className="font-mono font-medium text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/30">
                {data.targetSystem || 'SCADA_PLC_VALVE'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Action:</span>
              <span className="font-medium text-slate-200">{data.action || 'EXECUTE_TRIP'}</span>
            </div>
          </>
        )}
      </div>

      {/* Status Bar */}
      <div className="mt-3 rounded-lg bg-slate-950/80 p-2 border border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400">Dispatched:</span>
        <span className={`text-xs font-mono font-semibold ${fireCount > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
          {fireCount > 0 ? `${fireCount} ALERT${fireCount > 1 ? 'S' : ''} SENT` : 'ARMED / LISTENING'}
        </span>
      </div>
    </div>
  );
}
