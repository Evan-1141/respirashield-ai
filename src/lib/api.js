/**
 * RespiraShield AI — API Service Layer
 * Terintegrasi penuh dengan FastAPI backend, SQLite/Supabase database,
 * dan model Machine Learning (Logistic Regression 12-fitur).
 */

import { RISK_LEVELS } from './config';

// Base API configuration (Next.js public env or default localhost:8000)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

async function fetchFromApi(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      let detailMsg = `HTTP ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) {
          detailMsg = typeof errorJson.detail === 'string'
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
        }
      } catch {
        // Fallback to text or status
      }
      throw new Error(detailMsg);
    }

    return await res.json();
  } catch (error) {
    if (error.name === 'TypeError') {
      throw new Error('Backend tidak dapat dihubungi. Pastikan FastAPI sedang berjalan di port 8000.');
    }
    throw error;
  }
}

// ─── Air Quality ────────────────────────────────────────────────────────────

export async function getAirQuality(deviceId = 'RSH-ESP32-001') {
  const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
  return await fetchFromApi(`/sensor/latest${query}`);
}

export async function getAirQualityTrends() {
  return await fetchFromApi('/sensor/trends');
}

export async function getHistoricalAirQuality(range = '24h', deviceId = 'RSH-ESP32-001') {
  const query = `?range=${range}&device_id=${encodeURIComponent(deviceId)}`;
  return await fetchFromApi(`/sensor/history${query}`);
}

// ─── Device ─────────────────────────────────────────────────────────────────

export async function getDeviceStatus(deviceId = 'RSH-ESP32-001') {
  return await fetchFromApi(`/devices/${encodeURIComponent(deviceId)}`);
}

export async function getDeviceSensors(deviceId = 'RSH-ESP32-001') {
  return await fetchFromApi(`/devices/${encodeURIComponent(deviceId)}/sensors`);
}

export async function getDeviceActivity(deviceId = 'RSH-ESP32-001') {
  return await fetchFromApi(`/devices/${encodeURIComponent(deviceId)}/activity`);
}

// ─── Predictions ────────────────────────────────────────────────────────────

export async function getPredictionHistory(limit = 50, riskLevel = null) {
  let endpoint = `/predictions?limit=${limit}`;
  if (riskLevel !== null && riskLevel !== undefined && riskLevel !== 'all') {
    endpoint += `&risk_level=${riskLevel}`;
  }
  return await fetchFromApi(endpoint);
}

export async function getPredictionDetail(id) {
  return await fetchFromApi(`/predictions/${encodeURIComponent(id)}`);
}

/**
 * Prediksi risiko menggunakan model Logistic Regression 12-fitur
 * melalui FastAPI backend dan disimpan ke database secara permanen.
 */
export async function predictRisk(formData) {
  const {
    age,
    asthmaHistory,
    smokingStatus,
    outdoorExposure,
    pm25,
    pm10,
    so2,
    no2,
    co,
    o3,
    temperature,
    humidity,
  } = formData;

  const asthmaValue = Boolean(asthmaHistory) ? 1 : 0;

  let smokingValue = 0;
  if (typeof smokingStatus === 'number') {
    smokingValue = smokingStatus;
  } else {
    const smokingMap = {
      never: 0,
      none: 0,
      non_smoker: 0,
      'non-smoker': 0,
      former: 1,
      pernah: 1,
      active: 2,
      smoker: 2,
      aktif: 2,
    };
    smokingValue = smokingMap[String(smokingStatus).toLowerCase()] ?? 0;
  }

  const payload = {
    PM2_5: Number(pm25),
    PM10: Number(pm10),
    SO2: Number(so2),
    NO2: Number(no2),
    CO: Number(co),
    O3: Number(o3),
    Suhu_Udara: Number(temperature),
    Kelembaban_Udara: Number(humidity),
    Usia: Number(age),
    Riwayat_Asma: asthmaValue,
    Status_Merokok: smokingValue,
    Durasi_Paparan_Outdoor: Number(outdoorExposure),
  };

  const result = await fetchFromApi('/predict', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const riskLevel = Number(result.risk_class);

  return {
    id: result.id,
    riskLevel,
    predictionScore: result.prediction_score ?? null,
    probabilities: result.probabilities ?? null,
    riskInfo: RISK_LEVELS[riskLevel],
    riskLabel: result.risk_label,
    createdAt: result.created_at || new Date().toISOString(),
    disclaimer: result.disclaimer,
    userInput: {
      age,
      asthmaHistory,
      smokingStatus,
      outdoorExposure,
    },
    airQuality: {
      pm25,
      pm10,
      so2,
      no2,
      co,
      o3,
      temperature,
      humidity,
    },
  };
}

// ─── User Profile ───────────────────────────────────────────────────────────

export async function getUserProfile(userId = 'user-001') {
  return await fetchFromApi(`/user/profile?user_id=${encodeURIComponent(userId)}`);
}

export async function updateUserProfile(data, userId = 'user-001') {
  const payload = {
    name: data.name,
    age: data.age !== undefined ? Number(data.age) : undefined,
    asthma_history: data.asthmaHistory !== undefined ? Boolean(data.asthmaHistory) : undefined,
    smoking_status: data.smokingStatus,
    outdoor_exposure: data.outdoorExposure !== undefined ? Number(data.outdoorExposure) : undefined,
  };

  return await fetchFromApi(`/user/profile?user_id=${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ─── System ─────────────────────────────────────────────────────────────────

export async function getSystemStatus() {
  return await fetchFromApi('/system/status');
}

export async function getModelStatus() {
  return await fetchFromApi('/model-status');
}

export async function getHealthStatus() {
  return await fetchFromApi('/health');
}
