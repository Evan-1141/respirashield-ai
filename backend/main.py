import os
import sys
import json
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Literal

from fastapi import FastAPI, Depends, HTTPException, Header, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator
import joblib
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import desc

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from database.db import (
    init_db, get_db, Device, SensorReading, PredictionRecord, UserProfile, engine
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger('respirashield.api')

app = FastAPI(
    title='RespiraShield AI API',
    description='API Sistem Pemantauan Kualitas Udara, Ingesti IoT Sensor, dan Klasifikasi Risiko Gangguan Pernapasan Berbasis Machine Learning',
    version='2.1.0'
)

# Heartbeat timeout: Perangkat fisik dianggap ONLINE hanya jika telemetri 'iot' diterima dalam 60 detik terakhir
HEARTBEAT_TIMEOUT_SECONDS = int(os.getenv('HEARTBEAT_TIMEOUT_SECONDS', '60'))

@app.on_event('startup')
def startup_event():
    try:
        init_db()
        logger.info('Database initialized successfully with clean offline defaults.')
    except Exception as e:
        logger.error(f'Database startup initialization failed: {e}')

allowed_origins_env = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000')
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(',') if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

DEVICE_AUTH_TOKEN = os.getenv('DEVICE_AUTH_TOKEN', 'respirashield-secret-token-2026')

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model', 'respirashield_model.pkl')
try:
    ml_pipeline = joblib.load(MODEL_PATH)
    logger.info('Logistic Regression model pipeline loaded successfully.')
except Exception as e:
    logger.error(f'Failed to load ML model from {MODEL_PATH}: {e}')
    ml_pipeline = None

RISK_LABELS = {0: 'Rendah', 1: 'Sedang', 2: 'Tinggi'}
DISCLAIMER_TEXT = (
    'RespiraShield AI adalah alat klasifikasi/skrining risiko awal berbasis kualitas udara dan '
    'karakteristik individu, BUKAN merupakan alat diagnosis medis pengganti tenaga kesehatan profesional.'
)

# -----------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# -----------------------------------------------------------------------------
class SensorReadingsPayload(BaseModel):
    # Sensors may legitimately be absent while the ESP32 is still reachable.
    PM2_5: Optional[float] = Field(None, ge=0.0, le=1000.0, description='PM2.5 (ug/m3)')
    PM10: Optional[float] = Field(None, ge=0.0, le=1000.0, description='PM10 (ug/m3)')
    SO2: Optional[float] = Field(None, ge=0.0, le=500.0, description='SO2 (ug/m3)')
    NO2: Optional[float] = Field(None, ge=0.0, le=500.0, description='NO2 (ug/m3)')
    CO: Optional[float] = Field(None, ge=0.0, le=100.0, description='CO (mg/m3)')
    O3: Optional[float] = Field(None, ge=0.0, le=500.0, description='O3 (ug/m3)')
    Suhu_Udara: Optional[float] = Field(None, ge=-20.0, le=70.0, description='Suhu Udara (C)')
    Kelembaban_Udara: Optional[float] = Field(None, ge=0.0, le=100.0, description='Kelembaban Udara (%)')

    @model_validator(mode='after')
    def requires_a_measurement(self):
        if all(value is None for value in self.model_dump().values()):
            raise ValueError('Minimal satu pembacaan sensor harus dikirim; gunakan endpoint heartbeat bila hanya ingin melapor koneksi.')
        return self

class IngestSensorRequest(BaseModel):
    device_id: str = Field(..., min_length=3, max_length=64)
    timestamp: Optional[datetime] = None
    source: Literal['iot', 'simulation'] = Field('iot', description='iot or simulation')
    readings: SensorReadingsPayload
    sensor_errors: Dict[str, str] = Field(default_factory=dict, description='Kesalahan aktual per sensor, mis. {"co":"ADC failure"}')
    firmware_version: Optional[str] = Field(None, max_length=32)
    wifi_ssid: Optional[str] = Field(None, max_length=64)
    signal_strength: Optional[int] = Field(None, ge=-120, le=0)
    uptime: Optional[str] = Field(None, max_length=64)
    device_error: Optional[str] = Field(None, max_length=512)


class HeartbeatRequest(BaseModel):
    device_id: str = Field(..., min_length=3, max_length=64)
    source: Literal['iot', 'simulation'] = 'iot'
    firmware_version: Optional[str] = Field(None, max_length=32)
    wifi_ssid: Optional[str] = Field(None, max_length=64)
    signal_strength: Optional[int] = Field(None, ge=-120, le=0)
    uptime: Optional[str] = Field(None, max_length=64)
    device_error: Optional[str] = Field(None, max_length=512)

class PredictionRequest(BaseModel):
    PM2_5: float = Field(..., ge=0.0, le=1000.0)
    PM10: float = Field(..., ge=0.0, le=1000.0)
    SO2: float = Field(..., ge=0.0, le=500.0)
    NO2: float = Field(..., ge=0.0, le=500.0)
    CO: float = Field(..., ge=0.0, le=100.0)
    O3: float = Field(..., ge=0.0, le=500.0)
    Suhu_Udara: float = Field(..., ge=-20.0, le=70.0)
    Kelembaban_Udara: float = Field(..., ge=0.0, le=100.0)
    Usia: int = Field(..., ge=1, le=120)
    Riwayat_Asma: int = Field(..., ge=0, le=1)
    Status_Merokok: int = Field(..., ge=0, le=2)
    Durasi_Paparan_Outdoor: float = Field(..., ge=0.0, le=24.0)
    sensor_reading_id: Optional[int] = None
    user_profile_id: Optional[str] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=128)
    age: Optional[int] = Field(None, ge=1, le=120)
    asthma_history: Optional[bool] = None
    smoking_status: Optional[str] = None
    outdoor_exposure: Optional[float] = Field(None, ge=0.0, le=24.0)

