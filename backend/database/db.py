import os
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import (
    create_engine, Column, Integer, Float, String, Boolean, DateTime, Text, ForeignKey, text
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session

logger = logging.getLogger('respirashield.database')

# -----------------------------------------------------------------------------
# DATABASE URL RESOLUTION
# -----------------------------------------------------------------------------
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, 'respirashield.db')
    DATABASE_URL = f"sqlite:///{db_path}"

connect_args = {'check_same_thread': False} if DATABASE_URL.startswith('sqlite') else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# -----------------------------------------------------------------------------
# MODELS
# -----------------------------------------------------------------------------
class Device(Base):
    __tablename__ = 'devices'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False, default='RespiraShield Station #1')
    device_code = Column(String(64), default='ESP32-WROOM-32E')
    location = Column(String(255), default='Ruang Utama')
    status = Column(String(32), default='offline')  # online, offline, not_configured, error
    last_seen = Column(DateTime(timezone=True), nullable=True)  # Hanya diupdate saat source='iot'
    last_heartbeat = Column(DateTime(timezone=True), nullable=True)  # Heartbeat fisik
    last_simulation_seen = Column(DateTime(timezone=True), nullable=True)  # Telemetri simulator
    ip_address = Column(String(45), nullable=True)
    mac_address = Column(String(17), nullable=True)
    firmware_version = Column(String(32), nullable=True)
    wifi_ssid = Column(String(64), nullable=True)
    signal_strength = Column(Integer, nullable=True)
    uptime = Column(String(64), nullable=True)
    reported_error = Column(Text, nullable=True)
    reported_error_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    readings = relationship('SensorReading', back_populates='device', cascade='all, delete-orphan')


class SensorReading(Base):
    __tablename__ = 'sensor_readings'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id = Column(String(64), ForeignKey('devices.device_id'), index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), index=True, default=lambda: datetime.now(timezone.utc))
    # A null measurement means the module did not produce a reading. It must
    # never be converted to zero: zero is a valid physical measurement.
    pm2_5 = Column(Float, nullable=True)
    pm10 = Column(Float, nullable=True)
    so2 = Column(Float, nullable=True)
    no2 = Column(Float, nullable=True)
    co = Column(Float, nullable=True)
    o3 = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    source = Column(String(32), default='simulation')  # 'iot' atau 'simulation'
    sensor_errors = Column(Text, nullable=True)  # JSON object keyed by sensor id
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    device = relationship('Device', back_populates='readings')
    predictions = relationship('PredictionRecord', back_populates='sensor_reading')


