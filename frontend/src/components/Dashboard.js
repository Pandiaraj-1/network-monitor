import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../api/api';

const C = {
  bg:      '#07090f', bgPanel: '#0b0e18', bgCard: '#0d1525',
  border:  '#151d2e', borderHi: '#1e3050',
  cyan:    '#40c4ff', cyanBg: '#0d2a3d',
  green:   '#00e676', greenBg: '#002211',
  amber:   '#ff9100', amberBg: '#221500',
  red:     '#ff1744', redBg: '#220008',
  purple:  '#b47cff',
  txt:     '#e2eeff', txtSec: '#4a6a8a', txtDim: '#334d6e',
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Syne:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%}
body{background:${C.bg};color:${C.txt};font-family:'Syne',sans-serif;-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-track{background:${C.bg}}
::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
@keyframes ripple{0%{transform:scale(1);opacity:.7}100%{transform:scale(3);opacity:0}}
@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
.nm-ripple{position:absolute;inset:0;border-radius:50%;animation:ripple 2s ease-out infinite}
.nm-dot{width:6px;height:6px;border-radius:50%;position:relative;z-index:1}
.nm-dot-wrap{position:relative;display:inline-flex;align-items:center;justify-content:center;width:10px;height:10px;flex-shrink:0}
.mono{font-family:'JetBrains Mono',monospace}
.lbl{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;color:${C.txtDim};text-transform:uppercase}
.nm-device{background:${C.bgPanel};border:1px solid ${C.border};border-radius:6px;padding:12px 14px;cursor:pointer;transition:all .18s;border-left:2px solid transparent}
.nm-device:hover{border-color:${C.borderHi}}
.nm-device.sel{background:${C.bgCard};border-color:#40c4ff44}
.nm-device.online{border-left-color:${C.green}}
.nm-device.offline{border-left-color:${C.red}}
.nm-device.degraded{border-left-color:${C.amber}}
.nm-badge{font-family:'JetBrains Mono',monospace;font-size:9px;padding:2px 8px;border-radius:3px;letter-spacing:.08em;font-weight:500}
.nm-stat{background:${C.bgCard};border:1px solid ${C.border};border-radius:6px;padding:14px 16px}
.nm-card{background:${C.bgCard};border:1px solid ${C.border};border-radius:6px;padding:16px}
.nm-tab{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:5px 14px;border-radius:4px;cursor:pointer;border:1px solid transparent;background:transparent;color:${C.txtSec};transition:all .15s}
.nm-tab:hover{color:${C.txt};border-color:${C.border}}
.nm-tab.active{background:${C.cyanBg};border-color:#40c4ff33;color:${C.cyan}}
.nm-anomaly{padding:10px 14px;border-left:2px solid ${C.red};background:${C.redBg}33;border-radius:0 4px 4px 0;animation:fadein .3s ease}
.nm-warn{padding:10px 14px;border-left:2px solid ${C.amber};background:${C.amberBg}33;border-radius:0 4px 4px 0;animation:fadein .3s ease}
`;

const statusColor = s => ({ online: C.green, offline: C.red, degraded: C.amber }[s] || C.txtDim);
const statusBg    = s => ({ online: C.greenBg, offline: C.redBg, degraded: C.amberBg }[s] || C.bgCard);
const fmt         = (n, d = 1) => Number(n ?? 0).toFixed(d);
const fmtTime     = ts => ts ? new Date(ts).toLocaleTimeString('en-IN', { hour12: false }) : '';

function LiveDot({ color, animate = true }) {
  return (
    <span className="nm-dot-wrap">
      {animate && <span className="nm-ripple" style={{ background: color }} />}
      <span className="nm-dot" style={{ background: color }} />
    </span>
  );
}

function StatCard({ label, value, unit, color }) {
  return (
    <div className="nm-stat">
      <div className="lbl" style={{ marginBottom: 8 }}>{label}</div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 600, color, lineHeight: 1 }}>
        {value}<span style={{ fontSize: 11, color: C.txtSec, fontWeight: 400, marginLeft: 3 }}>{unit}</span>
      </div>
    </div>
  );
}

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="mono" style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 4, padding: '7px 11px', fontSize: 10 }}>
      {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value, 2)}{p.unit}</div>)}
    </div>
  );
};

function Chart({ data, lines }) {
  const ids = lines.map(() => `g${Math.random().toString(36).slice(2, 7)}`);
  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 4, right: 2, left: -28, bottom: 0 }}>
        <defs>
          {lines.map((l, i) => (
            <linearGradient key={ids[i]} id={ids[i]} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={l.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={l.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="2 6" stroke={C.border} vertical={false} />
        <XAxis dataKey="timestamp" tick={false} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: C.txtDim, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        {lines.map((l, i) => (
          <Area key={l.key} type="monotone" dataKey={l.key} name={l.label} unit={l.unit}
            stroke={l.color} strokeWidth={1.5} dot={false} fill={`url(#${ids[i]})`} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const [devices,   setDevices]   = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [mlHealth,  setMlHealth]  = useState(null);
  const [tab,       setTab]       = useState('metrics');
  const [clock,     setClock]     = useState('');
  const cssInjected = useRef(false);

  useEffect(() => {
    if (cssInjected.current) return;
    cssInjected.current = true;
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('en-IN', { hour12: false })), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const load = () => { fetchDevices(); fetchMl(); };
    load(); const t = setInterval(load, 5000); return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const load = () => { fetchTelemetry(selected.deviceId); fetchAnomalies(selected.deviceId); };
    load(); const t = setInterval(load, 5000); return () => clearInterval(t);
  }, [selected]);

  const fetchDevices   = async () => { try { setDevices((await api.getDevices()).data); } catch {} };
  const fetchMl        = async () => { try { setMlHealth((await api.getMlHealth()).data); } catch {} };
  const fetchTelemetry = async id => { try { setTelemetry((await api.getTelemetry(id, 60)).data.slice(-30)); } catch {} };
  const fetchAnomalies = async id => { try { setAnomalies((await api.getAnomalies(id)).data); } catch {} };

  const latest  = telemetry[telemetry.length - 1] || {};
  const onlineN = devices.filter(d => d.status === 'online').length;
  const offlineN= devices.filter(d => d.status === 'offline').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ background: C.bgPanel, borderBottom: `1px solid ${C.border}`, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: '#0d47a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.06em' }}>NETMONITOR</div>
            <div className="lbl" style={{ fontSize: 8 }}>Network Operations Center</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 32 }}>
          {[['DEVICES', devices.length, C.txt], ['ONLINE', onlineN, C.green], ['OFFLINE', offlineN, C.red], ['ALERTS', anomalies.length, C.amber]].map(([l, v, co]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: co, lineHeight: 1 }}>{v}</div>
              <div className="lbl" style={{ marginTop: 3, fontSize: 8 }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: C.cyan }}>{clock}</div>
          <div className="mono" style={{ fontSize: 9, marginTop: 2 }}>
            {mlHealth ? mlHealth.model_trained
              ? <span style={{ color: C.green }}>● ML MODEL ACTIVE</span>
              : <span style={{ color: C.amber, animation: 'blink 1.5s infinite' }}>● TRAINING — {mlHealth.events_until_training} EVT</span>
              : <span style={{ color: C.txtDim }}>● ML OFFLINE</span>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <div style={{ width: 220, background: C.bgPanel, borderRight: `1px solid ${C.border}`, padding: '16px 12px', flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="lbl" style={{ marginBottom: 4 }}>Devices / {devices.length}</div>
          {devices.map(d => (
            <div key={d.id} className={`nm-device ${d.status || 'online'} ${selected?.id === d.id ? 'sel' : ''}`}
              onClick={() => { setSelected(d); setTab('metrics'); }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{d.name}</div>
                <LiveDot color={statusColor(d.status)} animate={d.status !== 'offline'} />
              </div>
              <div className="mono" style={{ fontSize: 10, color: C.txtSec, marginBottom: 6 }}>{d.ipAddress}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="nm-badge" style={{ background: statusBg(d.status), color: statusColor(d.status), border: `1px solid ${statusColor(d.status)}44` }}>
                  {(d.status || 'unknown').toUpperCase()}
                </span>
                <span className="mono" style={{ fontSize: 9, color: C.txtDim }}>{(d.type || '').toUpperCase()}</span>
              </div>
            </div>
          ))}
          {devices.length === 0 && (
            <div style={{ border: `1px dashed ${C.border}`, borderRadius: 6, padding: '20px 12px', textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 10, color: C.txtDim, lineHeight: 1.8 }}>No devices<br/>POST to<br/><span style={{ color: C.cyan }}>/api/devices</span></div>
            </div>
          )}
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20, minWidth: 0 }}>
          {!selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.txtDim} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              </div>
              <div style={{ color: C.txtSec, fontSize: 13 }}>Select a device to view metrics</div>
            </div>
          ) : (
            <div style={{ animation: 'fadein .25s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <LiveDot color={statusColor(selected.status)} />
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 600 }}>{selected.name}</div>
                    <div className="mono" style={{ fontSize: 10, color: C.txtSec }}>{selected.deviceId} · {selected.ipAddress} · {(selected.type || '').toUpperCase()}</div>
                  </div>
                </div>
                <span className="nm-badge" style={{ background: statusBg(selected.status), color: statusColor(selected.status), border: `1px solid ${statusColor(selected.status)}44`, padding: '4px 14px', fontSize: 10 }}>
                  {(selected.status || 'UNKNOWN').toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
                <StatCard label="Latency"     value={fmt(latest.latency)}       unit="ms"  color={C.cyan}   />
                <StatCard label="CPU Usage"   value={fmt(latest.cpuUsage)}      unit="%"   color={C.amber}  />
                <StatCard label="Memory"      value={fmt(latest.memoryUsage)}   unit="%"   color={C.purple} />
                <StatCard label="Packet Loss" value={fmt(latest.packetLoss, 2)} unit="%"   color={(latest.packetLoss ?? 0) > 5 ? C.red : C.green} />
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button className={`nm-tab ${tab === 'metrics' ? 'active' : ''}`} onClick={() => setTab('metrics')}>Metrics</button>
                <button className={`nm-tab ${tab === 'anomalies' ? 'active' : ''}`} onClick={() => setTab('anomalies')}>
                  {anomalies.length > 0 ? `Anomalies (${anomalies.length})` : 'Anomalies'}
                </button>
              </div>

              {tab === 'metrics' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="nm-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div className="lbl">Latency</div>
                      <div className="mono" style={{ fontSize: 11, color: C.cyan }}>{fmt(latest.latency)} ms</div>
                    </div>
                    <Chart data={telemetry} lines={[{ key: 'latency', label: 'Latency', color: C.cyan, unit: 'ms' }]} />
                  </div>
                  <div className="nm-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div className="lbl">CPU & Memory</div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span className="mono" style={{ fontSize: 10, color: C.amber }}>CPU {fmt(latest.cpuUsage)}%</span>
                        <span className="mono" style={{ fontSize: 10, color: C.purple }}>MEM {fmt(latest.memoryUsage)}%</span>
                      </div>
                    </div>
                    <Chart data={telemetry} lines={[{ key: 'cpuUsage', label: 'CPU', color: C.amber, unit: '%' }, { key: 'memoryUsage', label: 'Memory', color: C.purple, unit: '%' }]} />
                  </div>
                  <div className="nm-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div className="lbl">Bandwidth</div>
                      <div className="mono" style={{ fontSize: 11, color: C.green }}>{fmt(latest.bandwidth)} Mbps</div>
                    </div>
                    <Chart data={telemetry} lines={[{ key: 'bandwidth', label: 'Bandwidth', color: C.green, unit: 'Mbps' }]} />
                  </div>
                  <div className="nm-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div className="lbl">Packet Loss</div>
                      <div className="mono" style={{ fontSize: 11, color: (latest.packetLoss ?? 0) > 5 ? C.red : C.green }}>{fmt(latest.packetLoss, 2)}%</div>
                    </div>
                    <Chart data={telemetry} lines={[{ key: 'packetLoss', label: 'Packet Loss', color: C.red, unit: '%' }]} />
                  </div>
                </div>
              )}

              {tab === 'anomalies' && (
                <div className="nm-card">
                  {anomalies.length === 0 ? (
                    <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                      </div>
                      <div style={{ color: C.txtSec, fontSize: 13 }}>No anomalies detected</div>
                      <div className="mono" style={{ fontSize: 10, color: C.txtDim }}>
                        {mlHealth?.model_trained ? 'System operating normally' : `Model needs ${mlHealth?.events_until_training ?? '?'} more events`}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="lbl" style={{ marginBottom: 14, color: C.red }}>{anomalies.length} Anomal{anomalies.length === 1 ? 'y' : 'ies'} detected</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {anomalies.slice(0, 10).map((a, i) => (
                          <div key={i} className={(a.anomaly_score ?? 0) < -0.15 ? 'nm-anomaly' : 'nm-warn'}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ fontSize: 12, fontWeight: 500, color: (a.anomaly_score ?? 0) < -0.15 ? C.red : C.amber }}>{a.reason}</div>
                              <div className="mono" style={{ fontSize: 10, color: C.txtSec, marginLeft: 16, flexShrink: 0 }}>{fmtTime(a.timestamp)}</div>
                            </div>
                            {a.telemetry && (
                              <div className="mono" style={{ fontSize: 10, color: C.txtDim, marginTop: 5, display: 'flex', gap: 16 }}>
                                <span>lat {fmt(a.telemetry.latency)}ms</span>
                                <span>cpu {fmt(a.telemetry.cpuUsage)}%</span>
                                <span>mem {fmt(a.telemetry.memoryUsage)}%</span>
                                <span>loss {fmt(a.telemetry.packetLoss, 2)}%</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div style={{ background: C.bgPanel, borderTop: `1px solid ${C.border}`, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 22 }}>
          {['KAFKA', 'ELASTICSEARCH', 'POSTGRESQL', 'NEO4J'].map(s => (
            <span key={s} className="mono" style={{ fontSize: 9, color: C.txtDim }}>{s} <span style={{ color: C.green }}>●</span></span>
          ))}
        </div>
        <div className="mono" style={{ fontSize: 9, color: C.txtDim }}>REFRESH <span style={{ color: C.cyan }}>5s</span> · v1.0.0</div>
      </div>
    </div>
  );
}