# -----------------------------------------------------------------------------
# AUTHENTICATION
# -----------------------------------------------------------------------------
def verify_device_token(x_device_token: Optional[str] = Header(None, alias='X-Device-Token'),
                        x_api_key: Optional[str] = Header(None, alias='X-API-Key')):
    token = x_device_token or x_api_key
    if DEVICE_AUTH_TOKEN and DEVICE_AUTH_TOKEN != 'none':
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Header autentikasi perangkat (X-Device-Token) diperlukan.'
            )
        if token != DEVICE_AUTH_TOKEN:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Token autentikasi perangkat tidak valid.'
            )
    return token

# -----------------------------------------------------------------------------
# HELPER FUNCTIONS
# -----------------------------------------------------------------------------
def is_device_physically_online(last_seen: Optional[datetime], now_utc: datetime) -> bool:
    if not last_seen:
        return False
    tz_aware = last_seen.replace(tzinfo=timezone.utc) if last_seen.tzinfo is None else last_seen
    diff = (now_utc - tz_aware).total_seconds()
    return diff <= HEARTBEAT_TIMEOUT_SECONDS


def as_utc(value: Optional[datetime]) -> Optional[datetime]:
    if not value:
        return None
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def ensure_device(db: Session, device_id: str) -> Device:
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        device = Device(
            device_id=device_id,
            name=f'RespiraShield Device ({device_id})',
            device_code='ESP32-WROOM-32E',
            status='offline',
        )
        db.add(device)
        db.flush()
    return device


def record_physical_heartbeat(device: Device, payload: Any, now_utc: datetime):
    """Only a validated packet labelled ``iot`` can update physical state."""
    device.last_seen = now_utc
    device.last_heartbeat = now_utc
    device.updated_at = now_utc
    for attribute in ('firmware_version', 'wifi_ssid', 'signal_strength', 'uptime'):
        value = getattr(payload, attribute, None)
        if value is not None:
            setattr(device, attribute, value)
    device.reported_error = getattr(payload, 'device_error', None) or None
    device.reported_error_at = now_utc if device.reported_error else None
    device.status = 'error' if device.reported_error else 'online'

def is_simulation_active(last_sim: Optional[datetime], now_utc: datetime) -> bool:
    if not last_sim:
        return False
    tz_aware = last_sim.replace(tzinfo=timezone.utc) if last_sim.tzinfo is None else last_sim
    diff = (now_utc - tz_aware).total_seconds()
    return diff <= HEARTBEAT_TIMEOUT_SECONDS

# -----------------------------------------------------------------------------
# SYSTEM & HEALTH ENDPOINTS
# -----------------------------------------------------------------------------
@app.get('/', tags=['System'])
def root():
    return {'message': 'RespiraShield AI API aktif', 'version': '2.1.0', 'disclaimer': DISCLAIMER_TEXT}

@app.get('/health', tags=['System'])
def health_check(db: Session = Depends(get_db)):
    db_status = 'connected'
    dialect = 'unknown'
    try:
        db.query(Device).first()
        dialect = engine.dialect.name
    except Exception as e:
        logger.error(f'Database health check error: {e}')
        db_status = f'error: {str(e)}'

    return {
        'status': 'healthy' if db_status == 'connected' else 'degraded',
        'database': db_status,
        'database_dialect': dialect,
        'model_loaded': ml_pipeline is not None,
        'model_type': 'Logistic Regression Pipeline (StandardScaler + LogisticRegression)',
        'auth_enabled': bool(DEVICE_AUTH_TOKEN and DEVICE_AUTH_TOKEN != 'none'),
        'timestamp': datetime.now(timezone.utc).isoformat()
    }

@app.get('/model-status', tags=['Machine Learning'])
def get_model_status():
    if ml_pipeline is None:
        raise HTTPException(status_code=500, detail='Model Machine Learning belum berhasil dimuat.')
    return {
        'model': 'Logistic Regression',
        'status': 'loaded',
        'version': '1.0.0',
        'features_count': 12,
        'features': ['PM2.5', 'PM10', 'SO2', 'NO2', 'CO', 'O3', 'Suhu_Udara', 'Kelembaban_Udara', 'Usia', 'Riwayat_Asma', 'Status_Merokok', 'Durasi_Paparan_Outdoor'],
        'classes': {0: 'Rendah', 1: 'Sedang', 2: 'Tinggi'},
        'disclaimer': DISCLAIMER_TEXT
    }

