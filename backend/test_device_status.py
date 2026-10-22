"""Focused tests for truthful hardware/device status behaviour."""

import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi.testclient import TestClient

TEST_DB = Path(tempfile.gettempdir()) / 'respirashield-device-status-test.db'
if TEST_DB.exists():
    TEST_DB.unlink()
os.environ['DATABASE_URL'] = f'sqlite:///{TEST_DB.as_posix()}'
os.environ['DEVICE_AUTH_TOKEN'] = 'test-device-token'

sys.path.insert(0, str(Path(__file__).parent))
import main as api  # noqa: E402
from main import app, HEARTBEAT_TIMEOUT_SECONDS  # noqa: E402
from database.db import Device, SessionLocal, engine  # noqa: E402


AUTH = {'X-Device-Token': 'test-device-token'}
DEVICE_ID = 'RSH-ESP32-001'


def full_readings():
    return {
        'PM2_5': 18.4, 'PM10': 31.2, 'SO2': 4.1, 'NO2': 12.5,
        'CO': 0.34, 'O3': 22.0, 'Suhu_Udara': 27.2, 'Kelembaban_Udara': 61.0,
    }


class DeviceStatusTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client_context = TestClient(app)
        cls.client = cls.client_context.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client_context.__exit__(None, None, None)
        engine.dispose()
        if TEST_DB.exists():
            TEST_DB.unlink()

    def setUp(self):
        # Each test uses its own device to avoid any accidental status leakage.
        self.device_id = f'RSH-TEST-{self.id().rsplit(".", 1)[-1]}'[:64]

    def device(self):
        return self.client.get(f'/devices/{self.device_id}')

    def register_via_heartbeat(self):
        return self.client.post('/devices/heartbeat', json={'device_id': self.device_id, 'source': 'iot'}, headers=AUTH)

    def test_new_registered_device_is_offline_and_has_no_sensor_data(self):
        response = self.client.get(f'/devices/{DEVICE_ID}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['statusCode'], 'OFFLINE')
        self.assertIsNone(response.json()['lastSeen'])
        sensors = self.client.get(f'/devices/{DEVICE_ID}/sensors').json()
        self.assertTrue(all(sensor['statusCode'] == 'NO_DATA' for sensor in sensors))
        self.assertTrue(all(all(value is None for value in sensor['lastReading'].values()) for sensor in sensors))

    def test_unknown_device_is_not_configured(self):
        response = self.client.get('/devices/RSH-NOT-REGISTERED')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['statusCode'], 'NOT_CONFIGURED')

    def test_simulation_never_makes_physical_device_online(self):
        payload = {'device_id': self.device_id, 'source': 'simulation', 'readings': full_readings()}
        self.assertEqual(self.client.post('/sensor/readings', json=payload, headers=AUTH).status_code, 201)
        device = self.device().json()
        self.assertEqual(device['statusCode'], 'OFFLINE')
        self.assertTrue(device['simulation']['active'])

    def test_valid_physical_reading_makes_device_and_sensors_connected(self):
        payload = {'device_id': self.device_id, 'source': 'iot', 'readings': full_readings()}
        self.assertEqual(self.client.post('/sensor/readings', json=payload, headers=AUTH).status_code, 201)
        self.assertEqual(self.device().json()['statusCode'], 'ONLINE')
        sensors = self.client.get(f'/devices/{self.device_id}/sensors').json()
        self.assertTrue(all(sensor['statusCode'] == 'CONNECTED' for sensor in sensors))

    def test_stale_heartbeat_returns_device_to_offline_and_sensor_to_stale(self):
        self.assertEqual(self.client.post('/sensor/readings', json={
            'device_id': self.device_id, 'source': 'iot', 'readings': full_readings(),
        }, headers=AUTH).status_code, 201)
        db = SessionLocal()
        try:
            device = db.query(Device).filter(Device.device_id == self.device_id).one()
            device.last_heartbeat = datetime.now(timezone.utc) - timedelta(seconds=HEARTBEAT_TIMEOUT_SECONDS + 1)
            db.commit()
        finally:
            db.close()
        self.assertEqual(self.device().json()['statusCode'], 'OFFLINE')
        sensors = self.client.get(f'/devices/{self.device_id}/sensors').json()
        self.assertTrue(all(sensor['statusCode'] == 'STALE' for sensor in sensors))

    def test_one_missing_sensor_does_not_hide_an_online_esp32(self):
        payload = {
            'device_id': self.device_id, 'source': 'iot',
            'readings': {'PM2_5': 10.0, 'PM10': 16.0},
        }
        self.assertEqual(self.client.post('/sensor/readings', json=payload, headers=AUTH).status_code, 201)
        self.assertEqual(self.device().json()['statusCode'], 'ONLINE')
        sensors = {item['id']: item for item in self.client.get(f'/devices/{self.device_id}/sensors').json()}
        self.assertEqual(sensors['pm']['statusCode'], 'CONNECTED')
        self.assertEqual(sensors['co']['statusCode'], 'NO_DATA')

    def test_reported_sensor_error_is_not_presented_as_connected(self):
        payload = {
            'device_id': self.device_id, 'source': 'iot',
            'readings': {'PM2_5': 10.0}, 'sensor_errors': {'co': 'ADC tidak merespons'},
        }
        self.assertEqual(self.client.post('/sensor/readings', json=payload, headers=AUTH).status_code, 201)
        sensors = {item['id']: item for item in self.client.get(f'/devices/{self.device_id}/sensors').json()}
        self.assertEqual(sensors['co']['statusCode'], 'ERROR')
        self.assertEqual(sensors['co']['statusLabel'], 'ADC tidak merespons')

    def test_unknown_source_is_rejected(self):
        response = self.client.post('/sensor/readings', json={
            'device_id': self.device_id, 'source': 'fake', 'readings': full_readings(),
        }, headers=AUTH)
        self.assertEqual(response.status_code, 422)

    def test_database_failure_returns_a_server_error_not_online_data(self):
        def unavailable_database():
            raise RuntimeError('database unavailable')

        app.dependency_overrides[api.get_db] = unavailable_database
        try:
            with TestClient(app, raise_server_exceptions=False) as unavailable_client:
                response = unavailable_client.get(f'/devices/{DEVICE_ID}')
            self.assertEqual(response.status_code, 500)
        finally:
            app.dependency_overrides.clear()


if __name__ == '__main__':
    unittest.main()
