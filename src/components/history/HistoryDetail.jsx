'use client';

import RiskBadge from '@/components/prediction/RiskBadge';
import { SMOKING_LABELS } from '@/lib/mock-data';
import { AQ_THRESHOLDS, ENV_THRESHOLDS } from '@/lib/config';
import { Clock, User, Wind, X } from 'lucide-react';

export default function HistoryDetail({ record, onClose }) {
  if (!record) return null;

  const { userInput, airQuality } = record;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-center mb-5">
        <RiskBadge riskLevel={record.riskLevel} size="lg" />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center mb-5">
        <Clock className="w-3.5 h-3.5" />
        <span>
          {new Date(record.createdAt).toLocaleString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </span>
      </div>

      {record.predictionScore && (
        <p className="text-xs text-center text-muted-foreground mb-4">
          Skor kepercayaan: {(record.predictionScore * 100).toFixed(0)}%
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* User Data */}
        <div className="bg-surface-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Data Pengguna</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Usia</span><span className="font-medium text-foreground">{userInput.age} tahun</span></div>
            <div className="flex justify-between"><span className="text-muted">Riwayat Asma</span><span className="font-medium text-foreground">{userInput.asthmaHistory ? 'Ya' : 'Tidak'}</span></div>
            <div className="flex justify-between"><span className="text-muted">Status Merokok</span><span className="font-medium text-foreground">{SMOKING_LABELS[userInput.smokingStatus] || userInput.smokingStatus}</span></div>
            <div className="flex justify-between"><span className="text-muted">Paparan Outdoor</span><span className="font-medium text-foreground">{userInput.outdoorExposure} jam/hari</span></div>
          </div>
        </div>

        {/* Air Quality Data */}
        <div className="bg-surface-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wind className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Kualitas Udara</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">PM2.5</span><span className="font-medium text-foreground">{airQuality.pm25} {AQ_THRESHOLDS.pm25.unit}</span></div>
            <div className="flex justify-between"><span className="text-muted">PM10</span><span className="font-medium text-foreground">{airQuality.pm10} {AQ_THRESHOLDS.pm10.unit}</span></div>
            <div className="flex justify-between"><span className="text-muted">CO</span><span className="font-medium text-foreground">{airQuality.co} {AQ_THRESHOLDS.co.unit}</span></div>
            <div className="flex justify-between"><span className="text-muted">NO₂</span><span className="font-medium text-foreground">{airQuality.no2} {AQ_THRESHOLDS.no2.unit}</span></div>
            <div className="flex justify-between"><span className="text-muted">SO₂</span><span className="font-medium text-foreground">{airQuality.so2} {AQ_THRESHOLDS.so2.unit}</span></div>
            <div className="flex justify-between"><span className="text-muted">O₃</span><span className="font-medium text-foreground">{airQuality.o3} {AQ_THRESHOLDS.o3.unit}</span></div>
            <div className="flex justify-between"><span className="text-muted">Suhu</span><span className="font-medium text-foreground">{airQuality.temperature} {ENV_THRESHOLDS.temperature.unit}</span></div>
            <div className="flex justify-between"><span className="text-muted">Kelembapan</span><span className="font-medium text-foreground">{airQuality.humidity} {ENV_THRESHOLDS.humidity.unit}</span></div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center italic">
        Klasifikasi risiko berbasis data, bukan diagnosis medis.
      </p>
    </div>
  );
}
