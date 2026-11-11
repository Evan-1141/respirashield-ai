# 📋 Laporan Pembaruan Proyek — RespiraShield AI
**Tanggal**: 22 Oktober 2026  
**Peran**: Senior Full-Stack Engineer, IoT System Engineer, Database Engineer, & QA Engineer  
**Status Proyek**: Produksi / Siap Integrasi Hardware IoT Fisik

---

## Pembaruan Status Hardware yang Terverifikasi — 22 Oktober 2026

### File yang diubah

`backend/main.py`, `backend/database/db.py`, `backend/database/schema.sql`, `src/lib/api.js`, `src/app/(dashboard)/devices/page.jsx`, `src/app/(dashboard)/monitoring/page.jsx`, `src/components/monitoring/SensorChart.jsx`, `src/components/ui/StatusBadge.jsx`, dan `backend/test_device_status.py`.

### Aturan sumber kebenaran

- Perangkat hanya **ONLINE** setelah backend menerima heartbeat atau pembacaan dengan `source: "iot"` yang valid dalam `HEARTBEAT_TIMEOUT_SECONDS` (default 60 detik). Tanpa paket fisik, perangkat yang telah dikonfigurasi adalah **OFFLINE**; respons detail untuk ID yang tidak terdaftar menggunakan **NOT_CONFIGURED** tanpa metadata atau telemetri palsu.
- Data `source: "simulation"` hanya mengubah penanda **Simulasi Aktif** dan tidak pernah mengubah `last_heartbeat`, `last_seen`, atau status perangkat fisik.
- Status sensor dihitung per sensor dan per perangkat: `CONNECTED`, `NO_DATA`, `STALE`, atau `ERROR`. Nilai yang belum tersedia disimpan/dikirim sebagai `null`, tidak pernah sebagai `0`.
- Metadata runtime (Wi-Fi, sinyal, uptime, firmware) hanya disimpan dari paket fisik. Jika tidak dilaporkan, antarmuka menampilkan `—` atau `Belum terhubung`.
- Endpoint baru `POST /devices/heartbeat` memungkinkan ESP32 membuktikan koneksi saat tidak ada modul sensor yang menghasilkan pembacaan. Endpoint `GET /devices/{device_id}/sensors` menyediakan status sensor yang benar-benar dipakai UI.

### Verifikasi yang disediakan

`backend/test_device_status.py` menguji perangkat awal offline, simulasi tidak membuat hardware online, pembacaan fisik valid, heartbeat yang kedaluwarsa, sensor individual tanpa data saat ESP32 online, kesalahan sensor yang dilaporkan, sumber data invalid, serta kegagalan database yang menghasilkan respons 500 (bukan status Online palsu).

Bagian yang masih belum dapat diverifikasi tanpa hardware: penerimaan paket dari ESP32/sensor fisik, akurasi sinyal Wi-Fi aktual, pembacaan uptime/firmware firmware ESP32, dan kesalahan sensor yang benar-benar dilaporkan perangkat.

### Pembaruan autofill prediksi

Tombol **Isi Otomatis dari Sensor & Profil** hanya menampilkan sukses dan mengisi delapan fitur kualitas udara bila respons adalah pembacaan fisik lengkap: `available: true`, `status: CONNECTED`, dan `source: iot`. Saat ESP32 belum tersambung, datanya parsial, simulator aktif, atau backend gagal dihubungi, antarmuka menampilkan peringatan kuning dan tidak mengganti nilai sensor dengan `null`, nol, atau data simulasi.

---

## A. Ringkasan Kondisi Proyek

