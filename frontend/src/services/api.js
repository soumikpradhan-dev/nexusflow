const BASE_URL = '/api';

export async function fetchPipelines() {
  const res = await fetch(`${BASE_URL}/pipelines`);
  return res.json();
}

export async function fetchPipeline(id) {
  const res = await fetch(`${BASE_URL}/pipelines/${id}`);
  return res.json();
}

export async function savePipeline(pipeline) {
  const res = await fetch(`${BASE_URL}/pipelines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pipeline)
  });
  return res.json();
}

export async function deployPipeline(id) {
  const res = await fetch(`${BASE_URL}/pipelines/${id}/deploy`, { method: 'POST' });
  return res.json();
}

export async function stopPipeline(id) {
  const res = await fetch(`${BASE_URL}/pipelines/${id}/stop`, { method: 'POST' });
  return res.json();
}

export async function deletePipeline(id) {
  const res = await fetch(`${BASE_URL}/pipelines/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function fetchTemplates() {
  const res = await fetch(`${BASE_URL}/pipelines/templates`);
  return res.json();
}

export async function fetchPipelineStats() {
  const res = await fetch(`${BASE_URL}/pipelines/stats`);
  return res.json();
}

export async function fetchTelemetryHistory(deviceId, sensorType, limit = 60, minutes = 15) {
  const res = await fetch(
    `${BASE_URL}/telemetry/history?deviceId=${deviceId}&sensorType=${sensorType}&limit=${limit}&minutes=${minutes}`
  );
  return res.json();
}

export async function fetchTelemetryMetrics() {
  const res = await fetch(`${BASE_URL}/telemetry/metrics`);
  return res.json();
}

export async function fetchDevices() {
  const res = await fetch(`${BASE_URL}/devices`);
  return res.json();
}

export async function fetchAlerts(limit = 50, deviceId = '', status = '') {
  let url = `${BASE_URL}/alerts?limit=${limit}`;
  if (deviceId) url += `&deviceId=${deviceId}`;
  if (status) url += `&status=${status}`;
  const res = await fetch(url);
  return res.json();
}

export async function acknowledgeAlert(alertId, notes = '') {
  const res = await fetch(`${BASE_URL}/alerts/${alertId}/ack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  });
  return res.json();
}

export async function fetchSimulatorStatus() {
  const res = await fetch(`${BASE_URL}/simulator/status`);
  return res.json();
}

export async function startSimulator() {
  const res = await fetch(`${BASE_URL}/simulator/start`, { method: 'POST' });
  return res.json();
}

export async function stopSimulator() {
  const res = await fetch(`${BASE_URL}/simulator/stop`, { method: 'POST' });
  return res.json();
}

export async function setSimulatorRate(intervalMs) {
  const res = await fetch(`${BASE_URL}/simulator/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intervalMs })
  });
  return res.json();
}

export async function injectAnomaly(deviceId, anomalyType, durationTicks = 30) {
  const res = await fetch(`${BASE_URL}/simulator/inject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, anomalyType, durationTicks })
  });
  return res.json();
}

export async function clearAnomaly(deviceId) {
  const res = await fetch(`${BASE_URL}/simulator/clear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId })
  });
  return res.json();
}
