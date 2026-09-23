'use client';

import RiskBadge from './RiskBadge';
import { RISK_LEVELS, AQ_THRESHOLDS, ENV_THRESHOLDS } from '@/lib/config';
import { SMOKING_LABELS } from '@/lib/mock-data';
import { RotateCcw, Clock, Info } from 'lucide-react';

export default function PredictionResult({ result, onReset }) {
  if (!result) return null;

  const riskInfo = RISK_LEVELS[result.riskLevel];
  const { userInput, airQuality } = result;

  return (
    <div className="space-y-4 mt-6">
      {/* Main Result */}
      <div className={`bg-surface border border-border rounded-xl p-5 sm:p-6`}>
        <div className="flex flex-col items-center text-center mb-5">
          <p className="text-sm text-muted mb-3 uppercase tracking-wide">Hasil Klasifikasi Risiko</p>
          <RiskBadge riskLevel={result.riskLevel} size="lg" />
          <p className="text-sm text-muted mt-3 max-w-md">{riskInfo.description}</p>

          {result.predictionScore && (
            <p className="text-xs text-muted-foreground mt-2">
              Skor kepercayaan: {(result.predictionScore * 100).toFixed(0)}%
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {new Date(result.createdAt).toLocaleString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>

        {/* Summary grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
          {/* User data summary */}
          <div>
            <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Data Pengguna</h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Usia</span>
                <span className="text-foreground font-medium">{userInput.age} tahun</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Riwayat Asma</span>
                <span className="text-foreground font-medium">{userInput.asthmaHistory ? 'Ya' : 'Tidak'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status Merokok</span>
                <span className="text-foreground font-medium">{SMOKING_LABELS[userInput.smokingStatus] || userInput.smokingStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Paparan Outdoor</span>
                <span className="text-foreground font-medium">{userInput.outdoorExposure} jam/hari</span>
              </div>
            </div>
          </div>

          {/* Air quality summary */}
          <div>
            <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Kualitas Udara</h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">PM2.5</span>
                <span className="text-foreground font-medium">{airQuality.pm25} {AQ_THRESHOLDS.pm25.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">PM10</span>
                <span className="text-foreground font-medium">{airQuality.pm10} {AQ_THRESHOLDS.pm10.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">CO</span>
                <span className="text-foreground font-medium">{airQuality.co} {AQ_THRESHOLDS.co.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Suhu</span>
                <span className="text-foreground font-medium">{airQuality.temperature} {ENV_THRESHOLDS.temperature.unit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 bg-surface-secondary border border-border rounded-xl p-4">
        <Info className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted leading-relaxed">
          Hasil ini merupakan klasifikasi risiko berbasis data dan bukan diagnosis medis.
          Konsultasikan dengan tenaga kesehatan untuk evaluasi lebih lanjut.
        </p>
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted bg-surface border border-border rounded-xl hover:text-foreground hover:border-border-hover transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Prediksi Ulang
      </button>
    </div>
  );
}
