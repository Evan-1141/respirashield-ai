/**
 * RespiraShield AI — API Abstraction Layer
 *
 * Dashboard/device/history masih menggunakan mock data.
 * Prediction menggunakan model Logistic Regression melalui FastAPI.
 */

import {
  currentAirQuality,
  historicalAirQuality,
  airQualityTrends,
  deviceInfo,
  sensorStatus,
  deviceActivity,
  predictionHistory,
  userProfile,
  systemStatus,
} from './mock-data';

import { RISK_LEVELS } from './config';

// ─── API Configuration ─────────────────────────────────────────────────────

const API_URL = 'http://127.0.0.1:8000';

// ─── Simulate network delay ────────────────────────────────────────────────

function delay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Air Quality ────────────────────────────────────────────────────────────

export async function getAirQuality() {
  await delay(300);
  return { ...currentAirQuality };
}

export async function getAirQualityTrends() {
  await delay(200);
  return { ...airQualityTrends };
}

export async function getHistoricalAirQuality(range = '24h') {
  await delay(400);

  const now = new Date('2026-09-23T07:30:00+08:00');

  let hoursBack;

  switch (range) {
    case '7d':
      hoursBack = 168;
      break;

    case '30d':
      hoursBack = 720;
      break;

    case '24h':
    default:
      hoursBack = 24;
      break;
  }

  const cutoff = new Date(
    now.getTime() - hoursBack * 60 * 60 * 1000
  );

  const filtered = historicalAirQuality.filter(
    (d) => new Date(d.timestamp) >= cutoff
  );

  // Downsample untuk range yang lebih panjang
  if (range === '30d') {
    return filtered.filter((_, i) => i % 6 === 0);
  }

  if (range === '7d') {
    return filtered.filter((_, i) => i % 3 === 0);
  }

  return filtered;
}

// ─── Device ─────────────────────────────────────────────────────────────────

export async function getDeviceStatus() {
  await delay(300);
  return { ...deviceInfo };
}

export async function getDeviceSensors() {
  await delay(300);
  return [...sensorStatus];
}

export async function getDeviceActivity() {
  await delay(300);
  return [...deviceActivity];
}

// ─── Predictions ────────────────────────────────────────────────────────────

export async function getPredictionHistory() {
  await delay(400);
  return [...predictionHistory];
}

export async function getPredictionDetail(id) {
  await delay(300);

  const prediction = predictionHistory.find(
    (p) => p.id === id
  );

  if (!prediction) {
    return null;
  }

  return { ...prediction };
}

/**
 * Prediksi risiko menggunakan model Logistic Regression
 * melalui FastAPI backend.
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

  // ─────────────────────────────────────────────────────────
  // Konversi status asma
  // ─────────────────────────────────────────────────────────

  const asthmaValue =
    typeof asthmaHistory === 'boolean'
      ? Number(asthmaHistory)
      : Number(asthmaHistory);

  // ─────────────────────────────────────────────────────────
  // Konversi status merokok
  //
  // Jika UI sudah mengirim angka, gunakan angka tersebut.
  // Jika UI mengirim string, sementara gunakan:
  // 0 = tidak merokok
  // 1 = pernah/former
  // 2 = aktif
  //
  // Encoding ini HARUS sama dengan encoding dataset training.
  // ─────────────────────────────────────────────────────────

  let smokingValue;

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

    smokingValue =
      smokingMap[String(smokingStatus).toLowerCase()] ?? 0;
  }

  // ─────────────────────────────────────────────────────────
  // Request ke FastAPI
  // ─────────────────────────────────────────────────────────

  const response = await fetch(`${API_URL}/predict`, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
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
    }),
  });

  // ─────────────────────────────────────────────────────────
  // Error handling
  // ─────────────────────────────────────────────────────────

  if (!response.ok) {
    let errorMessage = `Prediction gagal (${response.status})`;

    try {
      const errorData = await response.json();

      if (errorData?.detail) {
        errorMessage =
          typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      // Gunakan pesan default jika response bukan JSON
    }

    throw new Error(errorMessage);
  }

  const result = await response.json();

  // ─────────────────────────────────────────────────────────
  // Kembalikan format yang kompatibel dengan UI lama
  // ─────────────────────────────────────────────────────────

  const riskLevel = Number(result.risk_class);

  return {
    id: `pred-${Date.now()}`,

    riskLevel,

    // Backend saat ini belum mengirim probabilitas.
    // Jangan membuat confidence palsu.
    predictionScore: null,

    riskInfo: RISK_LEVELS[riskLevel],

    riskLabel: result.risk_label,

    createdAt: new Date().toISOString(),

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

export async function getUserProfile() {
  await delay(300);
  return { ...userProfile };
}

export async function updateUserProfile(data) {
  await delay(500);

  // Masih menggunakan mock data untuk profile
  Object.assign(userProfile, data);

  return { ...userProfile };
}

// ─── System ─────────────────────────────────────────────────────────────────

export async function getSystemStatus() {
  await delay(200);
  return { ...systemStatus };
}

// ─── Backend Model Status ───────────────────────────────────────────────────

export async function getModelStatus() {
  const response = await fetch(`${API_URL}/model-status`);

  if (!response.ok) {
    throw new Error('Backend tidak dapat diakses');
  }

  return response.json();
}