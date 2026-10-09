import React, { useState } from 'react';
import { Play, Square, Save, RotateCcw, Flame, Zap, Droplet, Sparkles, Check, ChevronDown } from 'lucide-react';

export default function PipelineToolbar({
  pipeline,
  isActive,
  templates,
  onDeploy,
  onStop,
  onSave,
  onLoadTemplate,
  onClear,
  onInjectAnomaly,
  onNameChange
}) {
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [anomalyMenuOpen, setAnomalyMenuOpen] = useState(false);

  return (
    <div className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur-md z-10">
      {/* Left: Pipeline Name & Status */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={pipeline?.name || 'Untitled Pipeline'}
          onChange={(e) => onNameChange(e.target.value)}
          className="rounded border border-transparent bg-transparent px-2 py-1 text-sm font-bold text-slate-100 hover:border-slate-700 focus:border-cyan-500 focus:bg-slate-950 focus:outline-none"
        />
        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
          isActive
            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
            : 'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
          <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          <span>{isActive ? 'ACTIVE IN RXJS ENGINE' : 'DRAFT / STOPPED'}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Templates dropdown */}
        <div className="relative">
          <button
            onClick={() => setTemplateMenuOpen(!templateMenuOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Load Template</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {templateMenuOpen && (
            <div className="absolute left-0 mt-1 w-72 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl z-50">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pre-Configured Industrial Pipelines
              </div>
              {templates.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    onLoadTemplate(tmpl);
                    setTemplateMenuOpen(false);
                  }}
                  className="w-full text-left rounded-lg p-2 hover:bg-slate-800 transition-colors"
                >
                  <div className="text-xs font-semibold text-slate-200">{tmpl.name}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">{tmpl.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Anomaly Injection Trigger */}
        <div className="relative">
          <button
            onClick={() => setAnomalyMenuOpen(!anomalyMenuOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-800/50 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/50 transition-colors"
          >
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>Inject Anomaly</span>
            <ChevronDown className="h-3 w-3 text-amber-400" />
          </button>

          {anomalyMenuOpen && (
            <div className="absolute right-0 mt-1 w-72 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl z-50">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Simulate Hardware Failure
              </div>
              <button
                onClick={() => {
                  onInjectAnomaly('TURBINE-01', 'OVERHEAT');
                  setAnomalyMenuOpen(false);
                }}
                className="flex items-center gap-2.5 w-full text-left rounded-lg p-2 hover:bg-slate-800 text-xs font-medium text-slate-200"
              >
                <Flame className="h-4 w-4 text-rose-400 shrink-0" />
                <div>
                  <div className="font-semibold text-rose-300">Turbine Overheat (92°C)</div>
                  <div className="text-[10px] text-slate-400">Ramps temp past 80°C threshold</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onInjectAnomaly('TURBINE-01', 'VIBRATION_SPIKE');
                  setAnomalyMenuOpen(false);
                }}
                className="flex items-center gap-2.5 w-full text-left rounded-lg p-2 hover:bg-slate-800 text-xs font-medium text-slate-200"
              >
                <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-amber-300">Turbine Vibration Spike</div>
                  <div className="text-[10px] text-slate-400">Surges to 6.8 mm/s</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onInjectAnomaly('BOILER-02', 'PRESSURE_DROP');
                  setAnomalyMenuOpen(false);
                }}
                className="flex items-center gap-2.5 w-full text-left rounded-lg p-2 hover:bg-slate-800 text-xs font-medium text-slate-200"
              >
                <Droplet className="h-4 w-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-semibold text-cyan-300">Boiler Pressure Drop</div>
                  <div className="text-[10px] text-slate-400">Simulates steam leak to 22 bar</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Save */}
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <Save className="h-3.5 w-3.5" />
          <span>Save</span>
        </button>

        {/* Deploy / Stop button */}
        {isActive ? (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 rounded-lg border border-rose-700 bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 shadow-lg shadow-rose-950/60 transition-colors"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            <span>Stop Engine</span>
          </button>
        ) : (
          <button
            onClick={onDeploy}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500 bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950/60 transition-colors"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Deploy to Engine</span>
          </button>
        )}
      </div>
    </div>
  );
}