| Aspek | Kondisi Sebelum Pengembangan | Kondisi Sesudah Pengembangan |
|---|---|---|
| **Penyimpanan Data** | Tidak ada database aktif; data dashboard mengandalkan file statis `mock-data.js`. | Database terintegrasi permanen (SQLite default tanpa setup rumit, siap Supabase PostgreSQL) dengan tabel `devices`, `sensor_readings`, `predictions`, dan `user_profiles`. |
| **Ingesti IoT Sensor** | Belum tersedia endpoint penerima data perangkat IoT. | Endpoint `POST /sensor/readings` aktif dengan validasi Pydantic ketat, autentikasi token (`X-Device-Token`), dan update timestamp real-time. |
| **Simulator IoT** | Belum ada alat penguji data sensor mandiri. | Tersedia CLI simulator `backend/simulator.py` (mode burst & continuous, variasi diurnal dan simulasi anomali polusi). |
| **Pipeline AI (12 Fitur)** | Prediksi hanya melalui form manual tanpa persistensi riwayat ke database. | Model Logistic Regression 12-fitur tersambung ke database, menghitung probabilitas kelas nyata (`predict_proba`), dan fitur auto-sync dari sensor IoT + profil pengguna. |
| **Frontend Integration** | Membaca data statis / mock. Terdapat konflik routing 404 pada dashboard. | Halaman Dashboard, Monitoring, Devices, History, dan Profile 100% tersambung ke backend API real-time dengan indikator badge sumber data (`IoT` vs `Simulasi`) dan deteksi data kedaluwarsa. |
| **Pengujian (QA)** | Belum ada unit test atau integration test otomatis. | Test suite otomatis `backend/test_system.py` dengan 15 test case lolos (100% PASS). |

---

## B. Perubahan Teknis File

| No | File | Status | Tujuan Perubahan |
|---|---|---|---|
| 1 | `backend/database/schema.sql` | **Dibuat** | Schema migrasi database DDL lengkap untuk Supabase PostgreSQL (tabel, foreign keys, constraints, indexes, RLS policies, seed data). |
| 2 | `backend/database/db.py` | **Dibuat** | SQLAlchemy ORM engine, model tabel, connection manager, dan auto-seeding baseline 49 time-series sensor telemetry. |
| 3 | `backend/main.py` | **Diperbarui** | Implementasi 21 rute RESTful API (Health, IoT Sensor Ingestion, Latest, History, Trends, Status, Devices, 12-Feature Predict, Predictions History, User Profile CRUD). |
| 4 | `backend/simulator.py` | **Dibuat** | Script pengirim telemetri tiruan untuk validasi end-to-end tanpa menunggu kedatangan perangkat fisik. |
| 5 | `backend/test_system.py` | **Dibuat** | Automated integration test suite untuk memvalidasi seluruh fungsionalitas backend, otentikasi token, validasi schema, dan inferensi ML. |
| 6 | `src/lib/api.js` | **Diperbarui** | Mengganti seluruh mock data dengan request HTTP aktual ke endpoint FastAPI backend. |
| 7 | `src/app/(dashboard)/dashboard/page.jsx` | **Diperbarui** | Menambahkan polling telemetry, indikator badge `Sensor Fisik (IoT)` vs `Data Simulasi`, serta peringatan data kedaluwarsa. |
| 8 | `src/app/(dashboard)/history/page.jsx` | **Diperbarui** | Menghubungkan tabel riwayat ke database backend dengan pagination, search, dan modal detail. |
| 9 | `src/components/prediction/PredictionForm.jsx` | **Diperbarui** | Menambahkan tombol integrasi satu-klik: "Isi Otomatis dari Sensor & Profil" untuk kemudahan skrining. |
| 10 | `src/components/prediction/PredictionResult.jsx` | **Diperbarui** | Menampilkan visualisasi distribusi probabilitas kelas nyata dari Logistic Regression (`predict_proba`). |
| 11 | `docs/IoT-INTEGRATION.md` | **Dibuat** | Panduan arsitektur hardware, format payload, spesifikasi pin/sensor, kalibrasi, dan firmware ESP32 C++ siap flash. |
| 12 | `.env.example` | **Dibuat** | Contoh konfigurasi variabel lingkungan aman tanpa membocorkan secret asli. |
| 13 | `README.md` | **Diperbarui** | Panduan komprehensif menjalankan frontend, backend, simulator, dan testing. |

---

## C. Arsitektur Final

