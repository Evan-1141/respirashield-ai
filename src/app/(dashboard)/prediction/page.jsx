'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import PredictionForm from '@/components/prediction/PredictionForm';
import PredictionResult from '@/components/prediction/PredictionResult';
import { predictRisk } from '@/lib/api';

export default function PredictionPage() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(formData) {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const prediction = await predictRisk(formData);
      setResult(prediction);
    } catch (err) {
      console.error('Prediction failed:', err);
      setError(err.message || 'Terjadi kesalahan saat memproses prediksi.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Header
        title="Prediksi Risiko Pernapasan"
        subtitle="Masukkan data untuk mendapatkan klasifikasi risiko gangguan pernapasan."
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium">Gagal Melakukan Prediksi</p>
            <p className="mt-1 text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      {!result ? (
        <PredictionForm onSubmit={handleSubmit} isLoading={isLoading} />
      ) : (
        <PredictionResult result={result} onReset={handleReset} />
      )}
    </div>
  );
}
