/**
 * RespiraShield AI — Mock Data
 * All mock data for the application. Structured to mirror future API responses.
 * Replace these with actual API calls when backend is ready.
 */

// ─── Current Air Quality ────────────────────────────────────────────────────
export const currentAirQuality = {
  pm25: 45.2,
  pm10: 72.1,
  co: 0.6,
  no2: 30.4,
  so2: 8.2,
  o3: 35.6,
  temperature: 29.1,
  humidity: 75.4,
  recordedAt: '2026-09-23T07:30:00+08:00',
  deviceId: 'RSH-ESP32-001',
};

// ─── Air Quality Trends (change from previous reading) ──────────────────────
export const airQualityTrends = {
  pm25: +2.3,
  pm10: -1.5,
  co: 0.0,
  no2: +1.2,
  so2: -0.5,
  o3: +3.1,
  temperature: +0.4,
  humidity: -1.2,
};

// ─── Historical Air Quality (30 days, sampled) ──────────────────────────────
function generateHistoricalData() {
  const data = [];
  const now = new Date('2026-09-23T07:00:00+08:00');

  for (let i = 720; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = date.getHours();
    const dayFactor = Math.sin((hour - 6) * Math.PI / 12);
    const randomFactor = () => (Math.random() - 0.5) * 10;

    data.push({
      timestamp: date.toISOString(),
      pm25: Math.max(5, 35 + dayFactor * 25 + randomFactor()),
      pm10: Math.max(10, 55 + dayFactor * 30 + randomFactor() * 1.5),
      co: Math.max(0.1, 0.5 + dayFactor * 0.3 + (Math.random() - 0.5) * 0.2),
      no2: Math.max(5, 25 + dayFactor * 15 + randomFactor()),
      so2: Math.max(2, 8 + dayFactor * 5 + (Math.random() - 0.5) * 3),
      o3: Math.max(10, 40 + dayFactor * 20 + randomFactor()),
      temperature: 27 + dayFactor * 4 + (Math.random() - 0.5) * 2,
      humidity: 70 - dayFactor * 15 + (Math.random() - 0.5) * 5,
    });
  }
  return data;
}

export const historicalAirQuality = generateHistoricalData();

// ─── Device Information ─────────────────────────────────────────────────────
export const deviceInfo = {
  id: 'RSH-ESP32-001',
  deviceName: 'RespiraShield Station #1',
  deviceCode: 'ESP32-WROOM-32E',
  status: 'online',
  lastSeen: '2026-09-23T07:30:00+08:00',
  firmwareVersion: 'v1.2.3',
  location: 'Ruang Utama',
  ipAddress: '192.168.1.105',
  macAddress: 'A4:CF:12:8B:3D:E1',
  uptime: '3 hari 14 jam',
  connection: {
    wifiStatus: 'Connected',
    ssid: 'RespiraShield-Net',
    signalStrength: -45,
    signalQuality: 'Sangat Baik',
    lastCommunication: '2026-09-23T07:30:00+08:00',
  },
};

// ─── Sensor Status ──────────────────────────────────────────────────────────
export const sensorStatus = [
  {
    id: 'pm',
    name: 'PM2.5 / PM10 Sensor',
    type: 'PMS5003',
    status: 'active',
    lastReading: { pm25: 45.2, pm10: 72.1 },
    lastUpdate: '2026-09-23T07:30:00+08:00',
    unit: 'µg/m³',
  },
  {
    id: 'co',
    name: 'CO Sensor',
    type: 'MQ-7',
    status: 'active',
    lastReading: { co: 0.6 },
    lastUpdate: '2026-09-23T07:30:00+08:00',
    unit: 'mg/m³',
  },
  {
    id: 'no2',
    name: 'NO₂ Sensor',
    type: 'MiCS-2714',
    status: 'active',
    lastReading: { no2: 30.4 },
    lastUpdate: '2026-09-23T07:30:00+08:00',
    unit: 'µg/m³',
  },
  {
    id: 'so2',
    name: 'SO₂ Sensor',
    type: 'ME2-SO2',
    status: 'active',
    lastReading: { so2: 8.2 },
    lastUpdate: '2026-09-23T07:30:00+08:00',
    unit: 'µg/m³',
  },
  {
    id: 'o3',
    name: 'O₃ Sensor',
    type: 'MQ-131',
    status: 'inactive',
    lastReading: { o3: 35.6 },
    lastUpdate: '2026-09-23T07:25:00+08:00',
    unit: 'µg/m³',
  },
  {
    id: 'dht',
    name: 'Suhu / Kelembapan Sensor',
    type: 'DHT22',
    status: 'active',
    lastReading: { temperature: 29.1, humidity: 75.4 },
    lastUpdate: '2026-09-23T07:30:00+08:00',
    unit: '°C / %',
  },
];

