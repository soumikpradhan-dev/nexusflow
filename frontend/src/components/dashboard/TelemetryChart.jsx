import React, { useMemo } from 'react';
import { Activity, Flame, ShieldCheck } from 'lucide-react';

export default function TelemetryChart({
  telemetryHistory = [],
  threshold = 80.0,
  sensorType = 'temperature',
  unit = '°C',
  deviceName = 'Heavy Gas Turbine #1 (TURBINE-01)'
}) {
  const points = telemetryHistory.slice(-40);

  const stats = useMemo(() => {
    if (points.length === 0) return { min: 0, max: 100, currRaw: 0, currAvg: 0 };
    const rawVals = points.map(p => p.value || 0);
    const avgVals = points.map(p => p.movingAverage !== undefined ? p.movingAverage : p.value || 0);
    const allVals = [...rawVals, ...avgVals, threshold];

    const min = Math.floor(Math.min(...allVals) - 4);
    const max = Math.ceil(Math.max(...allVals) + 4);
    const currRaw = rawVals[rawVals.length - 1];
    const currAvg = avgVals[avgVals.length - 1];

    return { min, max, currRaw, currAvg };
  }, [points, threshold]);

  // Dimensions
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Scale calculations
  const getY = (val) => {
    const range = (stats.max - stats.min) || 1;
    const clamped = Math.max(stats.min, Math.min(stats.max, val));
    return padding.top + chartH - ((clamped - stats.min) / range) * chartH;
  };

  const getX = (index) => {
    if (points.length <= 1) return padding.left;
    return padding.left + (index / (points.length - 1)) * chartW;
  };

  // Build SVG polyline paths
  const rawPath = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${getX(i)},${getY(p.value || 0)}`).join(' ');
  }, [points, stats]);

  const avgPath = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => {
      const v = p.movingAverage !== undefined ? p.movingAverage : p.value || 0;
      return `${getX(i)},${getY(v)}`;
    }).join(' ');
  }, [points, stats]);

  const thresholdY = getY(threshold);
  const isOverheating = stats.currAvg > threshold;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
      {/* Header & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">{deviceName}</h3>
          </div>
          <div className="text-xs text-slate-400">
            Real-Time Stream vs Moving Average vs Safety Threshold
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Current Raw */}
          <div className="rounded-lg bg-slate-950 px-3 py-1.5 border border-slate-800 text-right">
            <div className="text-[10px] uppercase font-semibold text-emerald-400">Raw Sensor</div>
            <div className="font-mono font-bold text-base text-emerald-400">
              {stats.currRaw.toFixed(1)} {unit}
            </div>
          </div>

          {/* Current Moving Avg */}
          <div className="rounded-lg bg-slate-950 px-3 py-1.5 border border-slate-800 text-right">
            <div className="text-[10px] uppercase font-semibold text-cyan-400">Moving Avg</div>
            <div className="font-mono font-bold text-base text-cyan-400">
              {stats.currAvg.toFixed(1)} {unit}
            </div>
          </div>

          {/* Threshold state */}
          <div className={`rounded-lg px-3 py-1.5 border text-right ${
            isOverheating
              ? 'bg-rose-950/70 border-rose-600/60 text-rose-300'
              : 'bg-emerald-950/50 border-emerald-800/40 text-emerald-300'
          }`}>
            <div className="text-[10px] uppercase font-semibold flex items-center gap-1 justify-end">
              {isOverheating ? <Flame className="h-3 w-3 text-rose-400" /> : <ShieldCheck className="h-3 w-3 text-emerald-400" />}
              <span>{isOverheating ? 'OVERHEAT TRIP' : 'NORMAL'}</span>
            </div>
            <div className="font-mono font-bold text-base">
              Limit: {threshold} {unit}
            </div>
          </div>
        </div>
      </div>

      {/* SVG Canvas Chart */}
      <div className="mt-3 relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = padding.top + chartH * pct;
            const val = (stats.max - pct * (stats.max - stats.min)).toFixed(0);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Threshold Line */}
          <line
            x1={padding.left}
            y1={thresholdY}
            x2={width - padding.right}
            y2={thresholdY}
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <text
            x={width - padding.right}
            y={thresholdY - 6}
            fill="#f59e0b"
            fontSize="10"
            fontWeight="bold"
            textAnchor="end"
            fontFamily="monospace"
          >
            THRESHOLD ({threshold}{unit})
          </text>

          {/* Raw Sensor Line (Emerald) */}
          {rawPath && (
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              points={rawPath}
              opacity="0.75"
            />
          )}

          {/* Moving Average Line (Cyan, thicker) */}
          {avgPath && (
            <polyline
              fill="none"
              stroke="#06b6d4"
              strokeWidth="3.5"
              points={avgPath}
            />
          )}

          {/* Current reading pulsing dot on Moving Avg */}
          {points.length > 0 && (
            <g transform={`translate(${getX(points.length - 1)}, ${getY(stats.currAvg)})`}>
              <circle r="7" fill={isOverheating ? '#f43f5e' : '#06b6d4'} opacity="0.4" className="animate-ping" />
              <circle r="4" fill={isOverheating ? '#f43f5e' : '#06b6d4'} stroke="#0f172a" strokeWidth="2" />
            </g>
          )}
        </svg>

        {/* Legend */}
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-6 rounded-full bg-emerald-500 opacity-80" />
              <span>Raw Sensor Stream</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-6 rounded-full bg-cyan-400" />
              <span className="font-semibold text-slate-200">Compiled Moving Average</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-6 border-b-2 border-dashed border-amber-400" />
              <span>Safety Threshold ({threshold}{unit})</span>
            </div>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Window: 40 latest time-series points
          </div>
        </div>
      </div>
    </div>
  );
}