```
+-----------------------------------------------------------------------------------+
|                            ALIRAN DATA END-TO-END                                 |
+-----------------------------------------------------------------------------------+

[ Modul Sensor Fisik / Simulator ]
 (PMS5003, MQ-7, MiCS-2714, ME2-SO2, MQ-131, DHT22)
                 │
                 │ HTTP POST /sensor/readings
                 │ Headers: Content-Type: application/json, X-Device-Token: <secret>
                 ▼
[ FastAPI Backend Ingestion Engine ]
   ├── 1. Validasi Autentikasi Token (verify_device_token)
   ├── 2. Validasi Batas & Rentang Nilai Numerik (Pydantic SensorReadingsPayload)
   └── 3. Update Status & Waktu Terakhir Komunikasi Perangkat (devices table)
                 │
                 ▼
[ Database Permanen (SQLite / Supabase PostgreSQL) ]
   ├── sensor_readings (Time-series data kualitas udara)
   ├── devices (Metadata perangkat & status koneksi)
   ├── user_profiles (Karakteristik demografis & kesehatan individu)
   └── predictions (Riwayat skrining risiko AI)
                 │
                 ▼
[ Pipeline Machine Learning (12 Fitur) ]
   ├── 8 Fitur Kualitas Udara (PM2.5, PM10, SO2, NO2, CO, O3, Suhu, Kelembaban)
   ├── 4 Fitur Karakteristik Individu (Usia, Riwayat Asma, Status Merokok, Durasi Paparan)
   ├── StandardScaler Preprocessing (Pipeline sklearn)
   └── Logistic Regression Classifier -> Output: Kelas (0/1/2) & Probabilitas Riil
                 │
                 ▼
[ Next.js Frontend Dashboard ]
   ├── Dashboard: Nilai real-time, grafik tren, badge status IoT/Simulasi
   ├── Monitoring: Parameter sensor individual & status kesehatan modul
   ├── Devices: Status online/offline perangkat
   ├── Prediction: Form interaktif + fitur auto-fill dari sensor IoT
   └── History: Riwayat pemeriksaan tersimpan
```

---

## D. Struktur Database

### 1. Tabel `devices`
* `id`: SERIAL PRIMARY KEY
* `device_id`: VARCHAR(64) UNIQUE NOT NULL (Contoh: `RSH-ESP32-001`)
* `name`: VARCHAR(128) NOT NULL
* `device_code`: VARCHAR(64) (`ESP32-WROOM-32E`)
* `location`: VARCHAR(255) (`Ruang Utama`)
* `status`: VARCHAR(32) (`online` / `offline` / `maintenance`)
* `last_seen`: TIMESTAMPTZ
* `ip_address`, `mac_address`, `firmware_version`, `wifi_ssid`, `signal_strength`

### 2. Tabel `sensor_readings`
* `id`: SERIAL PRIMARY KEY
* `device_id`: VARCHAR(64) REFERENCES `devices(device_id)` ON DELETE CASCADE
* `timestamp`: TIMESTAMPTZ NOT NULL
* `pm2_5`, `pm10`, `so2`, `no2`, `co`, `o3`, `temperature`, `humidity`: NUMERIC dengan CHECK constraint rentang fisik
* `source`: VARCHAR(32) (`'iot'` atau `'simulation'`)
* `created_at`: TIMESTAMPTZ NOT NULL

### 3. Tabel `user_profiles`
* `id`: VARCHAR(64) PRIMARY KEY (`user-001`)
* `name`: VARCHAR(128)
* `age`: INTEGER CHECK (`age BETWEEN 1 AND 120`)
* `asthma_history`: BOOLEAN
* `smoking_status`: VARCHAR(32) (`'never'`, `'former'`, `'active'`)
* `outdoor_exposure`: NUMERIC(4,1) CHECK (`outdoor_exposure BETWEEN 0 AND 24`)

### 4. Tabel `predictions`
* `id`: VARCHAR(64) PRIMARY KEY (e.g. `pred-1729558800-abc123`)
* `sensor_reading_id`: INTEGER REFERENCES `sensor_readings(id)`
* `user_profile_id`: VARCHAR(64) REFERENCES `user_profiles(id)`
* `risk_class`: INTEGER CHECK (`risk_class IN (0, 1, 2)`)
* `risk_label`: VARCHAR(32) (`'Rendah'`, `'Sedang'`, `'Tinggi'`)
* `prob_low`, `prob_medium`, `prob_high`: NUMERIC(5,4) (probabilitas riil dari model)
* `model_version`: VARCHAR(64)
* `input_features`: TEXT/JSONB (audit trail 12 fitur)
* `created_at`: TIMESTAMPTZ NOT NULL

---

## E. Spesifikasi API Backend