# -----------------------------------------------------------------------------
# IOT SENSOR INGESTION & DATA
# -----------------------------------------------------------------------------
@app.post('/sensor/readings', status_code=status.HTTP_201_CREATED, tags=['IoT Sensor'])
def ingest_sensor_readings(payload: IngestSensorRequest, db: Session = Depends(get_db), _token: Optional[str] = Depends(verify_device_token)):
    try:
        now_utc = datetime.now(timezone.utc)
        reading_time = payload.timestamp if payload.timestamp else now_utc

        device = ensure_device(db, payload.device_id)

        # Pemisahan Ketat: Hanya paket fisik ('iot') yang mengubah status hardware fisik menjadi ONLINE
        if payload.source == 'iot':
            record_physical_heartbeat(device, payload, now_utc)
        else:
            device.last_simulation_seen = now_utc
            device.updated_at = now_utc
            # JANGAN ubah device.status atau device.last_seen hardware fisik!

        r = payload.readings
        reading = SensorReading(
            device_id=payload.device_id,
            timestamp=reading_time,
            pm2_5=r.PM2_5,
            pm10=r.PM10,
            so2=r.SO2,
            no2=r.NO2,
            co=r.CO,
            o3=r.O3,
            temperature=r.Suhu_Udara,
            humidity=r.Kelembaban_Udara,
            source=payload.source,
            sensor_errors=json.dumps(payload.sensor_errors) if payload.sensor_errors else None,
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)

        return {
            'status': 'success',
            'message': 'Pembacaan sensor berhasil disimpan.',
            'reading_id': reading.id,
            'device_id': payload.device_id,
            'timestamp': reading.timestamp.isoformat(),
            'source': payload.source
        }
    except Exception as e:
        db.rollback()
        logger.error(f'Failed to ingest sensor reading: {e}')
        raise HTTPException(status_code=500, detail=f'Gagal menyimpan pembacaan sensor: {str(e)}')


@app.post('/devices/heartbeat', tags=['Devices'])
def ingest_heartbeat(payload: HeartbeatRequest, db: Session = Depends(get_db), _token: Optional[str] = Depends(verify_device_token)):
    """Receive a real device heartbeat even when no sensor module has data yet."""
    try:
        now_utc = datetime.now(timezone.utc)
        device = ensure_device(db, payload.device_id)
        if payload.source == 'iot':
            record_physical_heartbeat(device, payload, now_utc)
        else:
            device.last_simulation_seen = now_utc
            device.updated_at = now_utc
        db.commit()
        return {
            'status': 'success',
            'device_id': device.device_id,
            'source': payload.source,
            'received_at': now_utc.isoformat(),
        }
    except Exception as e:
        db.rollback()
        logger.error(f'Failed to ingest device heartbeat: {e}')
        raise HTTPException(status_code=500, detail='Gagal menyimpan heartbeat perangkat.')

@app.get('/sensor/latest', tags=['IoT Sensor'])
def get_latest_sensor_reading(
    device_id: Optional[str] = None,
    source: Optional[str] = Query('iot', description='iot or simulation or all'),
    db: Session = Depends(get_db)
):
    """
    Mengambil pembacaan sensor terkini.
    Secara default hanya mengambil telemetri fisik ('iot').
    Jika hardware fisik belum terhubung atau data kedaluwarsa (>60s),
    mengembalikan status 'NO_DATA' dengan nilai null/— agar frontend tidak menampilkan data palsu.
    """
    now_utc = datetime.now(timezone.utc)
    query = db.query(SensorReading)
    if device_id:
        query = query.filter(SensorReading.device_id == device_id)

    if source in ['iot', 'simulation']:
        query = query.filter(SensorReading.source == source)

    latest = query.order_by(desc(SensorReading.timestamp)).first()
    device = db.query(Device).filter(Device.device_id == (device_id or (latest.device_id if latest else None))).first()
    physical_online = bool(device and is_device_physically_online(device.last_heartbeat, now_utc))

    # Jika tidak ada data sama sekali atau untuk hardware fisik yang belum aktif
    if not latest:
        return {
            'available': False,
            'status': 'NO_DATA',
            'id': None,
            'pm25': None,
            'pm10': None,
            'co': None,
            'no2': None,
            'so2': None,
            'o3': None,
            'temperature': None,
            'humidity': None,
            'recordedAt': None,
            'deviceId': device_id or 'RSH-ESP32-001',
            'source': source,
            'isStale': True,
            'staleMinutes': None,
            'message': 'Belum ada data sensor fisik yang terhubung.'
        }

    rec_time = as_utc(latest.timestamp)
    diff_seconds = (now_utc - rec_time).total_seconds()
    diff_minutes = round(diff_seconds / 60.0, 1)

    # Jika membaca sensor fisik tapi data sudah lebih dari HEARTBEAT_TIMEOUT_SECONDS
    is_stale = diff_seconds > HEARTBEAT_TIMEOUT_SECONDS or (source == 'iot' and not physical_online)

    return {
        'available': not is_stale,
        'status': 'CONNECTED' if not is_stale else 'STALE',
        'id': latest.id,
        'pm25': latest.pm2_5 if not is_stale else None,
        'pm10': latest.pm10 if not is_stale else None,
        'co': latest.co if not is_stale else None,
        'no2': latest.no2 if not is_stale else None,
        'so2': latest.so2 if not is_stale else None,
        'o3': latest.o3 if not is_stale else None,
        'temperature': latest.temperature if not is_stale else None,
        'humidity': latest.humidity if not is_stale else None,
        'recordedAt': rec_time.isoformat() if not is_stale else None,
        'deviceId': latest.device_id,
        'source': latest.source,
        'isStale': is_stale,
        'staleMinutes': diff_minutes,
        'message': 'Data telemetri aktif' if not is_stale else 'Data sensor fisik offline / kedaluwarsa'
    }

