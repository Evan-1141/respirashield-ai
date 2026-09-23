/**
 * RespiraShield AI — Configuration
 * Central configuration for thresholds, labels, units, and validation rules.
 * Easy to update when integrating with real API/IoT data.
 */

// ─── Air Quality Thresholds ─────────────────────────────────────────────────
// Status: 'good' | 'moderate' | 'unhealthy'
// Thresholds define upper bounds for each status level.
export const AQ_THRESHOLDS = {
  pm25: { good: 35, moderate: 75, unit: 'µg/m³', label: 'PM2.5', description: 'Particulate Matter ≤ 2.5µm' },
  pm10: { good: 50, moderate: 150, unit: 'µg/m³', label: 'PM10', description: 'Particulate Matter ≤ 10µm' },
  co:   { good: 4, moderate: 9, unit: 'mg/m³', label: 'CO', description: 'Karbon Monoksida' },
  no2:  { good: 40, moderate: 80, unit: 'µg/m³', label: 'NO₂', description: 'Nitrogen Dioksida' },
  so2:  { good: 20, moderate: 80, unit: 'µg/m³', label: 'SO₂', description: 'Sulfur Dioksida' },
  o3:   { good: 60, moderate: 120, unit: 'µg/m³', label: 'O₃', description: 'Ozon' },
};

// ─── Environment Thresholds ─────────────────────────────────────────────────
export const ENV_THRESHOLDS = {
  temperature: { min: 15, max: 35, unit: '°C', label: 'Suhu Udara' },
  humidity: { min: 30, max: 70, unit: '%', label: 'Kelembapan Udara' },
};

// ─── Air Quality Status Labels ──────────────────────────────────────────────
export const AQ_STATUS = {
  good: { label: 'Baik', color: 'green' },
  moderate: { label: 'Perlu Diperhatikan', color: 'yellow' },
  unhealthy: { label: 'Tidak Baik', color: 'red' },
};

// ─── Risk Level Definitions ─────────────────────────────────────────────────
export const RISK_LEVELS = {
  0: { label: 'Risiko Rendah', color: 'green', description: 'Kondisi saat ini menunjukkan risiko gangguan pernapasan yang rendah.' },
  1: { label: 'Risiko Sedang', color: 'yellow', description: 'Kondisi saat ini menunjukkan risiko gangguan pernapasan yang perlu diperhatikan.' },
  2: { label: 'Risiko Tinggi', color: 'red', description: 'Kondisi saat ini menunjukkan risiko gangguan pernapasan yang tinggi. Pertimbangkan untuk mengurangi aktivitas outdoor.' },
};

// ─── Sensor Definitions ─────────────────────────────────────────────────────
export const SENSORS = [
  { id: 'pm', label: 'PM2.5 / PM10', type: 'Particulate Matter Sensor' },
  { id: 'co', label: 'CO', type: 'Electrochemical Gas Sensor' },
  { id: 'no2', label: 'NO₂', type: 'Electrochemical Gas Sensor' },
  { id: 'so2', label: 'SO₂', type: 'Electrochemical Gas Sensor' },
  { id: 'o3', label: 'O₃', type: 'Electrochemical Gas Sensor' },
  { id: 'dht', label: 'Suhu / Kelembapan', type: 'DHT22 Sensor' },
];

// ─── Form Validation Rules ──────────────────────────────────────────────────
export const VALIDATION_RULES = {
  age: { min: 1, max: 120, required: true, label: 'Usia' },
  asthmaHistory: { required: true, label: 'Riwayat Asma' },
  smokingStatus: { required: true, label: 'Status Merokok' },
  outdoorExposure: { min: 0, max: 24, required: true, label: 'Durasi Paparan Outdoor' },
  pm25: { min: 0, max: 500, required: true, label: 'PM2.5' },
  pm10: { min: 0, max: 600, required: true, label: 'PM10' },
  so2: { min: 0, max: 500, required: true, label: 'SO₂' },
  no2: { min: 0, max: 400, required: true, label: 'NO₂' },
  co: { min: 0, max: 50, required: true, label: 'CO' },
  o3: { min: 0, max: 300, required: true, label: 'O₃' },
  temperature: { min: -20, max: 60, required: true, label: 'Suhu Udara' },
  humidity: { min: 0, max: 100, required: true, label: 'Kelembapan Udara' },
};

// ─── Navigation Items ───────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/prediction', label: 'Prediksi Risiko', icon: 'Brain' },
  { href: '/monitoring', label: 'Monitoring Udara', icon: 'Wind' },
  { href: '/history', label: 'Riwayat', icon: 'History' },
  { href: '/devices', label: 'Perangkat IoT', icon: 'Cpu' },
  { href: '/profile', label: 'Profil', icon: 'User' },
];

// ─── ML Models Reference ───────────────────────────────────────────────────
export const ML_MODELS = [
  'Decision Tree',
  'KNN',
  'Logistic Regression',
  'Naïve Bayes',
];

// ─── Helper: Get AQ Status ──────────────────────────────────────────────────
export function getAQStatus(param, value) {
  const threshold = AQ_THRESHOLDS[param];
  if (!threshold) return AQ_STATUS.good;
  if (value <= threshold.good) return AQ_STATUS.good;
  if (value <= threshold.moderate) return AQ_STATUS.moderate;
  return AQ_STATUS.unhealthy;
}

// ─── Helper: Validate Form Field ────────────────────────────────────────────
export function validateField(fieldName, value) {
  const rule = VALIDATION_RULES[fieldName];
  if (!rule) return null;

  if (rule.required && (value === '' || value === null || value === undefined)) {
    return `${rule.label} wajib diisi.`;
  }

  if (rule.min !== undefined && Number(value) < rule.min) {
    return `${rule.label} tidak boleh kurang dari ${rule.min}.`;
  }

  if (rule.max !== undefined && Number(value) > rule.max) {
    return `${rule.label} tidak boleh lebih dari ${rule.max}.`;
  }

  return null;
}