class UserProfile(Base):
    __tablename__ = 'user_profiles'

    id = Column(String(64), primary_key=True, default='user-001')
    name = Column(String(128), default='Pengguna RespiraShield')
    age = Column(Integer, default=20)
    asthma_history = Column(Boolean, default=False)
    smoking_status = Column(String(32), default='never')
    outdoor_exposure = Column(Float, default=2.0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class PredictionRecord(Base):
    __tablename__ = 'predictions'

    id = Column(String(64), primary_key=True)
    sensor_reading_id = Column(Integer, ForeignKey('sensor_readings.id'), nullable=True)
    user_profile_id = Column(String(64), ForeignKey('user_profiles.id'), nullable=True)
    risk_class = Column(Integer, nullable=False)
    risk_label = Column(String(32), nullable=False)
    prob_low = Column(Float, nullable=True)
    prob_medium = Column(Float, nullable=True)
    prob_high = Column(Float, nullable=True)
    model_version = Column(String(64), default='LogisticRegression-v1.0')
    input_features = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    sensor_reading = relationship('SensorReading', back_populates='predictions')


# -----------------------------------------------------------------------------
# DEPENDENCY & INITIALIZATION
# -----------------------------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes tables and ensures clean default status (OFFLINE until hardware connects)."""
    Base.metadata.create_all(bind=engine)
    _migrate_status_columns()
    db = SessionLocal()
    try:
        # Pastikan Device RSH-ESP32-001 terdaftar tapi berstatus OFFLINE tanpa data komunikasi palsu
        dev = db.query(Device).filter(Device.device_id == 'RSH-ESP32-001').first()
        if not dev:
            dev = Device(
                device_id='RSH-ESP32-001',
                name='RespiraShield Station #1',
                device_code='ESP32-WROOM-32E',
                location='Ruang Utama',
                status='offline',
                last_seen=None,
                last_heartbeat=None,
                last_simulation_seen=None,
                ip_address=None,
                mac_address=None,
                firmware_version=None,
                wifi_ssid=None,
                signal_strength=None,
                uptime=None
            )
            db.add(dev)
            db.commit()
            logger.info('Created clean unconfigured/offline device RSH-ESP32-001')
        else:
            # Jika sebelumnya tersimpan data palsu, bersihkan agar status mencerminkan kenyataan
            # (hanya jika belum pernah ada komunikasi fisik nyata dari hardware)
            physical_count = db.query(SensorReading).filter(
                SensorReading.device_id == 'RSH-ESP32-001',
                SensorReading.source == 'iot'
            ).count()
            if physical_count == 0:
                dev.status = 'offline'
                dev.last_seen = None
                dev.last_heartbeat = None
                dev.ip_address = None
                dev.mac_address = None
                dev.firmware_version = None
                dev.wifi_ssid = None
                dev.signal_strength = None
                dev.uptime = None
                db.commit()
                logger.info('Reset RSH-ESP32-001 to OFFLINE (no physical IoT packets recorded)')

        # Ensure User Profile
        prof = db.query(UserProfile).filter(UserProfile.id == 'user-001').first()
        if not prof:
            prof = UserProfile(
                id='user-001',
                name='Evan Danendra',
                age=20,
                asthma_history=False,
                smoking_status='never',
                outdoor_exposure=3.0
            )
            db.add(prof)
            db.commit()
            logger.info('Created user profile user-001')

    except Exception as e:
        db.rollback()
        logger.error(f'Database initialization error: {e}')
        raise
    finally:
        db.close()


def _migrate_status_columns():
    """Make existing development databases safe for partial sensor packets.

    ``create_all`` does not alter a table already created by an older ORM
    model. SQLite also cannot drop a NOT NULL constraint in-place, so the
    table is rebuilt while preserving every existing row and primary key.
    PostgreSQL installations should apply ``schema.sql`` during deployment.
    """
    with engine.begin() as connection:
        if engine.dialect.name == 'sqlite':
            device_columns = {row[1] for row in connection.exec_driver_sql('PRAGMA table_info(devices)')}
            if 'reported_error' not in device_columns:
                connection.exec_driver_sql('ALTER TABLE devices ADD COLUMN reported_error TEXT')
            if 'reported_error_at' not in device_columns:
                connection.exec_driver_sql('ALTER TABLE devices ADD COLUMN reported_error_at DATETIME')

            columns = connection.exec_driver_sql('PRAGMA table_info(sensor_readings)').fetchall()
            by_name = {row[1]: row for row in columns}
            needs_rebuild = any(by_name.get(name, [None, None, None, 0])[3] for name in (
                'pm2_5', 'pm10', 'so2', 'no2', 'co', 'o3', 'temperature', 'humidity'
            )) or 'sensor_errors' not in by_name
            if needs_rebuild:
                connection.exec_driver_sql('PRAGMA foreign_keys=OFF')
                connection.exec_driver_sql('''
                    CREATE TABLE sensor_readings_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        device_id VARCHAR(64) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
                        timestamp DATETIME,
                        pm2_5 FLOAT, pm10 FLOAT, so2 FLOAT, no2 FLOAT, co FLOAT, o3 FLOAT,
                        temperature FLOAT, humidity FLOAT,
                        source VARCHAR(32), sensor_errors TEXT, created_at DATETIME
                    )
                ''')
                connection.exec_driver_sql('''
                    INSERT INTO sensor_readings_new
                    (id, device_id, timestamp, pm2_5, pm10, so2, no2, co, o3, temperature, humidity, source, created_at)
                    SELECT id, device_id, timestamp, pm2_5, pm10, so2, no2, co, o3, temperature, humidity, source, created_at
                    FROM sensor_readings
                ''')
                connection.exec_driver_sql('DROP TABLE sensor_readings')
                connection.exec_driver_sql('ALTER TABLE sensor_readings_new RENAME TO sensor_readings')
                connection.exec_driver_sql('CREATE INDEX IF NOT EXISTS ix_sensor_readings_device_id ON sensor_readings (device_id)')
                connection.exec_driver_sql('CREATE INDEX IF NOT EXISTS ix_sensor_readings_timestamp ON sensor_readings (timestamp)')
                connection.exec_driver_sql('PRAGMA foreign_keys=ON')