@app.get('/sensor/history', tags=['IoT Sensor'])
def get_sensor_history(
    range: str = Query('24h', pattern='^(24h|7d|30d)$'),
    device_id: Optional[str] = None,
    source: Optional[str] = Query(None, description='iot or simulation'),
    limit: Optional[int] = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db)
):
    now_utc = datetime.now(timezone.utc)
    hours_map = {'24h': 24, '7d': 168, '30d': 720}
    hours = hours_map.get(range, 24)
    cutoff = now_utc - timedelta(hours=hours)

    query = db.query(SensorReading).filter(SensorReading.timestamp >= cutoff)
    if device_id:
        query = query.filter(SensorReading.device_id == device_id)
    if source:
        query = query.filter(SensorReading.source == source)

    readings = query.order_by(SensorReading.timestamp.asc()).limit(limit).all()
    result = []
    for r in readings:
        ts = r.timestamp.replace(tzinfo=timezone.utc) if r.timestamp.tzinfo is None else r.timestamp
        result.append({
            'timestamp': ts.isoformat(),
            'pm25': r.pm2_5,
            'pm10': r.pm10,
            'co': r.co,
            'no2': r.no2,
            'so2': r.so2,
            'o3': r.o3,
            'temperature': r.temperature,
            'humidity': r.humidity,
            'source': r.source
        })
    return result

@app.get('/sensor/trends', tags=['IoT Sensor'])
def get_sensor_trends(device_id: Optional[str] = None, db: Session = Depends(get_db)):
    now_utc = datetime.now(timezone.utc)
    query = db.query(SensorReading).filter(SensorReading.source == 'iot')
    if device_id:
        query = query.filter(SensorReading.device_id == device_id)

    last_two = query.order_by(desc(SensorReading.timestamp)).limit(2).all()
    if len(last_two) < 2:
        return {'pm25': None, 'pm10': None, 'co': None, 'no2': None, 'so2': None, 'o3': None, 'temperature': None, 'humidity': None}

    r_new, r_old = last_two[0], last_two[1]
    rec_time = r_new.timestamp.replace(tzinfo=timezone.utc) if r_new.timestamp.tzinfo is None else r_new.timestamp
    if (now_utc - rec_time).total_seconds() > HEARTBEAT_TIMEOUT_SECONDS:
        return {'pm25': None, 'pm10': None, 'co': None, 'no2': None, 'so2': None, 'o3': None, 'temperature': None, 'humidity': None}

    return {
        'pm25': round(r_new.pm2_5 - r_old.pm2_5, 1),
        'pm10': round(r_new.pm10 - r_old.pm10, 1),
        'co': round(r_new.co - r_old.co, 2),
        'no2': round(r_new.no2 - r_old.no2, 1),
        'so2': round(r_new.so2 - r_old.so2, 1),
        'o3': round(r_new.o3 - r_old.o3, 1),
        'temperature': round(r_new.temperature - r_old.temperature, 1),
        'humidity': round(r_new.humidity - r_old.humidity, 1)
    }

