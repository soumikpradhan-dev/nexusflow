import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

import Header from './components/common/Header';
import VisualGraphBuilder from './components/canvas/VisualGraphBuilder';
import TelemetryChart from './components/dashboard/TelemetryChart';
import DeviceMonitorGrid from './components/dashboard/DeviceMonitorGrid';
import AlertsFeed from './components/dashboard/AlertsFeed';
import SimulatorControls from './components/dashboard/SimulatorControls';
import StreamExecutionInspector from './components/dashboard/StreamExecutionInspector';
import ArchitectureView from './components/dashboard/ArchitectureView';

import * as api from './services/api';
import { Flame, Bell, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('builder');
  const [pipelines, setPipelines] = useState([]);
  const [currentPipeline, setCurrentPipeline] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [templates, setTemplates] = useState([]);

  // Live state
  const [isConnected, setIsConnected] = useState(false);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [liveDeviceData, setLiveDeviceData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [executionEvents, setExecutionEvents] = useState([]);
  const [latestNodePulses, setLatestNodePulses] = useState([]);
  const [latestAlert, setLatestAlert] = useState(null);
  const [telemetryMetrics, setTelemetryMetrics] = useState({
    pointsPerSecond: 0,
    totalIngested: 0,
    totalFlushedToDB: 0,
    queueLength: 0
  });
  const [simulatorStatus, setSimulatorStatus] = useState({ isRunning: true, intervalMs: 400 });

  // Floating Toast alert
  const [toastAlert, setToastAlert] = useState(null);

  // Initialize data on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [pipelinesRes, templatesRes, alertsRes, simRes, metricsRes] = await Promise.all([
          api.fetchPipelines(),
          api.fetchTemplates(),
          api.fetchAlerts(30),
          api.fetchSimulatorStatus(),
          api.fetchTelemetryMetrics()
        ]);

        if (pipelinesRes.success && pipelinesRes.pipelines.length > 0) {
          setPipelines(pipelinesRes.pipelines);
          // Pick the default template or first pipeline
          const activeOrFirst = pipelinesRes.pipelines.find(p => p.active) || pipelinesRes.pipelines[0];
          setCurrentPipeline(activeOrFirst);
          setIsActive(!!activeOrFirst.active);
        }

        if (templatesRes.success) {
          setTemplates(templatesRes.templates);
        }

        if (alertsRes.success) {
          setAlerts(alertsRes.alerts);
        }

        if (simRes.success) {
          setSimulatorStatus(simRes);
        }

        if (metricsRes.success) {
          setTelemetryMetrics(metricsRes.metrics);
        }

        // Fetch initial telemetry history for Turbine-01
        const historyRes = await api.fetchTelemetryHistory('TURBINE-01', 'temperature', 40);
        if (historyRes.success && historyRes.data) {
          setTelemetryHistory(historyRes.data);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    }

    loadInitialData();
  }, []);

  // WebSocket Connection
  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to NexusFlow WebSocket server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Ingestion stream
    socket.on('telemetry:data', (point) => {
      if (!point || !point.metadata) return;

      const deviceId = point.metadata.deviceId;
      const sensorType = point.metadata.sensorType;
      const val = point.value;

      // Update device monitor grid state
      setLiveDeviceData(prev => ({
        ...prev,
        [deviceId]: {
          ...(prev[deviceId] || {}),
          [sensorType]: val
        }
      }));

      // If this is Turbine-01 temperature, update live chart
      if (deviceId === 'TURBINE-01' && sensorType === 'temperature') {
        setTelemetryHistory(prev => {
          const next = [...prev, point];
          return next.slice(-40);
        });
      }
    });

    // Node execution pulse (from StreamCompiler)
    socket.on('pipeline:node_pulse', (event) => {
      setLatestNodePulses(prev => [...prev.slice(-10), event]);
      setExecutionEvents(prev => [...prev.slice(-30), event]);

      // If moving average is in event for Turbine-01 temp, attach to chart points
      if (event.movingAverage !== undefined && event.nodeType?.includes('movingAverage')) {
        setTelemetryHistory(prev => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          const last = { ...updated[updated.length - 1], movingAverage: event.movingAverage };
          updated[updated.length - 1] = last;
          return updated;
        });
      }
    });

    // Alert trigger event
    socket.on('pipeline:alert', (alertDoc) => {
      setLatestAlert(alertDoc);
      setAlerts(prev => [alertDoc, ...prev]);
      setToastAlert(alertDoc);

      // Auto dismiss toast after 6s
      setTimeout(() => {
        setToastAlert(curr => (curr?.alertId === alertDoc.alertId ? null : curr));
      }, 6000);
    });

    // System metrics update
    socket.on('system:metrics', (metrics) => {
      if (metrics.telemetry) {
        setTelemetryMetrics(metrics.telemetry);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Actions
  const handleDeploy = async (pipelineToDeploy) => {
    try {
      // First save
      const saveRes = await api.savePipeline(pipelineToDeploy || currentPipeline);
      if (saveRes.success) {
        const deployRes = await api.deployPipeline(saveRes.pipeline.id);
        if (deployRes.success) {
          setIsActive(true);
          setCurrentPipeline(saveRes.pipeline);
        }
      }
    } catch (err) {
      console.error('Failed to deploy pipeline:', err);
    }
  };

  const handleStop = async () => {
    if (!currentPipeline) return;
    try {
      const res = await api.stopPipeline(currentPipeline.id);
      if (res.success) {
        setIsActive(false);
      }
    } catch (err) {
      console.error('Failed to stop pipeline:', err);
    }
  };

  const handleSave = async (updatedPipeline) => {
    try {
      const res = await api.savePipeline(updatedPipeline);
      if (res.success) {
        setCurrentPipeline(res.pipeline);
      }
    } catch (err) {
      console.error('Failed to save pipeline:', err);
    }
  };

  const handleLoadTemplate = async (template) => {
    setCurrentPipeline(template);
    // Deploy loaded template to engine immediately
    try {
      const res = await api.deployPipeline(template.id);
      if (res.success) {
        setIsActive(true);
      }
    } catch (err) {
      console.error('Failed to deploy template:', err);
    }
  };

  const handleInjectAnomaly = async (deviceId, type) => {
    try {
      await api.injectAnomaly(deviceId, type, 30);
    } catch (err) {
      console.error('Failed to inject anomaly:', err);
    }
  };

  const handleClearAnomaly = async (deviceId) => {
    try {
      await api.clearAnomaly(deviceId);
    } catch (err) {
      console.error('Failed to clear anomaly:', err);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await api.acknowledgeAlert(alertId, 'Operator manual review completed');
      setAlerts(prev =>
        prev.map(a => (a.alertId === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a))
      );
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleStartSim = async () => {
    await api.startSimulator();
    setSimulatorStatus(prev => ({ ...prev, isRunning: true }));
  };

  const handleStopSim = async () => {
    await api.stopSimulator();
    setSimulatorStatus(prev => ({ ...prev, isRunning: false }));
  };

  const handleSetSimRate = async (ms) => {
    await api.setSimulatorRate(ms);
    setSimulatorStatus(prev => ({ ...prev, intervalMs: ms }));
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activePipelineCount={isActive ? 1 : 0}
        activeAlertCount={alerts.filter(a => a.status === 'ACTIVE').length}
        ingestionRate={telemetryMetrics.pointsPerSecond}
        isConnected={isConnected}
      />

      {/* Main View Area */}
      <main className="flex-1 overflow-hidden relative">
        {/* TAB 1: Visual Rule Builder */}
        {activeTab === 'builder' && (
          <VisualGraphBuilder
            currentPipeline={currentPipeline}
            isActive={isActive}
            templates={templates}
            onDeploy={handleDeploy}
            onStop={handleStop}
            onSave={handleSave}
            onLoadTemplate={handleLoadTemplate}
            onInjectAnomaly={handleInjectAnomaly}
            latestNodePulses={latestNodePulses}
            latestAlert={latestAlert}
          />
        )}

        {/* TAB 2: Factory Floor & Live Telemetry */}
        {activeTab === 'dashboard' && (
          <div className="h-full overflow-y-auto p-5 space-y-5">
            {/* Real-time Time Series Chart */}
            <TelemetryChart
              telemetryHistory={telemetryHistory}
              threshold={80.0}
              sensorType="temperature"
              unit="°C"
              deviceName="Heavy Gas Turbine #1 (Sector 7)"
            />

            {/* Simulator Controls & Anomaly Deck */}
            <SimulatorControls
              simulatorStatus={simulatorStatus}
              telemetryMetrics={telemetryMetrics}
              onStart={handleStartSim}
              onStop={handleStopSim}
              onSetRate={handleSetSimRate}
              onInjectAnomaly={handleInjectAnomaly}
              onClearAnomaly={handleClearAnomaly}
            />

            {/* 4 Machine Cards */}
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Factory Equipment Telemetry
              </div>
              <DeviceMonitorGrid
                liveDeviceData={liveDeviceData}
                onInjectAnomaly={handleInjectAnomaly}
              />
            </div>

            {/* Execution Inspector */}
            <StreamExecutionInspector executionEvents={executionEvents} />
          </div>
        )}

        {/* TAB 3: Incident & SMS Log */}
        {activeTab === 'alerts' && (
          <div className="h-full overflow-y-auto p-5 space-y-5 max-w-6xl mx-auto">
            <AlertsFeed
              alerts={alerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
            />

            <StreamExecutionInspector executionEvents={executionEvents} />
          </div>
        )}

        {/* TAB 4: Architecture & Internals */}
        {activeTab === 'architecture' && (
          <div className="h-full overflow-y-auto p-5">
            <ArchitectureView
              telemetryMetrics={telemetryMetrics}
              activePipelines={pipelines}
            />
          </div>
        )}
      </main>

      {/* Floating Real-Time Alert Toast Notification */}
      {toastAlert && (
        <div className="fixed bottom-5 right-5 z-50 flex max-w-md items-start gap-3 rounded-xl border border-rose-600 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md animate-bounce">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white">
            <Flame className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400">
                🚨 CRITICAL SMS ALERT DISPATCHED
              </span>
              <button
                onClick={() => setToastAlert(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-200">
              {toastAlert.details?.message || `Threshold exceeded on ${toastAlert.deviceId}`}
            </p>
            {toastAlert.details?.smsDispatch && (
              <div className="mt-2 text-[10px] font-mono text-emerald-400">
                Sent to: {toastAlert.details.smsDispatch.to} ({toastAlert.details.smsDispatch.carrier})
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
