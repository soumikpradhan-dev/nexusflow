import React from 'react';
import { Database, Cpu, Radio, Activity, GitBranch, ArrowRight, Check, Zap } from 'lucide-react';

export default function ArchitectureView({ telemetryMetrics, activePipelines = [] }) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Overview Hero */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Radio className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-white m-0">NexusFlow System Architecture & Pipeline Internals</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          NexusFlow eliminates developer intervention for industrial business rules. It compiles visual node graphs into
          high-performance reactive <strong>RxJS Observables</strong> on the Node.js backend while streaming millions of
          points into native <strong>MongoDB Time-Series collections</strong>.
        </p>
      </div>

      {/* 4 Core Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Module 1: Visual Graph Builder */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <GitBranch className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">1. Visual Graph Builder (React & React Flow)</h3>
          </div>
          <p className="text-xs text-slate-300 mt-3 leading-relaxed">
            Drag-and-drop node canvas allowing plant operators and managers to define complex filtering logic,
            smoothing windows, threshold comparators, and automated alerting without writing code.
          </p>
          <div className="mt-3 rounded-lg bg-slate-950 p-3 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
            <div className="text-emerald-400 font-bold">&bull; Graph Representation: Directed Acyclic Graph (DAG)</div>
            <div>&bull; Node Schema: {`{ id, type, position, data: { ... } }`}</div>
            <div>&bull; Edge Schema: {`{ id, source, target, animated: true }`}</div>
            <div>&bull; Live Visual Feedback: WebSocket pulses animate edges & nodes in real-time</div>
          </div>
        </div>

        {/* Module 2: Stream Compiler (RxJS) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Zap className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">2. Stream Compiler (Node.js & RxJS)</h3>
          </div>
          <p className="text-xs text-slate-300 mt-3 leading-relaxed">
            The backend engine topologically sorts the visual JSON graph and binds it to a central <code className="text-cyan-300">Subject()</code>.
            Each visual node compiles into specialized RxJS functional operators.
          </p>
          <div className="mt-3 rounded-lg bg-slate-950 p-3 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
            <div className="text-cyan-400 font-bold">&bull; Master Observable: telemetrySubject$.pipe(...)</div>
            <div>&bull; Sensor Filter: filter(pt =&gt; pt.deviceId === 'TURBINE-01')</div>
            <div>&bull; Moving Average: scan((acc, curr) =&gt; computeSlidingWindow(curr))</div>
            <div>&bull; Rule Threshold: filter(item =&gt; item.movingAverage &gt; 80)</div>
            <div>&bull; Action Dispatch: throttleTime(4000).pipe(tap(triggerSMS))</div>
          </div>
        </div>

        {/* Module 3: Time-Series Database (MongoDB) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Database className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">3. Time-Series Database (MongoDB 8.0+)</h3>
          </div>
          <p className="text-xs text-slate-300 mt-3 leading-relaxed">
            Native MongoDB Time-Series collections compress high-frequency IoT data into compressed column store buckets
            based on timestamp and metadata, minimizing disk I/O and query latency.
          </p>
          <div className="mt-3 rounded-lg bg-slate-950 p-3 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
            <div className="text-amber-400 font-bold">&bull; Native Collection: db.createCollection('telemetry', &#123; timeseries: &#123; timeField: 'timestamp', metaField: 'metadata', granularity: 'seconds' &#125;&#125;)</div>
            <div>&bull; Bulk Ingest Buffer: {telemetryMetrics?.totalFlushedToDB || 0} documents persisted</div>
            <div>&bull; Compound Index: &#123; 'metadata.deviceId': 1, timestamp: -1 &#125;</div>
            <div>&bull; Ingestion Rate: {telemetryMetrics?.pointsPerSecond || 0} points/second</div>
          </div>
        </div>

        {/* Module 4: Ingestion API & WebSockets */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Activity className="h-5 w-5 text-rose-400" />
            <h3 className="text-sm font-bold text-slate-100">4. Ingestion API & WebSockets</h3>
          </div>
          <p className="text-xs text-slate-300 mt-3 leading-relaxed">
            Express endpoints receive hardware telemetry and batch ingest them into memory queues.
            Simultaneously, Socket.io broadcasts live feeds and alert notifications back to the dashboard.
          </p>
          <div className="mt-3 rounded-lg bg-slate-950 p-3 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
            <div className="text-rose-400 font-bold">&bull; REST Endpoint: POST /api/telemetry/ingest</div>
            <div>&bull; WebSocket Channels: 'telemetry:data', 'pipeline:node_pulse', 'pipeline:alert'</div>
            <div>&bull; SMS Carrier Emulation: Nexmo / Twilio Gateway with delivery receipts & SID</div>
            <div>&bull; Hardware Simulator: Multi-device factory floor generator with anomaly injection</div>
          </div>
        </div>
      </div>
    </div>
  );
}
