import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from 'recharts';
import { api } from '../api/api';

// ── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        '#080c14',
  bgPanel:   '#0d1420',
  bgCard:    '#111927',
  border:    '#1a2740',
  borderHi:  '#1e3a5f',
  cyan:      '#00d4ff',
  cyanDim:   '#0a4a5e',
  green:     '#00e676',
  greenDim:  '#0a3d20',
  amber:     '#ffab00',
  amberDim:  '#3d2800',
  red:       '#ff3d57',
  redDim:    '#3d0a10',
  purple:    '#b47cff',
  textPri:   '#e8f4ff',
  textSec:   '#6b8aad',
  textDim:   '#334a66',
};

// ── Global styles injected once ──────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${C.bg};
    color: ${C.textPri};
    font-family: 'IBM Plex Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }

  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: 1; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
  @keyframes slide-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scan {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes glow-pulse {
    0%,100% { box-shadow: 0 0 8px ${C.cyan}44; }
    50%      { box-shadow: 0 0 20px ${C.cyan}88, 0 0 40px ${C.cyan}33; }
  }

  .nm-card {
    background: ${C.bgCard};
    border: 1px solid ${C.border};
    border-radius: 6px;
    transition: border-color 0.2s;
  }
  .nm-card:hover { border-color: ${C.borderHi}; }

  .nm-device-card {
    background: ${C.bgCard};
    border: 1px solid ${C.border};
    border-radius: 6px;
    padding: 14px 16px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .nm-device-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 2px;
    background: ${C.textDim};
    transition: background 0.2s;
  }
  .nm-device-card:hover { border-color: ${C.borderHi}; }
  .nm-device-card:hover::before { background: ${C.cyan}; }
  .nm-device-card.selected {
    background: #0d1e33;
    border-color: ${C.cyan}66;
    animation: glow-pulse 3s ease-in-out infinite;
  }
  .nm-device-card.selected::before { background: ${C.cyan}; }

  .nm-device-card.status-online::before  { background: ${C.green}; }
  .nm-device-card.status-offline::before { background: ${C.red}; }
  .nm-device-card.status-degraded::before{ background: ${C.amber}; }

  .nm-badge {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 3px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 500;
  }

  .nm-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${C.textDim};
    font-weight: 500;
  }

  .nm-stat-value {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 22px;
    font-weight: 600;
    line-height: 1;
  }

  .nm-anomaly-row {
    padding: 10px 14px;
    border-left: 2px solid ${C.red};
    background: ${C.redDim}44;
    border-radius: 0 4px 4px 0;
    animation: slide-in 0.3s ease;
  }

  .nm-tab {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 6px 14px;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s;
    background: transparent;
    color: ${C.textSec};
  }
  .nm-tab:hover { color: ${C.textPri}; border-color: ${C.border}; }
  .nm-tab.active {
    background: ${C.cyanDim};
    border-color: ${C.cyan}44;
    color: ${C.cyan};
  }

  .nm-header-bar {
    background: ${C.bgPanel};
    border-bottom: 1px solid ${C.border};
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .scan-line {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, ${C.cyan}22, transparent);
    animation: scan 8s linear infinite;
    pointer-events: none;
    z-index: 9999;
  }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const statusColor = s => ({ online: C.green, offline: C.red, degraded: C.amber }[s] || C.textDim);
const statusBg    = s => ({ online: C.greenDim, offline: C.redDim, degraded: C.amberDim }[s] || C.bgCard);
const fmtTime     = ts => ts ? new Date(ts).toLocaleTimeString('en-IN', { hour12: false }) : '';
const fmtNum      = (n, dec = 1) => (n ?? 0).toFixed(dec);

function LiveDot({ color }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 10, height: 10 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color, opacity: 0.3,
        animation: 'pulse-ring 1.8s ease-out infinite',
      }} />
      <span style={{
        position: 'absolute', inset: '2px', borderRadius: '50%', background: color,
      }} />
    </span>
  );
}

