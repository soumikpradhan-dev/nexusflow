import React from 'react';
import { Layers, Activity, Bell, Database, Radio, Cpu, Sparkles } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  activePipelineCount,
  activeAlertCount,
  ingestionRate,
  isConnected
}) {
  const tabs = [
    { id: 'builder', label: 'Visual Rule Builder', icon: Layers },
    { id: 'dashboard', label: 'Factory Floor & Telemetry', icon: Activity },
    { id: 'alerts', label: 'Incident & SMS Log', icon: Bell, badge: activeAlertCount },
    { id: 'architecture', label: 'MongoDB & RxJS Architecture', icon: Database }
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 px-5 py-3 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/20">
            <Radio className="h-5 w-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white m-0">NexusFlow</h1>
              <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                IoT TELEMETRY ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400 m-0">
              Visual IoT Rule Canvas &bull; Reactive RxJS Stream Compiler &bull; MongoDB Time-Series
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Live System Status Badges */}
        <div className="flex items-center gap-3">
          {/* Socket status */}
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-950 px-2.5 py-1 border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span>{isConnected ? 'WS CONNECTED' : 'WS OFFLINE'}</span>
          </div>

          {/* Rate */}
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-950 px-2.5 py-1 border border-slate-800 text-[11px] font-mono text-cyan-400">
            <Activity className="h-3 w-3" />
            <span>{ingestionRate || 0} pts/s</span>
          </div>

          {/* Time Series DB pill */}
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-950/60 px-2.5 py-1 border border-emerald-800/40 text-[11px] font-mono text-emerald-400">
            <Database className="h-3 w-3" />
            <span>MONGODB TIME-SERIES</span>
          </div>
        </div>
      </div>
    </header>
  );
}
