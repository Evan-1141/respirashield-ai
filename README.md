# 🫁 RespiraShield AI — Pemantauan Kualitas Udara & Skrining Risiko Pernapasan

RespiraShield AI adalah aplikasi end-to-end terintegrasi untuk pemantauan kualitas udara multi-sensor dan skrining tingkat risiko gangguan pernapasan, ditenagai oleh model **Machine Learning (Logistic Regression 12-Fitur)**, **Backend Ingesti IoT (FastAPI)**, **Database Time-Series (SQLite / Supabase PostgreSQL)**, dan **Frontend Web Modern (Next.js 16)**.

> **Catatan Penting**: Aplikasi ini berfungsi sebagai instrumen **skrining/klasifikasi risiko awal** (*risk screening*), **BUKAN** alat diagnosis medis pengganti tenaga kesehatan profesional.

---

## 🏗️ Arsitektur Sistem

```
[ Sensor IoT / Simulator ]
 (PMS5003, MQ-7, MiCS-2714, ME2-SO2, MQ-131, DHT22)
       │
       │ HTTP POST /sensor/readings (Header X-Device-Token)
       ▼
[ FastAPI Backend Ingestion API ] (Port 8000)
       │
       ├──► [ Database Permanen (SQLite / Supabase PostgreSQL) ]
       │      ├── devices
       │      ├── sensor_readings
       │      ├── predictions
       │      └── user_profiles
       │
       ├──► [ Model ML Logistic Regression (12 Fitur) ]
       │      ├── 8 Fitur Sensor Lingkungan
       │      └── 4 Fitur Karakteristik Individu
       │
       ▼
[ Next.js Frontend Dashboard ] (Port 3000)
```

---

## 🚀 Cara Menjalankan Proyek

Proyek ini terdiri dari dua komponen utama yang berjalan bersamaan:

### 1. Menjalankan Backend (FastAPI)
Buka terminal pertama:
```powershell
# 1. Pindah ke direktori backend
cd backend

# 2. Jalankan server FastAPI dengan Python
py -3.14 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
* **API URL**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
* **Dokumentasi Interaktif (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Status Layanan**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### 2. Menjalankan Frontend (Next.js)
Buka terminal kedua di root project:
```powershell
# 1. Pastikan dependensi node sudah terpasang
npm install

# 2. Jalankan server pengembangan
npm run dev
```
* **Aplikasi Web**: [http://localhost:3000](http://localhost:3000)
* **Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
* **Prediksi Risiko**: [http://localhost:3000/prediction](http://localhost:3000/prediction)
* **Monitoring Sensor**: [http://localhost:3000/monitoring](http://localhost:3000/monitoring)
* **Riwayat**: [http://localhost:3000/history](http://localhost:3000/history)
* **Perangkat**: [http://localhost:3000/devices](http://localhost:3000/devices)

---

### 3. Menjalankan Simulator IoT (Opsional)
Simulator mengirimkan data sensor tiruan yang realistis untuk menguji transmisi telemetri tanpa perangkat fisik:
```powershell
# Mode burst: kirim 5 data seketika
py -3.14 backend/simulator.py --burst 5

# Mode streaming: kirim kontinu setiap 5 detik
py -3.14 backend/simulator.py --interval 5

# Mode lonjakan polusi ekstrem (uji kenaikan risiko)
py -3.14 backend/simulator.py --interval 5 --anomaly
```

---

### 4. Menjalankan Pengujian Otomatis (Test Suite)
Untuk memvalidasi integritas 15 pengujian sistem secara otomatis:
```powershell
py -3.14 backend/test_system.py
```

---

## 🗄️ Database & Migrasi
* **SQLite (Default Lokal)**: Tersimpan otomatis di `backend/respirashield.db` tanpa perlu konfigurasi tambahan.
* **Supabase PostgreSQL (Produksi)**:
  * File migrasi DDL lengkap tersedia di: [`backend/database/schema.sql`](file:///docs/IoT-INTEGRATION.md).
  * Masukkan connection string ke file `.env`:
    ```env
    DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
    ```

---

## 📚 Dokumentasi Teknis
* [**Panduan Integrasi Hardware IoT & Firmware ESP32**](file:///docs/IoT-INTEGRATION.md) — Spesifikasi sensor, siklus pemanasan MQ-7, skema JSON, dan program C++ siap flash.
* [**Laporan Pembaruan Teknis & Hasil Testing QA**](file:///docs/UPDATE-REPORT.md) — Matriks pengujian, arsitektur, dan status kesiapan IoT.
* [**Contoh Konfigurasi Lingkungan**](file:///.env.example) — Variabel konfigurasi server, database, dan token autentikasi.
