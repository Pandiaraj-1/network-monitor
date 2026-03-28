import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { api } from '../api/api';

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [mlHealth, setMlHealth] = useState(null);

  // Auto-refresh devices every 5 seconds
  useEffect(() => {
    loadDevices();
    loadMlHealth();
    const interval = setInterval(() => {
      loadDevices();
      loadMlHealth();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load telemetry when device is selected
  useEffect(() => {
    if (selectedDevice) {
      loadTelemetry(selectedDevice.deviceId);
      loadAnomalies(selectedDevice.deviceId);
      const interval = setInterval(() => {
        loadTelemetry(selectedDevice.deviceId);
        loadAnomalies(selectedDevice.deviceId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedDevice]);

  const loadDevices = async () => {
    try {
      const res = await api.getDevices();
      setDevices(res.data);
    } catch (e) {
      console.error('Failed to load devices:', e);
    }
  };

  const loadTelemetry = async (deviceId) => {
    try {
      const res = await api.getTelemetry(deviceId, 60);
      setTelemetry(res.data.slice(-20));
    } catch (e) {
      console.error('Failed to load telemetry:', e);
    }
  };

  const loadAnomalies = async (deviceId) => {
    try {
      const res = await api.getAnomalies(deviceId);
      setAnomalies(res.data);
    } catch (e) {
      console.error('Failed to load anomalies:', e);
    }
  };

  const loadMlHealth = async () => {
    try {
      const res = await api.getMlHealth();
      setMlHealth(res.data);
    } catch (e) {
      // ML service might not be running
    }
  };

  const statusColor = (status) => ({
    online: '#22c55e',
    offline: '#ef4444',
    degraded: '#f59e0b',
  }[status] || '#6b7280');

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div style={{
      padding: 24,
      background: '#0f172a',
      minHeight: '100vh',
      color: '#e2e8f0',
      fontFamily: 'monospace'
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ color: '#38bdf8', margin: 0, fontSize: 24 }}>
          Network Monitor Dashboard
        </h1>
        {mlHealth && (
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            ML Model: {mlHealth.model_trained
              ? '✅ Trained'
              : `⏳ ${mlHealth.events_until_training} events until training`}
          </div>
        )}
      </div>

      {/* Device Grid */}
      <h2 style={{ color: '#94a3b8', fontSize: 14, marginBottom: 12 }}>
        DEVICES ({devices.length})
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 32
      }}>
        {devices.map(device => (
          <div
            key={device.id}
            onClick={() => setSelectedDevice(device)}
            style={{
              padding: 16,
              background: selectedDevice?.id === device.id ? '#1e3a5f' : '#1e293b',
              borderRadius: 8,
              cursor: 'pointer',
              border: `1px solid ${statusColor(device.status)}`,
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 14 }}>
              {device.name}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
              {device.ipAddress}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
              {device.type}
            </div>
            <div style={{
              fontSize: 12,
              color: statusColor(device.status),
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <span style={{
                width: 8, height: 8,
                borderRadius: '50%',
                background: statusColor(device.status),
                display: 'inline-block'
              }}/>
              {device.status}
            </div>
          </div>
        ))}

        {devices.length === 0 && (
          <div style={{ color: '#94a3b8', fontSize: 13, gridColumn: '1/-1' }}>
            No devices registered yet. Use Postman to POST to /api/devices
          </div>
        )}
      </div>

      {/* Charts and Anomalies for selected device */}
      {selectedDevice && (
        <div>
          <h2 style={{ color: '#38bdf8', marginBottom: 16 }}>
            {selectedDevice.name} — Live Metrics
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

            {/* Latency Chart */}
            <div style={{ background: '#1e293b', borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px 0' }}>
                Latency (ms)
              </h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={telemetry}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="timestamp" tickFormatter={formatTime} hide />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 11 }}
                    labelFormatter={formatTime}
                  />
                  <Line
                    type="monotone"
                    dataKey="latency"
                    stroke="#38bdf8"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* CPU & Memory Chart */}
            <div style={{ background: '#1e293b', borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px 0' }}>
                CPU (orange) & Memory % (purple)
              </h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={telemetry}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="timestamp" tickFormatter={formatTime} hide />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 11 }}
                  />
                  <Line type="monotone" dataKey="cpuUsage" stroke="#f59e0b" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="memoryUsage" stroke="#a78bfa" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Packet Loss Chart */}
            <div style={{ background: '#1e293b', borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px 0' }}>
                Packet Loss (%)
              </h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={telemetry}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 11 }}
                  />
                  <Line type="monotone" dataKey="packetLoss" stroke="#ef4444" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bandwidth Chart */}
            <div style={{ background: '#1e293b', borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px 0' }}>
                Bandwidth (Mbps)
              </h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={telemetry}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 11 }}
                  />
                  <Line type="monotone" dataKey="bandwidth" stroke="#22c55e" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Anomaly Alerts */}
          <div style={{ background: '#1e293b', borderRadius: 8, padding: 16 }}>
            <h3 style={{ fontSize: 13, color: '#ef4444', margin: '0 0 12px 0' }}>
              ANOMALY ALERTS
            </h3>
            {anomalies.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>
                No anomalies detected for {selectedDevice.name}
              </p>
            ) : (
              anomalies.slice(0, 5).map((a, i) => (
                <div key={i} style={{
                  padding: '10px 12px',
                  marginBottom: 8,
                  background: '#2d1515',
                  borderRadius: 6,
                  borderLeft: '3px solid #ef4444'
                }}>
                  <div style={{ fontSize: 12, color: '#f87171', fontWeight: 'bold' }}>
                    {a.reason}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    {new Date(a.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!selectedDevice && devices.length > 0 && (
        <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
          Click a device card above to see its metrics and anomalies
        </div>
      )}
    </div>
  );
}