@app.get('/sensor/status', tags=['IoT Sensor'])
def get_sensor_status(db: Session = Depends(get_db)):
    """
    Mengembalikan status 6 sensor fisik terpasang.
    Sebelum hardware terhubung, seluruh sensor berstatus 'disconnected' (Belum terhubung)
    dan nilai pembacaan bernilai None/— (BUKAN 0).
    """
    now_utc = datetime.now(timezone.utc)
    latest_physical = db.query(SensorReading).filter(
        SensorReading.source == 'iot'
    ).order_by(desc(SensorReading.timestamp)).first()

    is_online = False
    last_update = None
    pm25, pm10, co, no2, so2, o3, temp, hum = (None,) * 8

    if latest_physical:
        rec_time = latest_physical.timestamp.replace(tzinfo=timezone.utc) if latest_physical.timestamp.tzinfo is None else latest_physical.timestamp
        if (now_utc - rec_time).total_seconds() <= HEARTBEAT_TIMEOUT_SECONDS:
            is_online = True
            last_update = rec_time.isoformat()
            pm25, pm10 = latest_physical.pm2_5, latest_physical.pm10
            co, no2, so2, o3 = latest_physical.co, latest_physical.no2, latest_physical.so2, latest_physical.o3
            temp, hum = latest_physical.temperature, latest_physical.humidity

    return [
        {
            'id': 'pm',
            'name': 'PM2.5 / PM10 Sensor',
            'type': 'PMS5003',
            'status': 'active' if is_online else 'disconnected',
            'statusLabel': 'Terhubung' if is_online else 'Belum terhubung',
            'color': 'green' if is_online else 'gray',
            'lastReading': {'pm25': pm25, 'pm10': pm10},
            'lastUpdate': last_update,
            'unit': 'µg/m³'
        },
        {
            'id': 'co',
            'name': 'CO Sensor',
            'type': 'MQ-7',
            'status': 'active' if is_online else 'disconnected',
            'statusLabel': 'Terhubung' if is_online else 'Belum terhubung',
            'color': 'green' if is_online else 'gray',
            'lastReading': {'co': co},
            'lastUpdate': last_update,
            'unit': 'mg/m³'
        },
        {
            'id': 'no2',
            'name': 'NO2 Sensor',
            'type': 'MiCS-2714',
            'status': 'active' if is_online else 'disconnected',
            'statusLabel': 'Terhubung' if is_online else 'Belum terhubung',
            'color': 'green' if is_online else 'gray',
            'lastReading': {'no2': no2},
            'lastUpdate': last_update,
            'unit': 'µg/m³'
        },
        {
            'id': 'so2',
            'name': 'SO2 Sensor',
            'type': 'ME2-SO2',
            'status': 'active' if is_online else 'disconnected',
            'statusLabel': 'Terhubung' if is_online else 'Belum terhubung',
            'color': 'green' if is_online else 'gray',
            'lastReading': {'so2': so2},
            'lastUpdate': last_update,
            'unit': 'µg/m³'
        },
        {
            'id': 'o3',
            'name': 'O3 Sensor',
            'type': 'MQ-131',
            'status': 'active' if is_online else 'disconnected',
            'statusLabel': 'Terhubung' if is_online else 'Belum terhubung',
            'color': 'green' if is_online else 'gray',
            'lastReading': {'o3': o3},
            'lastUpdate': last_update,
            'unit': 'µg/m³'
        },
        {
            'id': 'dht',
            'name': 'Suhu / Kelembapan Sensor',
            'type': 'DHT22',
            'status': 'active' if is_online else 'disconnected',
            'statusLabel': 'Terhubung' if is_online else 'Belum terhubung',
            'color': 'green' if is_online else 'gray',
            'lastReading': {'temperature': temp, 'humidity': hum},
            'lastUpdate': last_update,
            'unit': '°C / %'
        },
    ]

# -----------------------------------------------------------------------------
# DEVICES MANAGEMENT
# -----------------------------------------------------------------------------
SENSOR_DEFINITIONS = (
    ('pm', 'PM2.5 / PM10 Sensor', 'PMS5003', ('pm2_5', 'pm10'), ('pm25', 'pm10'), 'ug/m3'),
    ('co', 'CO Sensor', 'MQ-7', ('co',), ('co',), 'mg/m3'),
    ('no2', 'NO2 Sensor', 'MiCS-2714', ('no2',), ('no2',), 'ug/m3'),
    ('so2', 'SO2 Sensor', 'ME2-SO2', ('so2',), ('so2',), 'ug/m3'),
    ('o3', 'O3 Sensor', 'MQ-131', ('o3',), ('o3',), 'ug/m3'),
    ('dht', 'Suhu / Kelembapan Sensor', 'DHT22', ('temperature', 'humidity'), ('temperature', 'humidity'), 'C / %'),
)


def get_sensor_status_for_device(device: Device, sensor_id: str, fields: tuple, output_keys: tuple, now_utc: datetime, db: Session) -> Dict[str, Any]:
    readings = db.query(SensorReading).filter(
        SensorReading.device_id == device.device_id,
        SensorReading.source == 'iot',
    ).order_by(desc(SensorReading.timestamp)).all()
    latest = next((r for r in readings if any(getattr(r, field) is not None for field in fields)), None)
    # A newer packet without this error clears an older sensor error; historical
    # failures must not permanently keep a recovered sensor in ERROR.
    latest_packet = readings[0] if readings else None
    error_reading = latest_packet if latest_packet and latest_packet.sensor_errors and sensor_id in json.loads(latest_packet.sensor_errors) else None
    online = is_device_physically_online(device.last_heartbeat, now_utc)

    if error_reading and online:
        errors = json.loads(error_reading.sensor_errors)
        code, label, color = 'ERROR', errors[sensor_id], 'red'
        last_update, values = as_utc(error_reading.timestamp), {key: None for key in output_keys}
    elif latest is None:
        code, label, color = 'NO_DATA', 'Belum terhubung', 'gray'
        last_update, values = None, {key: None for key in output_keys}
    else:
        last_update = as_utc(latest.timestamp)
        values = {key: getattr(latest, field) for field, key in zip(fields, output_keys)}
        stale = not online or (now_utc - last_update).total_seconds() > HEARTBEAT_TIMEOUT_SECONDS
        code, label, color = ('STALE', 'Data kedaluwarsa', 'gray') if stale else ('CONNECTED', 'Terhubung', 'green')

    return {
        'status': code.lower(), 'statusCode': code, 'statusLabel': label, 'color': color,
        'lastReading': values, 'lastUpdate': last_update.isoformat() if last_update else None,
    }


