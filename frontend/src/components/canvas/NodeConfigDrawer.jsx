import React from 'react';
import { X, Trash2, Sliders, CheckCircle } from 'lucide-react';
import { DEVICES } from '../../utils/constants';

export default function NodeConfigDrawer({ selectedNode, onUpdateNode, onDeleteNode, onClose }) {
  if (!selectedNode) return null;

  const { id, type, data } = selectedNode;

  const handleChange = (field, value) => {
    onUpdateNode(id, {
      ...data,
      [field]: value
    });
  };

  const currentDevice = DEVICES.find(d => d.id === (data.deviceId || 'TURBINE-01')) || DEVICES[0];

  return (
    <div className="flex h-full w-80 flex-col border-l border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-2xl z-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Node Properties</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Node ID & Label */}
        <div>
          <label className="block text-slate-400 font-medium mb-1">Node Label</label>
          <input
            type="text"
            value={data.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* SENSOR INPUT CONFIG */}
        {(type === 'sensorInput' || type === 'sensorNode') && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Target IoT Device</label>
              <select
                value={data.deviceId || 'TURBINE-01'}
                onChange={(e) => {
                  const dev = DEVICES.find(d => d.id === e.target.value);
                  handleChange('deviceId', e.target.value);
                  if (dev && dev.sensors[0]) {
                    handleChange('sensorType', dev.sensors[0].type);
                    handleChange('unit', dev.sensors[0].unit);
                  }
                }}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
              >
                {DEVICES.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Sensor Metric</label>
              <select
                value={data.sensorType || 'temperature'}
                onChange={(e) => {
                  const sensor = currentDevice.sensors.find(s => s.type === e.target.value);
                  handleChange('sensorType', e.target.value);
                  if (sensor) {
                    handleChange('unit', sensor.unit);
                    handleChange('metric', sensor.metric);
                  }
                }}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
              >
                {currentDevice.sensors.map(s => (
                  <option key={s.type} value={s.type}>{s.metric} ({s.unit})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* MOVING AVERAGE CONFIG */}
        {(type === 'movingAverage' || type === 'movingAverageNode') && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400 font-medium">Sliding Window Size</label>
                <span className="font-mono font-bold text-cyan-400">{data.windowSize || 5} readings</span>
              </div>
              <input
                type="range"
                min="2"
                max="20"
                value={data.windowSize || 5}
                onChange={(e) => handleChange('windowSize', parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Averages the latest N consecutive telemetry samples to smooth out electrical jitter.
              </p>
            </div>
          </div>
        )}

        {/* THRESHOLD COMPARATOR CONFIG */}
        {(type === 'thresholdComparator' || type === 'comparatorNode') && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Operator</label>
              <select
                value={data.operator || '>'}
                onChange={(e) => handleChange('operator', e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
              >
                <option value=">">Greater than (&gt;)</option>
                <option value=">=">Greater or equal (&gt;=)</option>
                <option value="<">Less than (&lt;)</option>
                <option value="<=">Less or equal (&lt;=)</option>
                <option value="==">Exact equals (==)</option>
                <option value="between">Between Range</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Threshold Value</label>
              <input
                type="number"
                step="0.5"
                value={data.threshold !== undefined ? data.threshold : 80}
                onChange={(e) => handleChange('threshold', parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Input Field to Test</label>
              <select
                value={data.field || 'movingAverage'}
                onChange={(e) => handleChange('field', e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
              >
                <option value="movingAverage">movingAverage (Calculated)</option>
                <option value="value">raw value (Unfiltered)</option>
              </select>
            </div>
          </div>
        )}

        {/* RATE OF CHANGE CONFIG */}
        {(type === 'rateOfChange' || type === 'rateOfChangeNode') && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Max Delta Rate (Δ / sec)</label>
              <input
                type="number"
                step="0.5"
                value={data.maxRate || 5.0}
                onChange={(e) => handleChange('maxRate', parseFloat(e.target.value) || 5.0)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* LOGIC GATE CONFIG */}
        {(type === 'logicGate') && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Logic Operation</label>
              <select
                value={data.gateType || 'AND'}
                onChange={(e) => handleChange('gateType', e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
              >
                <option value="AND">Logical AND (All inputs must pass)</option>
                <option value="OR">Logical OR (Any input triggers)</option>
              </select>
            </div>
          </div>
        )}

        {/* ACTION / SMS / ACTUATOR CONFIG */}
        {(type === 'smsAlert' || type === 'actionNode' || type === 'machineActuator') && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            {type === 'smsAlert' || data.recipient !== undefined ? (
              <>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">SMS Recipient Phone</label>
                  <input
                    type="text"
                    value={data.recipient || '+1 (555) 019-2834'}
                    onChange={(e) => handleChange('recipient', e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Alert Severity</label>
                  <select
                    value={data.severity || 'CRITICAL'}
                    onChange={(e) => handleChange('severity', e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="INFO">INFO</option>
                    <option value="WARNING">WARNING</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">SMS Message Template</label>
                  <textarea
                    rows={3}
                    value={data.message || ''}
                    onChange={(e) => handleChange('message', e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                  <div className="mt-1 text-[10px] text-slate-400 flex flex-wrap gap-1">
                    <span className="bg-slate-800 px-1 py-0.5 rounded">{'{{deviceId}}'}</span>
                    <span className="bg-slate-800 px-1 py-0.5 rounded">{'{{value}}'}</span>
                    <span className="bg-slate-800 px-1 py-0.5 rounded">{'{{movingAverage}}'}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Target PLC System</label>
                  <input
                    type="text"
                    value={data.targetSystem || 'TURBINE_MAIN_PLC'}
                    onChange={(e) => handleChange('targetSystem', e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Actuation Action</label>
                  <select
                    value={data.action || 'EXECUTE_EMERGENCY_LOAD_REDUCTION'}
                    onChange={(e) => handleChange('action', e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="EXECUTE_EMERGENCY_LOAD_REDUCTION">EXECUTE EMERGENCY LOAD REDUCTION</option>
                    <option value="OPEN_PRIMARY_COOLANT_VALVE">OPEN PRIMARY COOLANT VALVE</option>
                    <option value="TRIP_CIRCUIT_BREAKER">TRIP MAIN CIRCUIT BREAKER</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-400 font-medium mb-1">Alert Throttle / Cooldown (ms)</label>
              <input
                type="number"
                step="500"
                value={data.cooldownMs || 4000}
                onChange={(e) => handleChange('cooldownMs', parseInt(e.target.value, 10))}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 p-3 bg-slate-950/80 flex items-center justify-between">
        <button
          onClick={() => onDeleteNode(id)}
          className="flex items-center gap-1.5 rounded bg-rose-950/60 border border-rose-800/60 px-3 py-1.5 text-rose-300 hover:bg-rose-900/80 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Node</span>
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-1 rounded bg-slate-800 px-3 py-1.5 text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          <span>Done</span>
        </button>
      </div>
    </div>
  );
}
