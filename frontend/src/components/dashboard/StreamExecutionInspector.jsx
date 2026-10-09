import React from 'react';
import { Terminal, Cpu, ArrowRight, CheckCircle2, Zap } from 'lucide-react';

export default function StreamExecutionInspector({ executionEvents = [] }) {
  const events = executionEvents.slice(-25);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-md overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100">RxJS Stream Compiler Execution Trace</h3>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>REACTIVE OBSERVABLE PIPELINE</span>
        </div>
      </div>

      <div className="p-3 font-mono text-[11px] max-h-[300px] overflow-y-auto space-y-1.5 bg-slate-950/70">
        {events.length === 0 ? (
          <div className="text-slate-500 italic p-4 text-center">
            Waiting for reactive stream pulses...
          </div>
        ) : (
          events.map((ev, idx) => {
            const timeStr = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : '--:--:--';
            const isAction = ev.isActionTrigger;
            const isPassed = ev.passed;

            return (
              <div
                key={idx}
                className={`flex items-center gap-2.5 rounded px-2.5 py-1.5 border transition-all ${
                  isAction
                    ? 'bg-rose-950/60 border-rose-800/60 text-rose-200 font-semibold'
                    : isPassed
                    ? 'bg-amber-950/40 border-amber-800/40 text-amber-200'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <span className="text-slate-500 shrink-0">[{timeStr}]</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${
                  isAction
                    ? 'bg-rose-500 text-slate-950'
                    : 'bg-slate-800 text-cyan-300'
                }`}>
                  {ev.nodeType || 'Node'}
                </span>
                <span className="text-slate-400 shrink-0">{ev.nodeId}</span>
                <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
                <span className="truncate flex-1">
                  {ev.displayValue || `Processed reading: ${ev.value}`}
                </span>
                {isAction && (
                  <span className="shrink-0 text-rose-400 font-bold flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>TRIGGERED</span>
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
