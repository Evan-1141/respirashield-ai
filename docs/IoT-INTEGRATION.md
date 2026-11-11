# 📡 Panduan Integrasi Hardware IoT — RespiraShield AI

Dokumen ini merupakan spesifikasi teknis dan panduan integrasi sistem antarmuka antara stasiun mikrokontroler IoT fisik (ESP32) dan backend server **RespiraShield AI**.

---

## 1. Arsitektur Komunikasi IoT ke Backend

RespiraShield AI menggunakan arsitektur modular berbasis **HTTP REST Ingestion**:

```
[ Sensor Modul ] (PMS5003, MQ-7, MiCS-2714, ME2-SO2, MQ-131, DHT22)
       │ (ADC / UART / I2C / GPIO)
       ▼
[ Mikrokontroler ESP32 ] (ADC Calibration, Noise Filtering, Sampling)
       │
       │ Wi-Fi / HTTP POST (X-Device-Token Header)
       ▼
[ FastAPI Backend Ingestion API ] (Port 8000: /sensor/readings)
       │ (Pydantic Schema Validation & Token Auth)
       ▼
[ Database Permanen (SQLite / Supabase PostgreSQL) ]
       │
       ├──► [ Logistic Regression ML Model (12 Fitur) ]
       └──► [ Next.js Web Dashboard (Port 3000) ]
```

---

## 2. Kontrak API Ingestion Sensor

### Endpoint
* **Metode**: `POST`
* **Path**: `/sensor/readings`
* **Base URL**: `http://<IP_SERVER_BACKEND>:8000` (atau domain HTTPS saat produksi)

### Header Wajib
| Nama Header | Tipe | Contoh Nilai | Deskripsi |
|---|---|---|---|
| `Content-Type` | string | `application/json` | Format pengiriman data |
| `X-Device-Token` | string | `respirashield-secret-token-2026` | Kunci autentikasi perangkat (dikonfigurasi di server via `.env`) |

### Format Payload JSON
```json
{
  "device_id": "RSH-ESP32-001",
  "timestamp": "2026-10-22T08:30:00Z",
  "source": "iot",
  "readings": {
    "PM2_5": 28.4,
    "PM10": 46.2,
    "SO2": 6.8,
    "NO2": 21.5,
    "CO": 0.48,
    "O3": 31.0,
    "Suhu_Udara": 28.5,
    "Kelembaban_Udara": 67.2
  }
}
```

### Penjelasan Field
| Parameter | Tipe Data | Rentang Valid | Satuan | Deskripsi |
|---|---|---|---|---|
| `device_id` | string | 3-64 karakter | - | ID unik stasiun monitoring |
| `timestamp` | string ISO 8601 | Opsional (default: waktu server) | UTC | Waktu pembacaan sensor |
| `source` | string | `"iot"` atau `"simulation"` | - | Penanda keabsahan data fisik vs simulator |
| `PM2_5` | float | 0.0 - 1000.0 | µg/m³ | Particulate matter diameter ≤ 2.5 µm |
| `PM10` | float | 0.0 - 1000.0 | µg/m³ | Particulate matter diameter ≤ 10 µm |
| `SO2` | float | 0.0 - 500.0 | µg/m³ | Sulfur Dioksida |
| `NO2` | float | 0.0 - 500.0 | µg/m³ | Nitrogen Dioksida |
| `CO` | float | 0.0 - 100.0 | mg/m³ | Karbon Monoksida |
| `O3` | float | 0.0 - 500.0 | µg/m³ | Ozon |
| `Suhu_Udara` | float | -20.0 - 70.0 | °C | Suhu lingkungan sekitar |
| `Kelembaban_Udara` | float | 0.0 - 100.0 | % | Kelembaban relatif udara |

### Contoh Response Berhasil (HTTP 201 Created)
```json
{
  "status": "success",
  "message": "Pembacaan sensor berhasil disimpan ke database.",
  "reading_id": 142,
  "device_id": "RSH-ESP32-001",
  "timestamp": "2026-10-22T08:30:00.123456+00:00",
  "source": "iot"
}
```

### Contoh Response Gagal
* **401 Unauthorized** (Token tidak valid / tidak ada):
  ```json
  { "detail": "Token autentikasi perangkat tidak valid." }
  ```
* **422 Unprocessable Entity** (Nilai di luar batas fisik atau tipe salah):
  ```json
  { "detail": [{ "loc": ["body", "readings", "PM2_5"], "msg": "Input should be greater than or equal to 0" }] }
  ```

---

## 3. Spesifikasi Modul Sensor & Kalibrasi

| Parameter | Modul Hardware yang Direkomendasikan | Protokol Interface | Kebutuhan Kalibrasi & Karakteristik |
|---|---|---|---|
| **PM2.5 & PM10** | Plantower PMS5003 | UART / Serial (9600 baud) | Laser scattering optik. Perlu kipas aliran udara bebas hambatan (fan intake). Hindari terkena kondensasi uap air. |
| **CO** | MQ-7 Gas Sensor | Analog ADC / GPIO PWM | Sensor katalitik elektroda. **Wajib siklus pemanasan**: High heating (5V selama 60 detik) lalu Low measuring (1.4V selama 90 detik) untuk pembacaan akurat. |
| **NO2** | MiCS-2714 Metal Oxide | Analog ADC / I2C ADC | Sensor film semikonduktor. Memerlukan *burn-in preheating* selama 24 jam sebelum kalibrasi nol pada udara bersih (*R0 calibration*). |
| **SO2** | ME2-SO2 / Winsen Electrochemical | Analog ADC | Sensor elektrokimia. Respons linier, rentang ppm perlu dikonversi ke µg/m³ menggunakan berat molekul SO2 (64.06 g/mol). |
| **O3** | MQ-131 (Low Concentration) | Analog ADC | Sensitif terhadap ozon tingkat rendah. Perlu pre-heat ~48 jam saat pertama kali dinyalakan. |
| **Suhu & Kelembaban** | DHT22 (AM2302) | 1-Wire Digital Bus | Akurasi ±0.5°C dan ±2-5% RH. Sampling rate maksimum 0.5 Hz (1 bacaan tiap 2 detik). |

