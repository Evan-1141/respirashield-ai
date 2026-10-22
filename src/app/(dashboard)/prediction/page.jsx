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
    setResult(null);
    setError(null);
    try {
      const prediction = await predictRisk(formData);
      setResult(prediction);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan tidak terduga.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Header
        title="Prediksi Risiko Pernapasan"
        subtitle="Masukkan data untuk mendapatkan klasifikasi risiko gangguan pernapasan."
      />

      {error && (
        <div className="bg-risk-high/10 border border-risk-high text-risk-high px-4 py-3 rounded-lg mb-4">
          <p className="text-sm font-medium">{error}</p>
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