@app.get('/devices/{device_id}/sensors', tags=['Devices'])
def get_device_sensor_status(device_id: str, db: Session = Depends(get_db)):
    """Per-sensor status calculated solely from physical packets and their age."""
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail=f'Perangkat {device_id} tidak ditemukan.')
    now_utc = datetime.now(timezone.utc)
    return [
        {
            'id': sensor_id, 'name': name, 'type': sensor_type, 'unit': unit,
            **get_sensor_status_for_device(device, sensor_id, fields, output_keys, now_utc, db),
        }
        for sensor_id, name, sensor_type, fields, output_keys, unit in SENSOR_DEFINITIONS
    ]


def format_device_dict(d: Device, now_utc: datetime) -> Dict[str, Any]:
    is_online = is_device_physically_online(d.last_heartbeat, now_utc)
    is_sim = is_simulation_active(d.last_simulation_seen, now_utc)
    last_seen_iso = as_utc(d.last_heartbeat).isoformat() if d.last_heartbeat else None
    last_sim_iso = as_utc(d.last_simulation_seen).isoformat() if d.last_simulation_seen else None
    is_error = bool(is_online and d.reported_error)
    status_code = 'ERROR' if is_error else ('ONLINE' if is_online else 'OFFLINE')

    return {
        'id': d.device_id,
        'deviceName': d.name,
        'deviceCode': d.device_code or 'ESP32-WROOM-32E',
        'status': status_code.lower(),
        'statusCode': status_code,
        'lastSeen': last_seen_iso,
        'firmwareVersion': d.firmware_version or 'Belum tersedia',
        'location': d.location or 'Ruang Utama',
        'ipAddress': d.ip_address or '—',
        'macAddress': d.mac_address or '—',
        'uptime': d.uptime if is_online else '—',
        'error': d.reported_error if is_error else None,
        'simulation': {
            'active': is_sim,
            'lastSeen': last_sim_iso
        },
        'connection': {
            'wifiStatus': 'Connected' if is_online and d.wifi_ssid else 'Belum terhubung',
            'ssid': d.wifi_ssid if is_online else '—',
            'signalStrength': d.signal_strength if is_online else None,
            'signalQuality': ('Sangat Baik' if d.signal_strength > -60 else 'Cukup') if is_online and d.signal_strength is not None else 'Tidak tersedia',
            'lastCommunication': last_seen_iso
        }
    }

@app.get('/devices', tags=['Devices'])
def list_devices(db: Session = Depends(get_db)):
    devices = db.query(Device).all()
    now_utc = datetime.now(timezone.utc)
    return [format_device_dict(d, now_utc) for d in devices]

@app.get('/devices/{device_id}', tags=['Devices'])
def get_device_detail(device_id: str, db: Session = Depends(get_db)):
    d = db.query(Device).filter(Device.device_id == device_id).first()
    if not d:
        return {
            'id': device_id, 'deviceName': 'Perangkat belum dikonfigurasi', 'deviceCode': '—',
            'status': 'not_configured', 'statusCode': 'NOT_CONFIGURED', 'lastSeen': None,
            'firmwareVersion': '—', 'location': '—', 'ipAddress': '—', 'macAddress': '—', 'uptime': '—',
            'error': None, 'simulation': {'active': False, 'lastSeen': None},
            'connection': {
                'wifiStatus': 'Belum terhubung', 'ssid': '—', 'signalStrength': None,
                'signalQuality': 'Tidak tersedia', 'lastCommunication': None,
            },
        }
    now_utc = datetime.now(timezone.utc)
    return format_device_dict(d, now_utc)

@app.get('/devices/{device_id}/activity', tags=['Devices'])
def get_device_activity(device_id: str, db: Session = Depends(get_db)):
    readings = db.query(SensorReading).filter(
        SensorReading.device_id == device_id
    ).order_by(desc(SensorReading.timestamp)).limit(8).all()

    activity = []
    for idx, r in enumerate(readings, start=1):
        ts = r.timestamp.replace(tzinfo=timezone.utc) if r.timestamp.tzinfo is None else r.timestamp
        source_label = 'IoT Fisik' if r.source == 'iot' else 'Simulasi'
        activity.append({
            'id': idx,
            'type': 'reading',
            'message': f'Data {source_label} diterima - PM2.5: {r.pm2_5}',
            'timestamp': ts.isoformat()
        })
    return activity

