import React from 'react';
import { Play, Pause, FastForward, Flame, Zap, Droplet, RefreshCw, Database, Gauge, Radio } from 'lucide-react';

export default function SimulatorControls({
  simulatorStatus,
  telemetryMetrics,
  onStart,
  onStop,
  onSetRate,
  onInjectAnomaly,
  onClearAnomaly
}) {
  const isRunning = simulatorStatus?.isRunning;
  const intervalMs = simulatorStatus?.intervalMs || 400;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">IoT Telemetry Hardware Generator</h3>
            <div className="text-[11px] text-slate-400">
              High-throughput mock IoT sensor streams piped to MongoDB & RxJS
            </div>
          </div>
        </div>

        {/* Play / Pause & Speed */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {[100, 250, 400, 1000].map(ms => (
              <button
                key={ms}
                onClick={() => onSetRate(ms)}
                className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
                  intervalMs === ms
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ms}ms
              </button>
            ))}
          </div>

          {isRunning ? (
            <button
              onClick={onStop}
              className="flex items-center gap-1.5 rounded-lg border border-amber-600 bg-amber-600/20 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-600/30 transition-colors"
            >
              <Pause className="h-3.5 w-3.5 fill-current" />
              <span>Pause Feed</span>
            </button>
          ) : (
            <button
              onClick={onStart}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950/50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Resume Feed</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
          <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <Gauge className="h-3 w-3 text-cyan-400" />
            <span>Ingestion Rate</span>
          </div>
          <div className="font-mono font-bold text-lg text-cyan-400 mt-0.5">
            {telemetryMetrics?.pointsPerSecond || 0} <span className="text-xs text-slate-400 font-normal">pts/sec</span>
          </div>
        </div>

        <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
          <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <Database className="h-3 w-3 text-emerald-400" />
            <span>MongoDB Time-Series</span>
          </div>
          <div className="font-mono font-bold text-lg text-emerald-400 mt-0.5">
            {telemetryMetrics?.totalFlushedToDB || 0} <span className="text-xs text-slate-400 font-normal">docs</span>
          </div>
        </div>

        <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
          <div className="text-[10px] uppercase font-semibold text-slate-400">Memory Ingest Buffer</div>
          <div className="font-mono font-bold text-lg text-slate-200 mt-0.5">
            {telemetryMetrics?.queueLength || 0} <span className="text-xs text-slate-400 font-normal">queued</span>
          </div>
        </div>

        <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
          <div className="text-[10px] uppercase font-semibold text-slate-400">Total Telemetry Ingested</div>
          <div className="font-mono font-bold text-lg text-purple-400 mt-0.5">
            {telemetryMetrics?.totalIngested || 0} <span className="text-xs text-slate-400 font-normal">pts</span>
          </div>
        </div>
      </div>

      {/* Anomaly Testing Deck */}
      <div className="mt-3 pt-3 border-t border-slate-800">
        <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide mb-2 flex items-center justify-between">
          <span>Industrial Fault Injection Deck (Click to trigger anomaly):</span>
          <button
            onClick={() => onClearAnomaly('TURBINE-01')}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reset All Faults</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => onInjectAnomaly('TURBINE-01', 'OVERHEAT')}
            className="flex items-center gap-2 rounded-lg border border-rose-800/60 bg-rose-950/40 p-2 text-left hover:bg-rose-900/50 transition-all"
          >
            <Flame className="h-4 w-4 text-rose-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-rose-200">Turbine Overheat</div>
              <div className="text-[10px] text-rose-300/70">T &gt; 80°C (Triggers SMS)</div>
            </div>
          </button>

          <button
            onClick={() => onInjectAnomaly('TURBINE-01', 'VIBRATION_SPIKE')}
            className="flex items-center gap-2 rounded-lg border border-amber-800/60 bg-amber-950/40 p-2 text-left hover:bg-amber-900/50 transition-all"
          >
            <Zap className="h-4 w-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-200">Vibration Spike</div>
              <div className="text-[10px] text-amber-300/70">6.8 mm/s Shaft Surge</div>
            </div>
          </button>

          <button
            onClick={() => onInjectAnomaly('BOILER-02', 'PRESSURE_DROP')}
            className="flex items-center gap-2 rounded-lg border border-cyan-800/60 bg-cyan-950/40 p-2 text-left hover:bg-cyan-900/50 transition-all"
          >
            <Droplet className="h-4 w-4 text-cyan-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-cyan-200">Boiler Pressure Drop</div>
              <div className="text-[10px] text-cyan-300/70">P &lt; 30 bar Valve Leak</div>
            </div>
          </button>

          <button
            onClick={() => onInjectAnomaly('CHILLER-03', 'COOLING_FAILURE')}
            className="flex items-center gap-2 rounded-lg border border-purple-800/60 bg-purple-950/40 p-2 text-left hover:bg-purple-900/50 transition-all"
          >
            <FastForward className="h-4 w-4 text-purple-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-purple-200">Coolant Failure</div>
              <div className="text-[10px] text-purple-300/70">Flow drops to 45 m³/h</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
