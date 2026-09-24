from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd

app = FastAPI(
    title="RespiraShield AI API",
    description="API untuk klasifikasi risiko gangguan pernapasan",
    version="1.0.0"
)

# Middleware sambungin ke nextjs
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model Logistic Regression
model = joblib.load("model/respirashield_model.pkl")


# =========================================================
# INPUT MODEL
# =========================================================

class PredictionInput(BaseModel):
    PM2_5: float
    PM10: float
    SO2: float
    NO2: float
    CO: float
    O3: float
    Suhu_Udara: float
    Kelembaban_Udara: float
    Usia: int
    Riwayat_Asma: int
    Status_Merokok: int
    Durasi_Paparan_Outdoor: float


# =========================================================
# LABEL RISIKO
# =========================================================

risk_labels = {
    0: "Rendah",
    1: "Sedang",
    2: "Tinggi"
}


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "RespiraShield AI API aktif"
    }


# =========================================================
# MODEL STATUS
# =========================================================

@app.get("/model-status")
def model_status():
    return {
        "model": "Logistic Regression",
        "status": "loaded"
    }


# =========================================================
# PREDICTION
# =========================================================

@app.post("/predict")
def predict(data: PredictionInput):

    input_data = pd.DataFrame([{
        "PM2.5": data.PM2_5,
        "PM10": data.PM10,
        "SO2": data.SO2,
        "NO2": data.NO2,
        "CO": data.CO,
        "O3": data.O3,
        "Suhu_Udara": data.Suhu_Udara,
        "Kelembaban_Udara": data.Kelembaban_Udara,
        "Usia": data.Usia,
        "Riwayat_Asma": data.Riwayat_Asma,
        "Status_Merokok": data.Status_Merokok,
        "Durasi_Paparan_Outdoor": data.Durasi_Paparan_Outdoor
    }])

    prediction = int(model.predict(input_data)[0])

    return {
        "risk_class": prediction,
        "risk_label": risk_labels[prediction]
    }