// ─── Device Activity Log ────────────────────────────────────────────────────
export const deviceActivity = [
  { id: 1, type: 'reading', message: 'Data sensor diterima', timestamp: '2026-09-23T07:30:00+08:00' },
  { id: 2, type: 'reading', message: 'Data sensor diterima', timestamp: '2026-09-23T07:25:00+08:00' },
  { id: 3, type: 'alert', message: 'Sensor O₃ tidak merespons', timestamp: '2026-09-23T07:20:00+08:00' },
  { id: 4, type: 'reading', message: 'Data sensor diterima', timestamp: '2026-09-23T07:15:00+08:00' },
  { id: 5, type: 'connected', message: 'Perangkat terhubung ke jaringan', timestamp: '2026-09-23T06:00:00+08:00' },
  { id: 6, type: 'disconnected', message: 'Perangkat terputus (restart firmware)', timestamp: '2026-09-23T05:58:00+08:00' },
  { id: 7, type: 'reading', message: 'Data sensor diterima', timestamp: '2026-09-23T05:55:00+08:00' },
  { id: 8, type: 'connected', message: 'Perangkat terhubung ke jaringan', timestamp: '2026-09-20T08:12:00+08:00' },
];

// ─── Prediction History ─────────────────────────────────────────────────────
export const predictionHistory = [
  {
    id: 'pred-001',
    createdAt: '2026-09-23T07:15:00+08:00',
    riskLevel: 0,
    predictionScore: 0.87,
    userInput: { age: 25, asthmaHistory: false, smokingStatus: 'never', outdoorExposure: 2 },
    airQuality: { pm25: 25.1, pm10: 40.2, co: 0.3, no2: 18.5, so2: 5.1, o3: 28.3, temperature: 28.5, humidity: 68.2 },
  },
  {
    id: 'pred-002',
    createdAt: '2026-09-22T14:30:00+08:00',
    riskLevel: 1,
    predictionScore: 0.62,
    userInput: { age: 45, asthmaHistory: true, smokingStatus: 'former', outdoorExposure: 5 },
    airQuality: { pm25: 55.8, pm10: 85.4, co: 1.2, no2: 42.1, so2: 15.3, o3: 65.2, temperature: 31.2, humidity: 80.1 },
  },
  {
    id: 'pred-003',
    createdAt: '2026-09-22T09:00:00+08:00',
    riskLevel: 2,
    predictionScore: 0.93,
    userInput: { age: 60, asthmaHistory: true, smokingStatus: 'active', outdoorExposure: 8 },
    airQuality: { pm25: 120.5, pm10: 180.2, co: 3.8, no2: 75.6, so2: 45.2, o3: 95.1, temperature: 33.4, humidity: 85.7 },
  },
  {
    id: 'pred-004',
    createdAt: '2026-09-21T16:45:00+08:00',
    riskLevel: 0,
    predictionScore: 0.91,
    userInput: { age: 30, asthmaHistory: false, smokingStatus: 'never', outdoorExposure: 1 },
    airQuality: { pm25: 18.3, pm10: 32.5, co: 0.2, no2: 15.2, so2: 4.8, o3: 22.1, temperature: 27.8, humidity: 65.3 },
  },
  {
    id: 'pred-005',
    createdAt: '2026-09-21T10:20:00+08:00',
    riskLevel: 1,
    predictionScore: 0.58,
    userInput: { age: 35, asthmaHistory: false, smokingStatus: 'active', outdoorExposure: 6 },
    airQuality: { pm25: 48.7, pm10: 78.9, co: 0.9, no2: 38.4, so2: 12.1, o3: 55.8, temperature: 30.5, humidity: 72.6 },
  },
  {
    id: 'pred-006',
    createdAt: '2026-09-20T15:10:00+08:00',
    riskLevel: 0,
    predictionScore: 0.85,
    userInput: { age: 28, asthmaHistory: false, smokingStatus: 'never', outdoorExposure: 3 },
    airQuality: { pm25: 22.4, pm10: 38.1, co: 0.4, no2: 20.3, so2: 6.5, o3: 30.2, temperature: 28.9, humidity: 67.8 },
  },
  {
    id: 'pred-007',
    createdAt: '2026-09-20T08:30:00+08:00',
    riskLevel: 2,
    predictionScore: 0.89,
    userInput: { age: 55, asthmaHistory: true, smokingStatus: 'former', outdoorExposure: 7 },
    airQuality: { pm25: 98.2, pm10: 155.6, co: 2.5, no2: 68.3, so2: 38.7, o3: 88.4, temperature: 32.1, humidity: 82.3 },
  },
  {
    id: 'pred-008',
    createdAt: '2026-09-19T13:45:00+08:00',
    riskLevel: 1,
    predictionScore: 0.55,
    userInput: { age: 40, asthmaHistory: true, smokingStatus: 'never', outdoorExposure: 4 },
    airQuality: { pm25: 42.6, pm10: 68.3, co: 0.7, no2: 35.2, so2: 10.8, o3: 48.5, temperature: 29.7, humidity: 71.4 },
  },
  {
    id: 'pred-009',
    createdAt: '2026-09-18T17:00:00+08:00',
    riskLevel: 0,
    predictionScore: 0.82,
    userInput: { age: 22, asthmaHistory: false, smokingStatus: 'never', outdoorExposure: 2 },
    airQuality: { pm25: 20.1, pm10: 35.4, co: 0.3, no2: 16.8, so2: 5.3, o3: 25.7, temperature: 27.5, humidity: 64.9 },
  },
  {
    id: 'pred-010',
    createdAt: '2026-09-18T09:15:00+08:00',
    riskLevel: 1,
    predictionScore: 0.65,
    userInput: { age: 50, asthmaHistory: false, smokingStatus: 'active', outdoorExposure: 5 },
    airQuality: { pm25: 58.3, pm10: 92.1, co: 1.4, no2: 45.6, so2: 18.2, o3: 62.3, temperature: 30.8, humidity: 76.5 },
  },
  {
    id: 'pred-011',
    createdAt: '2026-09-17T14:30:00+08:00',
    riskLevel: 2,
    predictionScore: 0.95,
    userInput: { age: 65, asthmaHistory: true, smokingStatus: 'active', outdoorExposure: 10 },
    airQuality: { pm25: 135.8, pm10: 195.3, co: 4.2, no2: 82.1, so2: 52.6, o3: 105.4, temperature: 34.2, humidity: 88.1 },
  },
  {
    id: 'pred-012',
    createdAt: '2026-09-17T08:00:00+08:00',
    riskLevel: 0,
    predictionScore: 0.79,
    userInput: { age: 32, asthmaHistory: false, smokingStatus: 'former', outdoorExposure: 3 },
    airQuality: { pm25: 28.5, pm10: 45.8, co: 0.5, no2: 22.1, so2: 7.3, o3: 32.6, temperature: 28.2, humidity: 66.7 },
  },
  {
    id: 'pred-013',
    createdAt: '2026-09-16T11:20:00+08:00',
    riskLevel: 1,
    predictionScore: 0.60,
    userInput: { age: 38, asthmaHistory: true, smokingStatus: 'never', outdoorExposure: 4 },
    airQuality: { pm25: 50.2, pm10: 80.5, co: 1.0, no2: 40.3, so2: 14.1, o3: 58.7, temperature: 30.1, humidity: 73.8 },
  },
  {
    id: 'pred-014',
    createdAt: '2026-09-15T16:00:00+08:00',
    riskLevel: 0,
    predictionScore: 0.88,
    userInput: { age: 27, asthmaHistory: false, smokingStatus: 'never', outdoorExposure: 1 },
    airQuality: { pm25: 15.8, pm10: 28.3, co: 0.2, no2: 12.5, so2: 3.9, o3: 19.8, temperature: 27.1, humidity: 62.5 },
  },
  {
    id: 'pred-015',
    createdAt: '2026-09-15T09:45:00+08:00',
    riskLevel: 2,
    predictionScore: 0.91,
    userInput: { age: 58, asthmaHistory: true, smokingStatus: 'active', outdoorExposure: 9 },
    airQuality: { pm25: 110.4, pm10: 170.8, co: 3.5, no2: 72.4, so2: 42.1, o3: 92.6, temperature: 33.8, humidity: 84.2 },
  },
];

// ─── User Profile ───────────────────────────────────────────────────────────
export const userProfile = {
  id: 'user-001',
  name: 'Evan Danendra',
  age: 20,
  asthmaHistory: false,
  smokingStatus: 'never',
  outdoorExposure: 3,
  createdAt: '2026-08-01T00:00:00+08:00',
};

// ─── System Status ──────────────────────────────────────────────────────────
export const systemStatus = {
  status: 'online',
  lastUpdated: '2026-09-23T07:30:00+08:00',
  activeSensors: 5,
  totalSensors: 6,
  deviceOnline: true,
};

// ─── Smoking Status Labels ──────────────────────────────────────────────────
export const SMOKING_LABELS = {
  never: 'Tidak Pernah',
  former: 'Mantan Perokok',
  active: 'Perokok Aktif',
};
