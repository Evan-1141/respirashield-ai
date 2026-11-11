-- ============================================================================
-- RespiraShield AI — Database Schema Migration
-- Compatible with Supabase PostgreSQL and standard PostgreSQL 14+
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. TABLE: devices
-- Stores IoT station hardware info, metadata, and connectivity status
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL DEFAULT 'RespiraShield Station #1',
    device_code VARCHAR(64) DEFAULT 'ESP32-WROOM-32E',
    location VARCHAR(255) NOT NULL DEFAULT 'Ruang Utama',
    status VARCHAR(32) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'not_configured', 'error')),
    last_seen TIMESTAMPTZ,                -- Komunikasi fisik (source=iot) terakhir
    last_heartbeat TIMESTAMPTZ,           -- Heartbeat fisik terakhir
    last_simulation_seen TIMESTAMPTZ,      -- Waktu telemetri simulator terakhir
    ip_address VARCHAR(45),               -- Diperoleh saat perangkat fisik terhubung
    mac_address VARCHAR(17),
    firmware_version VARCHAR(32),         -- NULL sampai dilaporkan perangkat fisik
    wifi_ssid VARCHAR(64),
    signal_strength INTEGER,
    uptime VARCHAR(64),
    reported_error TEXT,
    reported_error_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- ----------------------------------------------------------------------------
-- 2. TABLE: sensor_readings
-- Time-series air quality telemetry collected from physical IoT sensors / simulator
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sensor_readings (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pm2_5 NUMERIC(6, 2) CHECK (pm2_5 >= 0 AND pm2_5 <= 1000),
    pm10 NUMERIC(6, 2) CHECK (pm10 >= 0 AND pm10 <= 1000),
    so2 NUMERIC(6, 2) CHECK (so2 >= 0 AND so2 <= 500),
    no2 NUMERIC(6, 2) CHECK (no2 >= 0 AND no2 <= 500),
    co NUMERIC(6, 2) CHECK (co >= 0 AND co <= 100),
    o3 NUMERIC(6, 2) CHECK (o3 >= 0 AND o3 <= 500),
    temperature NUMERIC(5, 2) CHECK (temperature >= -20 AND temperature <= 70),
    humidity NUMERIC(5, 2) CHECK (humidity >= 0 AND humidity <= 100),
    source VARCHAR(32) NOT NULL DEFAULT 'simulation' CHECK (source IN ('iot', 'simulation')),
    sensor_errors JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_timestamp ON sensor_readings(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_source ON sensor_readings(source);

-- ----------------------------------------------------------------------------
-- 3. TABLE: user_profiles
-- Personal health characteristics required for ML risk classification (12-features)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'user-001',
    name VARCHAR(128) NOT NULL DEFAULT 'Pengguna RespiraShield',
    age INTEGER NOT NULL CHECK (age >= 1 AND age <= 120),
    asthma_history BOOLEAN NOT NULL DEFAULT FALSE,
    smoking_status VARCHAR(32) NOT NULL DEFAULT 'never' CHECK (smoking_status IN ('never', 'former', 'active')),
    outdoor_exposure NUMERIC(4, 1) NOT NULL DEFAULT 2.0 CHECK (outdoor_exposure >= 0 AND outdoor_exposure <= 24),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. TABLE: predictions
-- Historical machine learning risk classifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictions (
    id VARCHAR(64) PRIMARY KEY,
    sensor_reading_id INTEGER REFERENCES sensor_readings(id) ON DELETE SET NULL,
    user_profile_id VARCHAR(64) REFERENCES user_profiles(id) ON DELETE SET NULL,
    risk_class INTEGER NOT NULL CHECK (risk_class IN (0, 1, 2)),
    risk_label VARCHAR(32) NOT NULL CHECK (risk_label IN ('Rendah', 'Sedang', 'Tinggi')),
    prob_low NUMERIC(5, 4),
    prob_medium NUMERIC(5, 4),
    prob_high NUMERIC(5, 4),
    model_version VARCHAR(64) NOT NULL DEFAULT 'LogisticRegression-v1.0',
    input_features JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_risk_class ON predictions(risk_class);

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- ----------------------------------------------------------------------------
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read devices" ON devices FOR SELECT USING (true);
CREATE POLICY "Public read sensor_readings" ON sensor_readings FOR SELECT USING (true);
CREATE POLICY "Public read user_profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Public read predictions" ON predictions FOR SELECT USING (true);

CREATE POLICY "Service insert sensor_readings" ON sensor_readings FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update devices" ON devices FOR ALL USING (true);
CREATE POLICY "Service manage predictions" ON predictions FOR ALL USING (true);
CREATE POLICY "Service manage user_profiles" ON user_profiles FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- 6. DEFAULT INITIAL SEED DATA
-- Perangkat terdaftar dengan status OFFLINE (belum terhubung sampai ESP32 fisik mengirim data)
-- ----------------------------------------------------------------------------
INSERT INTO devices (device_id, name, device_code, location, status, last_seen, last_heartbeat, last_simulation_seen, ip_address, mac_address, firmware_version, wifi_ssid, signal_strength, uptime)
VALUES (
    'RSH-ESP32-001',
    'RespiraShield Station #1',
    'ESP32-WROOM-32E',
    'Ruang Utama',
    'offline',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
) ON CONFLICT (device_id) DO NOTHING;

INSERT INTO user_profiles (id, name, age, asthma_history, smoking_status, outdoor_exposure)
VALUES (
    'user-001',
    'Evan Danendra',
    20,
    FALSE,
    'never',
    3.0
) ON CONFLICT (id) DO NOTHING;