| Endpoint | Metode | Autentikasi | Fungsi Utama |
|---|---|---|---|
| `GET /health` | GET | Bebas | Status server, status database, status model ML |
| `GET /model-status` | GET | Bebas | Rincian arsitektur model, daftar 12 fitur, kelas target |
| `POST /sensor/readings` | POST | `X-Device-Token` | Ingesti telemetri IoT sensor dengan validasi ketat |
| `GET /sensor/latest` | GET | Bebas | Mengambil pembacaan sensor terakhir & deteksi data kedaluwarsa |
| `GET /sensor/history` | GET | Bebas | Riwayat time-series dengan rentang `24h`, `7d`, `30d` |
| `GET /sensor/trends` | GET | Bebas | Delta perubahan polutan dibanding pembacaan sebelumnya |
| `GET /sensor/status` | GET | Bebas | Status modul fisik individual (PMS5003, MQ-7, dsb.) |
| `GET /devices` | GET | Bebas | Daftar stasiun monitoring & status online real-time |
| `GET /devices/{id}` | GET | Bebas | Rincian perangkat dan koneksi Wi-Fi |
| `GET /devices/{id}/activity` | GET | Bebas | Log aktivitas penerimaan data perangkat |
| `POST /predict` | POST | Bebas | Inferensi skrining risiko AI (12 fitur) & penyimpanan hasil ke DB |
| `GET /predictions` | GET | Bebas | Riwayat skrining dengan filter level risiko dan pencarian |
| `GET /predictions/{id}` | GET | Bebas | Detail spesifik hasil skrining termasuk probabilitas kelas |
| `GET /user/profile` | GET | Bebas | Mengambil profil pengguna untuk personalisasi skrining |
| `PUT /user/profile` | PUT | Bebas | Memperbarui profil personal di database |
| `GET /system/status` | GET | Bebas | Rangkuman telemetri sistem untuk header dashboard |

---

## F. Hasil Pengujian Sistem (Automated Integration Tests)

Pengujian dieksekusi menggunakan script otomatis `backend/test_system.py` terhadap backend FastAPI live:

| Test Case | Expected Result | Actual Result | Status | Bukti / Log |
|---|---|---|---|---|
| **TC-01: Health Check** | HTTP 200, DB connected, model loaded | HTTP 200, status: healthy, database: connected, model_loaded: true | **PASS** | `test_01_health_check` |
| **TC-02: Model Metadata** | HTTP 200, 12 fitur terdaftar, tipe Logistic Regression | HTTP 200, 12 fitur lengkap, model: Logistic Regression | **PASS** | `test_02_model_status` |
| **TC-03: Ingest Tanpa Token** | HTTP 401 Unauthorized | HTTP 401: "Header autentikasi perangkat (X-Device-Token) diperlukan." | **PASS** | `test_03_sensor_ingestion_unauthorized` |
| **TC-04: Ingest Token Salah** | HTTP 401 Unauthorized | HTTP 401: "Token autentikasi perangkat tidak valid." | **PASS** | `test_04_sensor_ingestion_invalid_token` |
| **TC-05: Validasi Nilai Sensor** | HTTP 422 Unprocessable Entity saat nilai negatif/out-of-range | HTTP 422: Input should be greater than or equal to 0 | **PASS** | `test_05_sensor_ingestion_validation_reject_invalid` |
| **TC-06: Ingest Telemetri Valid** | HTTP 201 Created, tersimpan di database | HTTP 201, reading_id dihasilkan, tersimpan di DB | **PASS** | `test_06_sensor_ingestion_valid_persistence` |
| **TC-07: Telemetri Terkini** | HTTP 200, mengembalikan data yang baru di-ingest | HTTP 200, deviceId: RSH-ESP32-001, PM2.5 cocok | **PASS** | `test_07_sensor_latest_retrieval` |
| **TC-08: Riwayat Time-Series** | HTTP 200, array data berurutan | HTTP 200, mengembalikan data historis tersaring | **PASS** | `test_08_sensor_history` |
| **TC-09: Kalkulasi Tren** | HTTP 200, delta nilai numerik | HTTP 200, delta PM2.5, PM10, suhu terhitung | **PASS** | `test_09_sensor_trends` |
| **TC-10: Status Online Device** | HTTP 200, device status beralih online | HTTP 200, device RSH-ESP32-001 berstatus online | **PASS** | `test_10_devices_list_and_status` |
| **TC-11: Inferensi ML 12-Fitur** | HTTP 200, kelas risiko valid (0,1,2), probabilitas ~1.0 | HTTP 200, risk_class: 0, probabilitas: low 0.84, med 0.15, high 0.01 | **PASS** | `test_11_ml_predict_success` |
| **TC-12: Tolak Prediksi Parsial** | HTTP 422 saat fitur personal (Usia/Asma/Rokok) kosong | HTTP 422 Unprocessable Entity, tidak ada data buatan | **PASS** | `test_12_ml_predict_reject_missing_feature` |
| **TC-13: Riwayat Prediksi DB** | HTTP 200, riwayat tersimpan diambil dari DB | HTTP 200, data riwayat cocok dengan audit trail | **PASS** | `test_13_predictions_history` |
| **TC-14: User Profile CRUD** | HTTP 200, profil diperbarui di database | HTTP 200, nama & paparan outdoor tersimpan | **PASS** | `test_14_user_profile_crud` |
| **TC-15: System Status Summary** | HTTP 200, ringkasan telemetri akurat | HTTP 200, databaseConnected: true, modelLoaded: true | **PASS** | `test_15_system_summary` |
| **TC-16: Next.js Production Build** | Build berhasil tanpa error lint/type | Turbopack build sukses dalam 7.7s (10/10 halaman statis) | **PASS** | `npm run build` |

