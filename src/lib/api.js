/**
 * RespiraShield AI — API Abstraction Layer
 * Currently returns mock data. Replace with actual API calls when backend is ready.
 * Components import from here, not directly from mock-data.
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

  const cutoff = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);
  const filtered = historicalAirQuality.filter(
    (d) => new Date(d.timestamp) >= cutoff
  );

  // Downsample for longer ranges to keep chart performant
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
  const prediction = predictionHistory.find((p) => p.id === id);
  if (!prediction) return null;
  return { ...prediction };
}

/**
 * Mock prediction function.
 * Simulates ML prediction with a weighted scoring approach.
 * Will be replaced with actual API call to ML backend.
 */
export async function predictRisk(formData) {
  await delay(1500); // Simulate model inference time

  const {
    age, asthmaHistory, smokingStatus, outdoorExposure,
    pm25, pm10, so2, no2, co, o3, temperature, humidity,
  } = formData;

  // Simple mock scoring logic (NOT real ML)
  let score = 0;

  // Air quality factors
  if (pm25 > 75) score += 2;
  else if (pm25 > 35) score += 1;

  if (pm10 > 150) score += 2;
  else if (pm10 > 50) score += 1;

  if (co > 9) score += 2;
  else if (co > 4) score += 1;

  if (no2 > 80) score += 1;
  if (so2 > 80) score += 1;
  if (o3 > 120) score += 1;

  // User factors
  if (age > 55) score += 2;
  else if (age > 40) score += 1;

  if (asthmaHistory) score += 2;
  if (smokingStatus === 'active') score += 2;
  else if (smokingStatus === 'former') score += 1;

  if (outdoorExposure > 6) score += 2;
  else if (outdoorExposure > 3) score += 1;

  // Environment
  if (temperature > 35 || temperature < 10) score += 1;
  if (humidity > 80) score += 1;

  // Determine risk level
  let riskLevel;
  let confidence;
  if (score >= 10) {
    riskLevel = 2;
    confidence = 0.85 + Math.random() * 0.1;
  } else if (score >= 5) {
    riskLevel = 1;
    confidence = 0.55 + Math.random() * 0.15;
  } else {
    riskLevel = 0;
    confidence = 0.80 + Math.random() * 0.15;
  }

  return {
    id: `pred-${Date.now()}`,
    riskLevel,
    predictionScore: Math.round(confidence * 100) / 100,
    riskInfo: RISK_LEVELS[riskLevel],
    createdAt: new Date().toISOString(),
    userInput: { age, asthmaHistory, smokingStatus, outdoorExposure },
    airQuality: { pm25, pm10, so2, no2, co, o3, temperature, humidity },
  };
}

// ─── User Profile ───────────────────────────────────────────────────────────

export async function getUserProfile() {
  await delay(300);
  return { ...userProfile };
}

export async function updateUserProfile(data) {
  await delay(500);
  // In production, this would POST to the API
  Object.assign(userProfile, data);
  return { ...userProfile };
}

// ─── System ─────────────────────────────────────────────────────────────────

export async function getSystemStatus() {
  await delay(200);
  return { ...systemStatus };
}
