import axios from 'axios';

const BACKEND = 'http://localhost:8080/api';
const ML = 'http://localhost:5000';

export const api = {
  // Devices
  getDevices: () => axios.get(`${BACKEND}/devices`),
  registerDevice: (data) => axios.post(`${BACKEND}/devices`, data),
  updateStatus: (deviceId, status) =>
    axios.patch(`${BACKEND}/devices/${deviceId}/status?status=${status}`),

  // Telemetry
  sendTelemetry: (data) => axios.post(`${BACKEND}/telemetry`, data),
  getTelemetry: (deviceId, minutes = 30) =>
    axios.get(`${BACKEND}/telemetry/${deviceId}?minutes=${minutes}`),

  // Topology
  getTopology: () => axios.get(`${BACKEND}/topology`),

  // ML Service
  getAnomalies: (deviceId) => axios.get(`${ML}/anomalies/${deviceId}`),
  getMlHealth: () => axios.get(`${ML}/`),
};