import React, { useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, MessageSquare, ShieldAlert, Clock, ArrowRight, ExternalLink } from 'lucide-react';

export default function AlertsFeed({ alerts = [], onAcknowledgeAlert }) {
  const [selectedAlert, setSelectedAlert] = useState(null);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Factory Incident & Carrier Dispatch Log</h3>
            <div className="text-[11px] text-slate-400">
              Live alerts compiled from visual rule engine pipelines
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-rose-950/80 px-2.5 py-0.5 text-xs font-mono font-bold text-rose-300 border border-rose-800/40">
            {alerts.filter(a => a.status === 'ACTIVE').length} ACTIVE
          </span>
        </div>
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-slate-850 max-h-[380px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/60 mb-2" />
            <div className="text-sm font-medium text-slate-300">All Industrial Machine Metrics Nominal</div>
            <div className="text-xs text-slate-400 mt-1">
              No anomaly conditions or alert triggers active. Use "Inject Anomaly" to test pipeline rules.
            </div>
          </div>
        ) : (
          alerts.map((alert) => {
            const isSms = alert.alertType === 'SMS_ALERT';
            const sms = alert.details?.smsDispatch;
            const isAck = alert.status === 'ACKNOWLEDGED';

            return (
              <div
                key={alert.alertId || alert._id}
                className={`p-4 transition-colors hover:bg-slate-850/50 ${
                  isAck ? 'opacity-60 bg-slate-950/30' : 'bg-slate-900/40'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isAck ? 'bg-slate-800 text-slate-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {isSms ? <MessageSquare className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-300">
                          {alert.deviceId}
                        </span>
                        <span className="text-xs font-semibold text-slate-300 capitalize">
                          {alert.sensorType} Anomaly
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                          isAck
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-rose-950/80 text-rose-400 border-rose-800/40'
                        }`}>
                          {alert.status}
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-slate-200">
                        {alert.details?.message || `Triggered threshold on ${alert.deviceId}`}
                      </div>

                      {/* SMS Carrier Receipt box */}
                      {sms && (
                        <div className="mt-2.5 rounded-lg bg-slate-950 p-2.5 border border-slate-800 text-[11px] font-mono space-y-1">
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Gateway: <strong className="text-slate-200">{sms.carrier}</strong></span>
                            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              {sms.status} ({sms.networkLatencyMs}ms)
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Recipient: <span className="text-cyan-300">{sms.to}</span></span>
                            <span>SID: <span className="text-slate-400">{sms.sid}</span></span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>

                    {!isAck && (
                      <button
                        onClick={() => onAcknowledgeAlert(alert.alertId)}
                        className="rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