# -----------------------------------------------------------------------------
# MACHINE LEARNING PREDICTION
# -----------------------------------------------------------------------------
@app.post('/predict', tags=['Machine Learning'])
def predict_risk(data: PredictionRequest, db: Session = Depends(get_db)):
    if ml_pipeline is None:
        raise HTTPException(status_code=503, detail='Model Machine Learning tidak tersedia.')

    input_df = pd.DataFrame([{
        'PM2.5': float(data.PM2_5),
        'PM10': float(data.PM10),
        'SO2': float(data.SO2),
        'NO2': float(data.NO2),
        'CO': float(data.CO),
        'O3': float(data.O3),
        'Suhu_Udara': float(data.Suhu_Udara),
        'Kelembaban_Udara': float(data.Kelembaban_Udara),
        'Usia': int(data.Usia),
        'Riwayat_Asma': int(data.Riwayat_Asma),
        'Status_Merokok': int(data.Status_Merokok),
        'Durasi_Paparan_Outdoor': float(data.Durasi_Paparan_Outdoor)
    }])

    try:
        prediction_class = int(ml_pipeline.predict(input_df)[0])
        probabilities = ml_pipeline.predict_proba(input_df)[0]
        prob_low = round(float(probabilities[0]), 4)
        prob_med = round(float(probabilities[1]), 4)
        prob_high = round(float(probabilities[2]), 4)
    except Exception as e:
        logger.error(f'Error during model prediction: {e}')
        raise HTTPException(status_code=500, detail=f'Inferensi model gagal: {str(e)}')

    risk_label = RISK_LABELS.get(prediction_class, 'Tidak Diketahui')
    pred_id = f'pred-{int(datetime.now(timezone.utc).timestamp())}-{uuid.uuid4().hex[:6]}'

    try:
        features_dict = {
            'PM2.5': data.PM2_5, 'PM10': data.PM10, 'SO2': data.SO2, 'NO2': data.NO2,
            'CO': data.CO, 'O3': data.O3, 'Suhu_Udara': data.Suhu_Udara,
            'Kelembaban_Udara': data.Kelembaban_Udara, 'Usia': data.Usia,
            'Riwayat_Asma': data.Riwayat_Asma, 'Status_Merokok': data.Status_Merokok,
            'Durasi_Paparan_Outdoor': data.Durasi_Paparan_Outdoor
        }
        rec = PredictionRecord(
            id=pred_id,
            sensor_reading_id=data.sensor_reading_id,
            user_profile_id=data.user_profile_id,
            risk_class=prediction_class,
            risk_label=risk_label,
            prob_low=prob_low,
            prob_medium=prob_med,
            prob_high=prob_high,
            model_version='LogisticRegression-v1.0',
            input_features=json.dumps(features_dict),
            created_at=datetime.now(timezone.utc)
        )
        db.add(rec)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f'Failed to save prediction record: {e}')

    return {
        'id': pred_id,
        'risk_class': prediction_class,
        'risk_label': risk_label,
        'probabilities': {'low': prob_low, 'medium': prob_med, 'high': prob_high},
        'prediction_score': float(probabilities[prediction_class]),
        'model_version': 'LogisticRegression-v1.0',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'disclaimer': DISCLAIMER_TEXT
    }

@app.get('/predictions', tags=['Machine Learning'])
def list_predictions(
    limit: int = Query(50, ge=1, le=200),
    risk_level: Optional[int] = Query(None, ge=0, le=2),
    db: Session = Depends(get_db)
):
    query = db.query(PredictionRecord)
    if risk_level is not None:
        query = query.filter(PredictionRecord.risk_class == risk_level)
    records = query.order_by(desc(PredictionRecord.created_at)).limit(limit).all()

    result = []
    for r in records:
        features = {}
        try:
            features = json.loads(r.input_features) if r.input_features else {}
        except Exception:
            pass

        created_at = r.created_at.replace(tzinfo=timezone.utc) if r.created_at.tzinfo is None else r.created_at
        result.append({
            'id': r.id,
            'createdAt': created_at.isoformat(),
            'riskLevel': r.risk_class,
            'riskLabel': r.risk_label,
            'predictionScore': r.prob_high if r.risk_class == 2 else (r.prob_medium if r.risk_class == 1 else r.prob_low),
            'probabilities': {'low': r.prob_low, 'medium': r.prob_medium, 'high': r.prob_high},
            'userInput': {
                'age': features.get('Usia', 20),
                'asthmaHistory': bool(features.get('Riwayat_Asma', 0)),
                'smokingStatus': 'never' if features.get('Status_Merokok') == 0 else ('former' if features.get('Status_Merokok') == 1 else 'active'),
                'outdoorExposure': features.get('Durasi_Paparan_Outdoor', 2.0)
            },
            'airQuality': {
                'pm25': features.get('PM2.5', None),
                'pm10': features.get('PM10', None),
                'co': features.get('CO', None),
                'no2': features.get('NO2', None),
                'so2': features.get('SO2', None),
                'o3': features.get('O3', None),
                'temperature': features.get('Suhu_Udara', None),
                'humidity': features.get('Kelembaban_Udara', None)
            }
        })
    return result

