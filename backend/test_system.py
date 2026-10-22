#!/usr/bin/env python3
"""
RespiraShield AI - Automated System Integration Test Suite
Validates API endpoints, IoT Ingestion, Validation, DB Persistence, and ML Predictions.
"""

import sys
import unittest
from datetime import datetime, timezone
import requests

BASE_URL = 'http://127.0.0.1:8000'
AUTH_TOKEN = 'respirashield-secret-token-2026'
DEVICE_ID = 'RSH-ESP32-001'

class RespiraShieldSystemTests(unittest.TestCase):

    def test_01_health_check(self):
        """Test GET /health returns 200, DB connected, and model loaded."""
        res = requests.get(f"{BASE_URL}/health", timeout=5)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn(data.get('status'), ['healthy', 'degraded'])
        self.assertEqual(data.get('database'), 'connected')
        self.assertTrue(data.get('model_loaded'))

    def test_02_model_status(self):
        """Test GET /model-status verifies 12 features and Logistic Regression."""
        res = requests.get(f"{BASE_URL}/model-status", timeout=5)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get('model'), 'Logistic Regression')
        self.assertEqual(data.get('features_count'), 12)
        expected_features = [
            'PM2.5', 'PM10', 'SO2', 'NO2', 'CO', 'O3',
            'Suhu_Udara', 'Kelembaban_Udara',
            'Usia', 'Riwayat_Asma', 'Status_Merokok', 'Durasi_Paparan_Outdoor'
        ]
        self.assertEqual(data.get('features'), expected_features)

    def test_03_sensor_ingestion_unauthorized(self):
        """Test POST /sensor/readings rejects request without auth token (401)."""
        payload = {
            'device_id': DEVICE_ID,
            'source': 'iot',
            'readings': {
                'PM2_5': 25.0, 'PM10': 40.0, 'SO2': 5.0, 'NO2': 15.0,
                'CO': 0.5, 'O3': 25.0, 'Suhu_Udara': 28.0, 'Kelembaban_Udara': 65.0
            }
        }
        res = requests.post(f"{BASE_URL}/sensor/readings", json=payload, timeout=5)
        self.assertEqual(res.status_code, 401)

    def test_04_sensor_ingestion_invalid_token(self):
        """Test POST /sensor/readings rejects request with invalid token (401)."""
        payload = {
            'device_id': DEVICE_ID,
            'source': 'iot',
            'readings': {
                'PM2_5': 25.0, 'PM10': 40.0, 'SO2': 5.0, 'NO2': 15.0,
                'CO': 0.5, 'O3': 25.0, 'Suhu_Udara': 28.0, 'Kelembaban_Udara': 65.0
            }
        }
        headers = {'X-Device-Token': 'wrong-token-xyz'}
        res = requests.post(f"{BASE_URL}/sensor/readings", json=payload, headers=headers, timeout=5)
        self.assertEqual(res.status_code, 401)

    def test_05_sensor_ingestion_validation_reject_invalid(self):
        """Test POST /sensor/readings rejects out-of-range sensor values (422)."""
        payload = {
            'device_id': DEVICE_ID,
            'source': 'iot',
            'readings': {
                'PM2_5': -50.0,  # Invalid negative
                'PM10': 40.0, 'SO2': 5.0, 'NO2': 15.0,
                'CO': 0.5, 'O3': 25.0, 'Suhu_Udara': 28.0, 'Kelembaban_Udara': 65.0
            }
        }
        headers = {'X-Device-Token': AUTH_TOKEN}
        res = requests.post(f"{BASE_URL}/sensor/readings", json=payload, headers=headers, timeout=5)
        self.assertEqual(res.status_code, 422)

    def test_06_sensor_ingestion_valid_persistence(self):
        """Test POST /sensor/readings successfully persists valid IoT telemetry."""
        payload = {
            'device_id': DEVICE_ID,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'source': 'simulation',
            'readings': {
                'PM2_5': 33.7, 'PM10': 55.2, 'SO2': 8.1, 'NO2': 27.4,
                'CO': 0.62, 'O3': 38.5, 'Suhu_Udara': 29.2, 'Kelembaban_Udara': 71.0
            }
        }
        headers = {'X-Device-Token': AUTH_TOKEN}
        res = requests.post(f"{BASE_URL}/sensor/readings", json=payload, headers=headers, timeout=5)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data.get('status'), 'success')
        self.assertIsNotNone(data.get('reading_id'))
        self.assertEqual(data.get('device_id'), DEVICE_ID)

    def test_07_sensor_latest_retrieval(self):
        """Test GET /sensor/latest returns the most recent reading."""
        res = requests.get(f"{BASE_URL}/sensor/latest?device_id={DEVICE_ID}", timeout=5)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get('deviceId'), DEVICE_ID)
        self.assertEqual(data.get('pm25'), 33.7)
        self.assertEqual(data.get('temperature'), 29.2)
        self.assertIn('recordedAt', data)
        self.assertIn('isStale', data)

    def test_08_sensor_history(self):
        """Test GET /sensor/history returns time-series list."""
        res = requests.get(f"{BASE_URL}/sensor/history?range=24h", timeout=5)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        self.assertIn('pm25', data[0])
        self.assertIn('timestamp', data[0])

    def test_09_sensor_trends(self):
        """Test GET /sensor/trends returns numeric deltas."""
        res = requests.get(f"{BASE_URL}/sensor/trends", timeout=5)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn('pm25', data)
        self.assertIn('temperature', data)

    def test_10_devices_list_and_status(self):
        """Test GET /devices confirms device is reported online after reading."""
        res = requests.get(f"{BASE_URL}/devices", timeout=5)
        self.assertEqual(res.status_code, 200)
        devices = res.json()
        self.assertIsInstance(devices, list)
        found = next((d for d in devices if d['id'] == DEVICE_ID), None)
        self.assertIsNotNone(found)
        self.assertEqual(found.get('status'), 'online')

    def test_11_ml_predict_success(self):
        """Test POST /predict with 12 features executes model and stores prediction."""
        payload = {
            'PM2_5': 24.5,
            'PM10': 42.0,
            'SO2': 7.0,
            'NO2': 18.0,
            'CO': 0.4,
            'O3': 28.0,
            'Suhu_Udara': 28.5,
            'Kelembaban_Udara': 66.0,
            'Usia': 21,
            'Riwayat_Asma': 0,
            'Status_Merokok': 0,
            'Durasi_Paparan_Outdoor': 2.5
        }
        res = requests.post(f"{BASE_URL}/predict", json=payload, timeout=5)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn(data.get('risk_class'), [0, 1, 2])
        self.assertIn(data.get('risk_label'), ['Rendah', 'Sedang', 'Tinggi'])
        self.assertIn('probabilities', data)
        probs = data['probabilities']
        total_prob = probs['low'] + probs['medium'] + probs['high']
        self.assertAlmostEqual(total_prob, 1.0, places=2)
        self.assertIn('disclaimer', data)
        self.assertIsNotNone(data.get('id'))

    def test_12_ml_predict_reject_missing_feature(self):
        """Test POST /predict rejects request missing personal features (422)."""
        payload = {
            'PM2_5': 24.5,
            'PM10': 42.0,
            'SO2': 7.0,
            'NO2': 18.0,
            'CO': 0.4,
            'O3': 28.0,
            'Suhu_Udara': 28.5,
            'Kelembaban_Udara': 66.0
            # Usia, Riwayat_Asma, Status_Merokok, Durasi_Paparan_Outdoor are MISSING
        }
        res = requests.post(f"{BASE_URL}/predict", json=payload, timeout=5)
        self.assertEqual(res.status_code, 422)

    def test_13_predictions_history(self):
        """Test GET /predictions retrieves stored prediction records from DB."""
        res = requests.get(f"{BASE_URL}/predictions?limit=10", timeout=5)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        first = data[0]
        self.assertIn('id', first)
        self.assertIn('riskLevel', first)
        self.assertIn('userInput', first)
        self.assertIn('airQuality', first)

    def test_14_user_profile_crud(self):
        """Test GET /user/profile and PUT /user/profile persistence."""
        res = requests.get(f"{BASE_URL}/user/profile?user_id=user-001", timeout=5)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get('id'), 'user-001')

        # Update profile
        update_payload = {'name': 'Evan Danendra Test', 'outdoor_exposure': 4.5}
        res_put = requests.put(f"{BASE_URL}/user/profile?user_id=user-001", json=update_payload, timeout=5)
        self.assertEqual(res_put.status_code, 200)
        updated = res_put.json()
        self.assertEqual(updated.get('name'), 'Evan Danendra Test')
        self.assertEqual(updated.get('outdoorExposure'), 4.5)

    def test_15_system_summary(self):
        """Test GET /system/status returns complete system telemetry overview."""
        res = requests.get(f"{BASE_URL}/system/status", timeout=5)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get('status'), 'online')
        self.assertTrue(data.get('deviceOnline'))
        self.assertTrue(data.get('databaseConnected'))
        self.assertTrue(data.get('modelLoaded'))


if __name__ == '__main__':
    unittest.main()
