import React from 'react';
import { DEVICES } from '../../utils/constants';
import { Cpu, Zap, Activity, Flame, Droplet, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function DeviceMonitorGrid({ liveDeviceData = {}, onInjectAnomaly }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {DEVICES.map(dev => {
        const devReadings = liveDeviceData[dev.id] || {};

        return (
          <div
            key={dev.id}
            className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md flex flex-col justify-between transition-all hover:border-slate-700"
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-cyan-400">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100">{dev.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{dev.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-950/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ONLINE</span>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-slate-400">
                📍 {dev.location}
              </div>

              {/* Sensor list */}
              <div className="mt-3 space-y-2">
                {dev.sensors.map(sensor => {
                  const val = devReadings[sensor.type] !== undefined ? devReadings[sensor.type] : sensor.normalMin;
                  const isCritical = val > sensor.criticalThreshold;

                  return (
                    <div
                      key={sensor.type}
                      className="flex items-center justify-between rounded-lg bg-slate-950/70 p-2 border border-slate-850"
                    >
                      <div>
                        <div className="text-[11px] text-slate-300 font-medium">{sensor.metric}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{sensor.type}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono font-bold text-sm ${
                          isCritical ? 'text-rose-400 animate-pulse' : 'text-slate-100'
                        }`}>
                          {typeof val === 'number' ? val.toFixed(1) : val} {sensor.unit}
                        </div>
                        <div className={`text-[9px] font-semibold uppercase ${
                          isCritical ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {isCritical ? 'CRITICAL LIMIT' : 'NOMINAL'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Anomaly Button */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Stress Test:</span>
              <button
                onClick={() => {
                  if (dev.id === 'TURBINE-01') onInjectAnomaly(dev.id, 'OVERHEAT');
                  else if (dev.id === 'BOILER-02') onInjectAnomaly(dev.id, 'PRESSURE_DROP');
                  else onInjectAnomaly(dev.id, 'VIBRATION_SPIKE');
                }}
                className="flex items-center gap-1 text-[11px] font-semibold rounded bg-rose-950/60 border border-rose-800/40 px-2 py-1 text-rose-300 hover:bg-rose-900/60 transition-colors"
              >
                <Flame className="h-3 w-3 text-rose-400" />
                <span>Simulate Anomaly</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