@app.get('/predictions/{prediction_id}', tags=['Machine Learning'])
def get_prediction_detail(prediction_id: str, db: Session = Depends(get_db)):
    r = db.query(PredictionRecord).filter(PredictionRecord.id == prediction_id).first()
    if not r:
        raise HTTPException(status_code=404, detail=f'Prediksi {prediction_id} tidak ditemukan.')
    features = {}
    try:
        features = json.loads(r.input_features) if r.input_features else {}
    except Exception:
        pass
    created_at = r.created_at.replace(tzinfo=timezone.utc) if r.created_at.tzinfo is None else r.created_at
    return {
        'id': r.id,
        'createdAt': created_at.isoformat(),
        'riskLevel': r.risk_class,
        'riskLabel': r.risk_label,
        'predictionScore': r.prob_high if r.risk_class == 2 else (r.prob_medium if r.risk_class == 1 else r.prob_low),
        'probabilities': {'low': r.prob_low, 'medium': r.prob_medium, 'high': r.prob_high},
        'userInput': {
            'age': features.get('Usia', 20),
            'asthmaHistory': bool(features.get('Riwayat_Asma', 0)),
            'smokingStatus': 'never' if features.get('Status_Merokok') == 0 else ('former' if features.get('Status_Merokok') == 1 else 'active'),
            'outdoorExposure': features.get('Durasi_Paparan_Outdoor', 2.0)
        },
        'airQuality': {
            'pm25': features.get('PM2.5', None),
            'pm10': features.get('PM10', None),
            'co': features.get('CO', None),
            'no2': features.get('NO2', None),
            'so2': features.get('SO2', None),
            'o3': features.get('O3', None),
            'temperature': features.get('Suhu_Udara', None),
            'humidity': features.get('Kelembaban_Udara', None)
        },
        'disclaimer': DISCLAIMER_TEXT
    }

# -----------------------------------------------------------------------------
# USER PROFILE
# -----------------------------------------------------------------------------
@app.get('/user/profile', tags=['User Profile'])
def get_user_profile(user_id: str = 'user-001', db: Session = Depends(get_db)):
    prof = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not prof:
        raise HTTPException(status_code=404, detail='User profile tidak ditemukan.')
    created_at = prof.created_at.replace(tzinfo=timezone.utc) if prof.created_at.tzinfo is None else prof.created_at
    return {
        'id': prof.id,
        'name': prof.name,
        'age': prof.age,
        'asthmaHistory': prof.asthma_history,
        'smokingStatus': prof.smoking_status,
        'outdoorExposure': prof.outdoor_exposure,
        'createdAt': created_at.isoformat()
    }

@app.put('/user/profile', tags=['User Profile'])
def update_user_profile(payload: UserProfileUpdate, user_id: str = 'user-001', db: Session = Depends(get_db)):
    prof = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not prof:
        prof = UserProfile(id=user_id)
        db.add(prof)

    if payload.name is not None:
        prof.name = payload.name
    if payload.age is not None:
        prof.age = payload.age
    if payload.asthma_history is not None:
        prof.asthma_history = payload.asthma_history
    if payload.smoking_status is not None:
        prof.smoking_status = payload.smoking_status
    if payload.outdoor_exposure is not None:
        prof.outdoor_exposure = payload.outdoor_exposure

    prof.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(prof)
    return {
        'id': prof.id,
        'name': prof.name,
        'age': prof.age,
        'asthmaHistory': prof.asthma_history,
        'smokingStatus': prof.smoking_status,
        'outdoorExposure': prof.outdoor_exposure,
        'updatedAt': prof.updated_at.isoformat()
    }

# -----------------------------------------------------------------------------
# SYSTEM OVERVIEW STATUS
# -----------------------------------------------------------------------------
@app.get('/system/status', tags=['System'])
def get_system_summary(db: Session = Depends(get_db)):
    now_utc = datetime.now(timezone.utc)
    latest_physical = db.query(SensorReading).filter(
        SensorReading.source == 'iot'
    ).order_by(desc(SensorReading.timestamp)).first()

    devices = db.query(Device).all()
    online_devices = 0
    sim_active = False

    for d in devices:
        if is_device_physically_online(d.last_heartbeat, now_utc):
            online_devices += 1
        if is_simulation_active(d.last_simulation_seen, now_utc):
            sim_active = True

    last_updated_str = None
    if latest_physical and online_devices > 0:
        rec_time = latest_physical.timestamp.replace(tzinfo=timezone.utc) if latest_physical.timestamp.tzinfo is None else latest_physical.timestamp
        last_updated_str = rec_time.isoformat()

    return {
        'status': 'online' if online_devices > 0 else 'offline',
        'lastUpdated': last_updated_str,
        'activeSensors': 6 if online_devices > 0 else 0,
        'totalSensors': 6,
        'deviceOnline': online_devices > 0,
        'totalDevices': len(devices),
        'onlineDevices': online_devices,
        'simulationActive': sim_active,
        'databaseConnected': True,
        'modelLoaded': ml_pipeline is not None
    }
