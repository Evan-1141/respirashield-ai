'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import PredictionForm from '@/components/prediction/PredictionForm';
import PredictionResult from '@/components/prediction/PredictionResult';
import { predictRisk } from '@/lib/api';

export default function PredictionPage() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData) {
    setIsLoading(true);
    setResult(null);
    try {
      const prediction = await predictRisk(formData);
      setResult(prediction);
    } catch (err) {
      console.error('Prediction failed:', err);
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

      {!result ? (
        <PredictionForm onSubmit={handleSubmit} isLoading={isLoading} />
      ) : (
        <PredictionResult result={result} onReset={handleReset} />
      )}
    </div>
  );
}
