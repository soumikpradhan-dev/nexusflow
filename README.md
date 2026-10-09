# NexusFlow: Visual IoT Telemetry & Reactive Rule Engine

NexusFlow solves the challenge of hardcoding business logic for industrial IoT equipment. It enables non-technical plant operators to visually assemble streaming pipelines using drag-and-drop nodes (such as **"Turbine Sensor"** &rarr; **"Moving Average Filter"** &rarr; **"SMS Alert"**).

The Node.js backend compiles visual JSON Directed Acyclic Graphs (DAGs) into reactive **RxJS Observables**, evaluating continuous telemetry streams in real time while concurrently persisting high-frequency readings into **native MongoDB Time-Series collections**.

---

## 🏗️ Architecture & Modules

```
  +-------------------------------------------------------------------------+
  |                             NexusFlow Architecture                      |
  +-------------------------------------------------------------------------+
                                       |
    [ React & React Flow Canvas ]      | Drag-and-drop UI (Sensors, Filters,
    (Port: 5173)                       | Thresholds, SMS / Actuator Actions)
                                       |
                                       v
    [ Stream Compiler (RxJS) ]         | Compiles visual JSON graphs into
    (Node.js / Express / Socket.io)    | reactive Observable pipelines
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
    [ High-Throughput Ingestion API ]       [ Alert Dispatcher & Carrier Log ]
    - Bulk buffer queue                     - Simulated Twilio / Nexmo SMS
    - Real-time Socket.io broadcast         - SCADA / PLC Actuator commands
                   |
                   v
    [ MongoDB 5.0+ / 8.0 Time-Series ]
    - Native `system.buckets.telemetry`
    - High-ingest, append-only column store
```

### 1. Visual Graph Builder (`React` + `@xyflow/react` + `TailwindCSS`)
- Node-based canvas with custom industrial blocks:
  - **Sensor Input Node**: Select machine (`TURBINE-01`, `GENERATOR-04`, `BOILER-02`, `CHILLER-03`) and metric (`Temperature`, `Vibration`, `Pressure`, etc.).
  - **Moving Average Node**: Configurable sliding window size ($N$ samples) using RxJS `scan`.
  - **Threshold Comparator Node**: Relational operators (`>`, `<`, `>=`, `<=`, `==`, `between`).
  - **Rate-of-Change / Anomaly Nodes**: Statistical Z-Score & derivative delta detection.
  - **Action Nodes**: SMS Alert (with configurable template variables) & PLC Actuator.
- Live pulse animations: Edges and nodes glow and pulse in real time as data passes through.
- Property Inspector: Slide-out drawer for tuning parameters on the fly.
- Pre-built Templates: 1-click loading for Turbine Overheat SMS, Shaft Vibration Trip, and Boiler Leak Detection.

### 2. Stream Compiler (`Node.js` & `RxJS`)
- Validates topological DAG integrity and cycle prevention.
- Translates the JSON graph into an executable RxJS pipeline:
  ```js
  telemetry$.pipe(
    filter(pt => pt.metadata.deviceId === 'TURBINE-01'),
    movingAverage({ windowSize: 5 }),
    thresholdFilter({ operator: '>', threshold: 80.0 }),
    throttleTime(4000),
    tap(event => alertService.handleTrigger(event))
  );
  ```
- Hot-reloads running pipelines without dropping incoming telemetry.
- Emits real-time execution step telemetry via WebSockets (`pipeline:node_pulse`).

### 3. Native MongoDB Time-Series Database (`MongoDB 8.0+`)
- Configured using native time-series options:
  ```js
  await db.createCollection('telemetry', {
    timeseries: {
      timeField: 'timestamp',
      metaField: 'metadata',
      granularity: 'seconds'
    }
  });
  ```
- Uses memory batch buffers and `insertMany(batch, { ordered: false })` for optimal throughput.
- Time-series aggregation endpoints utilizing `$dateTrunc` and `$bucket` for downsampling.

### 4. Ingestion API & Hardware Simulator (`Express` & `Socket.io`)
- Multi-machine IoT simulator generating realistic thermodynamic and mechanical readings.
- **Fault Injection Deck**:
  - 🔥 **Turbine Overheat (94°C)**: Ramps core temperature past 80°C to trigger the default SMS rule.
  - ⚡ **Shaft Vibration Surge**: Spikes vibration to 6.8 mm/s.
  - 💧 **Boiler Pressure Loss**: Simulates steam leak dropping to 22 bar.
- Simulated Carrier Dispatch: Generates realistic Twilio/Nexmo SMS receipts with carrier SID, recipient phone, delivery status, and network latency.

---

## 🚀 Running the Project

### Prerequisites
- Node.js 18+ (tested on Node v24)
- MongoDB 5.0+ running locally on port 27017

### 1. Start the Backend
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:5001
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
# UI accessible at http://localhost:5173
```

---

## 📡 REST API Summary

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | System health, MongoDB stats, and active pipelines |
| `/api/pipelines` | GET, POST | List and save visual pipelines |
| `/api/pipelines/:id/deploy` | POST | Compile & activate graph in RxJS engine |
| `/api/pipelines/:id/stop` | POST | Deactivate running pipeline |
| `/api/telemetry/ingest` | POST | High-throughput sensor ingestion (single or batch) |
| `/api/telemetry/history` | GET | Query recent readings from Time-Series collection |
| `/api/alerts` | GET | List real-time alerts & SMS carrier logs |
| `/api/alerts/:id/ack` | POST | Acknowledge incident |
| `/api/simulator/inject` | POST | Inject hardware anomaly (e.g. OVERHEAT) |
| `/api/simulator/rate` | POST | Adjust telemetry ingestion frequency |