function StatCard({ label, value, unit, color = C.cyan, sub }) {
  return (
    <div className="nm-card" style={{ padding: '14px 16px' }}>
      <div className="nm-label" style={{ marginBottom: 8 }}>{label}</div>
      <div className="nm-stat-value" style={{ color }}>
        {value}<span style={{ fontSize: 12, color: C.textSec, marginLeft: 4, fontWeight: 400 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 11, color: C.textSec, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.bgPanel, border: `1px solid ${C.border}`,
      borderRadius: 4, padding: '8px 12px', fontSize: 11,
      fontFamily: 'IBM Plex Mono, monospace',
    }}>
      <div style={{ color: C.textSec, marginBottom: 4 }}>{fmtTime(label)}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {fmtNum(p.value)} {p.unit}
        </div>
      ))}
    </div>
  );
};

function MetricChart({ data, lines, height = 140 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          {lines.map(l => (
            <linearGradient key={l.key} id={`grad-${l.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={l.color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={l.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false} />
        <XAxis dataKey="timestamp" tickFormatter={fmtTime} tick={false} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: C.textDim, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        {lines.map(l => (
          <React.Fragment key={l.key}>
            <Area
              type="monotone" dataKey={l.key} name={l.label} unit={l.unit}
              stroke={l.color} strokeWidth={1.5} dot={false}
              fill={`url(#grad-${l.key})`}
            />
          </React.Fragment>
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [devices,        setDevices]        = useState([]);
  const [selected,       setSelected]       = useState(null);
  const [telemetry,      setTelemetry]      = useState([]);
  const [anomalies,      setAnomalies]      = useState([]);
  const [mlHealth,       setMlHealth]       = useState(null);
  const [activeTab,      setActiveTab]      = useState('metrics');
  const [now,            setNow]            = useState(new Date());
  const styleInjected    = useRef(false);

  // Inject global CSS once
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement('style');
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
  }, []);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Devices + ML health poll
  useEffect(() => {
    const load = () => { loadDevices(); loadMlHealth(); };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  // Telemetry + anomalies poll when device selected
  useEffect(() => {
    if (!selected) return;
    const load = () => { loadTelemetry(selected.deviceId); loadAnomalies(selected.deviceId); };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [selected]);

  const loadDevices     = async () => { try { const r = await api.getDevices();               setDevices(r.data);   } catch {} };
  const loadMlHealth    = async () => { try { const r = await api.getMlHealth();               setMlHealth(r.data);  } catch {} };
  const loadTelemetry   = async id => { try { const r = await api.getTelemetry(id, 60);        setTelemetry(r.data.slice(-30)); } catch {} };
  const loadAnomalies   = async id => { try { const r = await api.getAnomalies(id);            setAnomalies(r.data); } catch {} };

  const latest   = telemetry[telemetry.length - 1] || {};
  const onlineN  = devices.filter(d => d.status === 'online').length;
  const offlineN = devices.filter(d => d.status === 'offline').length;

  return (
    <>
      <div className="scan-line" />

      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <div className="nm-header-bar">
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 56,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 4,
              background: `linear-gradient(135deg, ${C.cyan}, #0066aa)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <div style={{
                fontFamily: 'IBM Plex Mono', fontSize: 13, fontWeight: 600,
                color: C.textPri, letterSpacing: '0.05em',
              }}>
                NETMONITOR
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: C.textDim, letterSpacing: '0.12em' }}>
                NETWORK OPERATIONS CENTER
              </div>
            </div>
          </div>

          {/* Center — global stats */}
          <div style={{ display: 'flex', gap: 32 }}>
            {[
              { label: 'TOTAL',   val: devices.length,            color: C.textPri },
              { label: 'ONLINE',  val: onlineN,                   color: C.green   },
              { label: 'OFFLINE', val: offlineN,                  color: C.red     },
              { label: 'ALERTS',  val: anomalies.length,          color: C.amber   },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 18, fontWeight: 600, color: s.color, lineHeight: 1 }}>
                  {s.val}
                </div>
                <div className="nm-label" style={{ marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Right — clock + ML status */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 16, fontWeight: 500,
              color: C.cyan, letterSpacing: '0.05em',
            }}>
              {now.toLocaleTimeString('en-IN', { hour12: false })}
            </div>
            <div style={{ fontSize: 10, color: C.textSec, marginTop: 2 }}>
              {mlHealth
                ? mlHealth.model_trained
                  ? <span style={{ color: C.green }}>● ML ACTIVE</span>
                  : <span style={{ color: C.amber, animation: 'blink 1.5s infinite' }}>
                      ● TRAINING IN {mlHealth.events_until_training} EVT
                    </span>
                : <span style={{ color: C.textDim }}>● ML OFFLINE</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Layout ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px', display: 'flex', gap: 20 }}>

        {/* ── LEFT: Device List ─────────────────────────────────────────── */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div className="nm-label" style={{ marginBottom: 10 }}>
            DEVICES / {devices.length}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {devices.map(d => (
              <div
                key={d.id}
                className={`nm-device-card status-${d.status} ${selected?.id === d.id ? 'selected' : ''}`}
                onClick={() => setSelected(d)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.textPri }}>{d.name}</div>
                  <LiveDot color={statusColor(d.status)} />
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: C.textSec, marginBottom: 4 }}>
                  {d.ipAddress}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="nm-badge" style={{
                    background: statusBg(d.status),
                    color: statusColor(d.status),
                    border: `1px solid ${statusColor(d.status)}33`,
                  }}>
                    {d.status}
                  </span>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: C.textDim }}>
                    {d.type?.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}

            {devices.length === 0 && (
              <div style={{
                padding: 16, border: `1px dashed ${C.border}`,
                borderRadius: 6, textAlign: 'center',
              }}>
                <div style={{ color: C.textDim, fontSize: 11, lineHeight: 1.6 }}>
                  No devices.<br/>POST to<br/>
                  <span style={{ color: C.cyan, fontFamily: 'IBM Plex Mono', fontSize: 10 }}>
                    /api/devices
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Detail Panel ───────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {!selected ? (
            /* Empty state */
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: 500, gap: 16,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                border: `2px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01"/>
                </svg>
              </div>
              <div style={{ color: C.textSec, fontSize: 13 }}>Select a device to view metrics</div>
            </div>
          ) : (
            <div style={{ animation: 'slide-in 0.3s ease' }}>

              {/* Device header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <LiveDot color={statusColor(selected.status)} />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: C.textPri }}>
                      {selected.name}
                    </div>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: C.textSec }}>
                      {selected.deviceId} · {selected.ipAddress} · {selected.type?.toUpperCase()}
                    </div>
                  </div>
                </div>
                <span className="nm-badge" style={{
                  background: statusBg(selected.status),
                  color: statusColor(selected.status),
                  border: `1px solid ${statusColor(selected.status)}44`,
                  padding: '4px 12px', fontSize: 11,
                }}>
                  {selected.status?.toUpperCase()}
                </span>
              </div>

              {/* Stat row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                <StatCard label="Latency"     value={fmtNum(latest.latency)}      unit="ms"   color={C.cyan}   />
                <StatCard label="CPU Usage"   value={fmtNum(latest.cpuUsage)}     unit="%"    color={C.amber}  />
                <StatCard label="Memory"      value={fmtNum(latest.memoryUsage)}  unit="%"    color={C.purple} />
                <StatCard label="Packet Loss" value={fmtNum(latest.packetLoss,2)} unit="%"    color={latest.packetLoss > 5 ? C.red : C.green} />
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {['metrics', 'anomalies'].map(t => (
                  <button key={t} className={`nm-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                    {t === 'anomalies' && anomalies.length > 0
                      ? `Anomalies (${anomalies.length})`
                      : t.charAt(0).toUpperCase() + t.slice(1)
                    }
                  </button>
                ))}
              </div>

              {activeTab === 'metrics' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                  {/* Latency */}
                  <div className="nm-card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div className="nm-label">Latency</div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: C.cyan }}>
                        {fmtNum(latest.latency)} ms
                      </div>
                    </div>
                    <MetricChart data={telemetry} lines={[{ key: 'latency', label: 'Latency', color: C.cyan, unit: 'ms' }]} />
                  </div>

                  {/* CPU + Memory */}
                  <div className="nm-card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div className="nm-label">CPU & Memory</div>
                      <div style={{ display: 'flex', gap: 12, fontFamily: 'IBM Plex Mono', fontSize: 11 }}>
                        <span style={{ color: C.amber }}>CPU {fmtNum(latest.cpuUsage)}%</span>
                        <span style={{ color: C.purple }}>MEM {fmtNum(latest.memoryUsage)}%</span>
                      </div>
                    </div>
                    <MetricChart data={telemetry} lines={[
                      { key: 'cpuUsage',    label: 'CPU',    color: C.amber,  unit: '%' },
                      { key: 'memoryUsage', label: 'Memory', color: C.purple, unit: '%' },
                    ]} />
                  </div>

                  {/* Bandwidth */}
                  <div className="nm-card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div className="nm-label">Bandwidth</div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: C.green }}>
                        {fmtNum(latest.bandwidth)} Mbps
                      </div>
                    </div>
                    <MetricChart data={telemetry} lines={[{ key: 'bandwidth', label: 'Bandwidth', color: C.green, unit: 'Mbps' }]} />
                  </div>

                  {/* Packet Loss */}
                  <div className="nm-card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div className="nm-label">Packet Loss</div>
                      <div style={{
                        fontFamily: 'IBM Plex Mono', fontSize: 11,
                        color: (latest.packetLoss ?? 0) > 5 ? C.red : C.green,
                      }}>
                        {fmtNum(latest.packetLoss, 2)}%
                      </div>
                    </div>
                    <MetricChart data={telemetry} lines={[{ key: 'packetLoss', label: 'Packet Loss', color: C.red, unit: '%' }]} />
                  </div>
                </div>
              )}

              {activeTab === 'anomalies' && (
                <div className="nm-card" style={{ padding: 20 }}>
                  {anomalies.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: '40px 0',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: C.greenDim,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      </div>
                      <div style={{ color: C.textSec, fontSize: 13 }}>No anomalies detected</div>
                      <div style={{ color: C.textDim, fontSize: 11 }}>
                        {mlHealth?.model_trained
                          ? 'System is operating normally'
                          : `ML model training — ${mlHealth?.events_until_training ?? '?'} more events needed`}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="nm-label" style={{ marginBottom: 14 }}>
                        {anomalies.length} ANOMAL{anomalies.length === 1 ? 'Y' : 'IES'} DETECTED
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {anomalies.slice(0, 10).map((a, i) => (
                          <div key={i} className="nm-anomaly-row">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ fontSize: 12, color: C.red, fontWeight: 500 }}>
                                {a.reason}
                              </div>
                              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: C.textSec, flexShrink: 0, marginLeft: 16 }}>
                                {new Date(a.timestamp).toLocaleTimeString('en-IN', { hour12: false })}
                              </div>
                            </div>
                            {a.telemetry && (
                              <div style={{
                                marginTop: 6, display: 'flex', gap: 16,
                                fontFamily: 'IBM Plex Mono', fontSize: 10, color: C.textDim,
                              }}>
                                <span>lat {fmtNum(a.telemetry.latency)}ms</span>
                                <span>cpu {fmtNum(a.telemetry.cpuUsage)}%</span>
                                <span>mem {fmtNum(a.telemetry.memoryUsage)}%</span>
                                <span>loss {fmtNum(a.telemetry.packetLoss, 2)}%</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom status bar ────────────────────────────────────────────── */}
      <div style={{
        borderTop: `1px solid ${C.border}`,
        background: C.bgPanel,
        padding: '6px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: 'IBM Plex Mono', fontSize: 10, color: C.textDim,
        position: 'fixed', bottom: 0, left: 0, right: 0,
      }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <span>KAFKA <span style={{ color: C.green }}>●</span> CONNECTED</span>
          <span>ELASTICSEARCH <span style={{ color: C.green }}>●</span> CONNECTED</span>
          <span>POSTGRESQL <span style={{ color: C.green }}>●</span> CONNECTED</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <span>REFRESH INTERVAL <span style={{ color: C.cyan }}>5s</span></span>
          <span>v1.0.0</span>
        </div>
      </div>

      {/* Bottom bar spacer */}
      <div style={{ height: 36 }} />
    </>
  );
}