---

## G. Status Kesiapan IoT

### 1. Yang Sudah Diimplementasikan & Teruji
* ✅ Endpoint penerimaan sensor `/sensor/readings` dengan otentikasi token.
* ✅ Skema validasi data fisik sensor dengan batas min/max realistis.
* ✅ Penyimpanan database time-series otomatis.
* ✅ Deteksi otomatis perangkat online (< 5 menit) dan offline (> 5 menit).
* ✅ Peringatan data kedaluwarsa pada antarmuka dashboard jika sensor mati > 15 menit.
* ✅ Script simulator telemetri (`simulator.py`) yang menguji transmisi data berulang secara mulus.
* ✅ Pemisahan label sumber data yang jelas (`Sensor Fisik (IoT)` vs `Data Simulasi`).

### 2. Yang Belum Diuji dengan Hardware Fisik
* ⏳ Flash program C++ ke mikrokontroler fisik ESP32 asli.
* ⏳ Pengujian fisik kestabilan sinyal Wi-Fi di lokasi penempatan.
* ⏳ Kalibrasi kurva analog sensor elektrokimia gas (MQ-7, MiCS-2714, MQ-131).

### 3. Informasi Hardware yang Masih Dibutuhkan
* Model spesifik board ESP32 yang akan digunakan (misal: ESP32 DevKit V1 30-pin vs 38-pin).
* Pinout wiring aktual yang disepakati untuk jalur UART PMS5003 dan pin ADC sensor gas.
* Ketersediaan modul ADC eksternal (seperti ADS1115) jika ADC internal ESP32 dinilai terlalu bising (*noisy*).

---

## H. Panduan Menjalankan Sistem

### 1. Menjalankan Backend (FastAPI)
```powershell
# Masuk ke folder backend
cd "backend"

# Jalankan uvicorn server
py -3.14 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Menjalankan Frontend (Next.js)
```powershell
# Di root project
npm run dev
```

### 3. Menjalankan Simulator IoT
```powershell
# Kirim 5 paket telemetri cepat (mode burst)
py -3.14 backend/simulator.py --burst 5

# Atau streaming kontinu setiap 5 detik
py -3.14 backend/simulator.py --interval 5

# Atau simulasi lonjakan polusi ekstrem
py -3.14 backend/simulator.py --interval 5 --anomaly
```

### 4. Menjalankan Automated Test Suite
```powershell
py -3.14 backend/test_system.py
```

---

## I. Pekerjaan Tersisa untuk Fase Produksi Hardware
1. **Perakitan Hardware**: Menghubungkan modul sensor ke ESP32 sesuai pinout yang ditentukan.
2. **Flash Firmware**: Mengunggah kode C++ dari `docs/IoT-INTEGRATION.md` menggunakan Arduino IDE atau PlatformIO dengan memasukkan SSID & password Wi-Fi lokal.
3. **Deployment HTTPS**: Menggunakan reverse proxy (Caddy / Nginx) dengan sertifikat SSL/TLS sebelum membuka endpoint API ke jaringan internet publik.