---

## 4. Rekomendasi Interval & Manajemen Koneksi

1. **Interval Sampling Sensor**:
   * Ambil sampel setiap 5 detik, lalu hitung nilai rata-rata (Moving Average) selama 30 detik untuk memfilter noise kelistrikan.
2. **Interval Pengiriman ke Server**:
   * Kirim paket data setiap **30 hingga 60 detik**. Ini menghemat konsumsi daya dan bandwidth tanpa mengurangi akurasi monitoring kualitas udara.
3. **Deteksi Status Offline**:
   * Server RespiraShield secara otomatis menandai perangkat sebagai **Offline** jika tidak ada data diterima dalam kurun waktu **5 menit**.
4. **Penanganan Kegagalan Jaringan & Retry**:
   * Jika request HTTP gagal (timeout atau Wi-Fi putus), jangan lakukan blocking loop.
   * Simpan pembacaan terakhir dalam ring buffer SPIFFS/EEPROM (maksimal 10 record) untuk dikirim saat koneksi pulih, atau lewatkan jika timestamp kadaluwarsa.

---

## 5. Kerangka Firmware ESP32 (Arduino IDE / PlatformIO)

Berikut adalah kerangka koneksi HTTP, **bukan firmware siap-flash untuk sensor fisik**. Nilai pembacaan di contoh masih konstanta demonstrasi; ganti dengan driver pembacaan sensor, kalibrasi, dan proteksi tegangan yang sesuai sebelum mengirim `source: "iot"`. Mengirim konstanta sebagai `iot` akan membuat status perangkat terlihat online secara keliru.

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// 1. Konfigurasi Jaringan & Server
const char* WIFI_SSID     = "Nama_WiFi_Anda";
const char* WIFI_PASSWORD = "Password_WiFi_Anda";
const char* SERVER_URL    = "http://192.168.1.100:8000/sensor/readings";
const char* DEVICE_TOKEN  = "respirashield-secret-token-2026";
const char* DEVICE_ID     = "RSH-ESP32-001";

// Interval pengiriman (30 detik)
const unsigned long SEND_INTERVAL_MS = 30000;
unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("[ESP32] Memulai RespiraShield Station...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[ESP32] Terhubung ke WiFi. IP: " + WiFi.localIP().toString());
}

void loop() {
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();

    if (WiFi.status() == WL_CONNECTED) {
      // 2. Baca nilai sensor (ganti dengan fungsi baca aktual pin hardware Anda)
      float pm25 = 28.5; // PMS5003
      float pm10 = 45.2; // PMS5003
      float so2  = 6.5;  // ME2-SO2
      float no2  = 22.0; // MiCS-2714
      float co   = 0.52; // MQ-7
      float o3   = 32.1; // MQ-131
      float temp = 28.7; // DHT22
      float hum  = 68.4; // DHT22

      // 3. Susun JSON Payload
      StaticJsonDocument<512> doc;
      doc["device_id"] = DEVICE_ID;
      doc["source"] = "iot"; // Penanda data fisik nyata

      JsonObject readings = doc.createNestedObject("readings");
      readings["PM2_5"] = pm25;
      readings["PM10"] = pm10;
      readings["SO2"] = so2;
      readings["NO2"] = no2;
      readings["CO"] = co;
      readings["O3"] = o3;
      readings["Suhu_Udara"] = temp;
      readings["Kelembaban_Udara"] = hum;

      String jsonPayload;
      serializeJson(doc, jsonPayload);

      // 4. Kirim HTTP POST ke Backend
      HTTPClient http;
      http.begin(SERVER_URL);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-Device-Token", DEVICE_TOKEN);

      int httpResponseCode = http.POST(jsonPayload);
      if (httpResponseCode == 201) {
        String response = http.getString();
        Serial.println("[ESP32] Data terkirim sukses: " + response);
      } else {
        Serial.printf("[ESP32] Gagal kirim. HTTP Code: %d\n", httpResponseCode);
      }
      http.end();
    } else {
      Serial.println("[ESP32] Wi-Fi terputus, mencoba menyambung ulang...");
      WiFi.reconnect();
    }
  }
}
```

---

## 6. Checklist Informasi Hardware yang Diperlukan Saat Perangkat Fisik Tiba

Saat hardware fisik siap dirakit dan disambungkan:
1. **Model Board**: Pastikan tipe board (e.g. ESP32 NodeMCU 30-pin, ESP32-S3, atau ESP32-WROOM-32D).
2. **Skema ADC**: ESP32 memiliki non-linearitas ADC pada rentang 0-0.1V dan 3.1-3.3V. Pastikan menggunakan *voltage divider* atau eksternal ADC (ADS1115 16-bit) untuk sensor gas analog.
3. **Daya (Power Supply)**: Modul gas (MQ-7, MQ-131) memerlukan arus pemanas (heater) yang cukup besar (~150-200mA per modul). Gunakan catu daya eksternal 5V 2A–3A, jangan hanya mengandalkan daya port USB laptop/PC.
4. **Uji Validasi**:
   * Kirim satu payload manual menggunakan Postman / curl dengan token `respirashield-secret-token-2026`.
   * Periksa apakah status di web dashboard seketika beralih ke badge hijau: **`Sensor Fisik (IoT)`**.
