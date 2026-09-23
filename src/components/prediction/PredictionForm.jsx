'use client';

import { useState } from 'react';
import { User, Wind, Loader2 } from 'lucide-react';
import { validateField, VALIDATION_RULES, AQ_THRESHOLDS, ENV_THRESHOLDS } from '@/lib/config';

const INITIAL_FORM = {
  age: '',
  asthmaHistory: '',
  smokingStatus: '',
  outdoorExposure: '',
  pm25: '',
  pm10: '',
  so2: '',
  no2: '',
  co: '',
  o3: '',
  temperature: '',
  humidity: '',
};

export default function PredictionForm({ onSubmit, isLoading }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validateForm() {
    const newErrors = {};

    // User data
    const ageErr = validateField('age', form.age);
    if (ageErr) newErrors.age = ageErr;

    if (!form.asthmaHistory) newErrors.asthmaHistory = 'Riwayat Asma wajib dipilih.';
    if (!form.smokingStatus) newErrors.smokingStatus = 'Status Merokok wajib dipilih.';

    const exposureErr = validateField('outdoorExposure', form.outdoorExposure);
    if (exposureErr) newErrors.outdoorExposure = exposureErr;

    // Air quality
    const aqFields = ['pm25', 'pm10', 'so2', 'no2', 'co', 'o3', 'temperature', 'humidity'];
    aqFields.forEach((field) => {
      const err = validateField(field, form[field]);
      if (err) newErrors[field] = err;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const parsed = {
      age: Number(form.age),
      asthmaHistory: form.asthmaHistory === 'yes',
      smokingStatus: form.smokingStatus,
      outdoorExposure: Number(form.outdoorExposure),
      pm25: Number(form.pm25),
      pm10: Number(form.pm10),
      so2: Number(form.so2),
      no2: Number(form.no2),
      co: Number(form.co),
      o3: Number(form.o3),
      temperature: Number(form.temperature),
      humidity: Number(form.humidity),
    };

    onSubmit(parsed);
  }

  function renderField(field, label, unit, type = 'number', options = null) {
    const error = errors[field];
    const rule = VALIDATION_RULES[field];

    if (options) {
      return (
        <div>
          <label htmlFor={`field-${field}`} className="block text-sm font-medium text-foreground mb-1.5">
            {label} <span className="text-risk-high">*</span>
          </label>
          <select
            id={`field-${field}`}
            value={form[field]}
            onChange={(e) => handleChange(field, e.target.value)}
            className={`w-full px-3 py-2.5 bg-surface border rounded-lg text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
              error ? 'border-risk-high' : 'border-border hover:border-border-hover'
            }`}
          >
            <option value="">Pilih...</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {error && <p className="text-xs text-risk-high mt-1">{error}</p>}
        </div>
      );
    }

    return (
      <div>
        <label htmlFor={`field-${field}`} className="block text-sm font-medium text-foreground mb-1.5">
          {label} {unit && <span className="text-muted font-normal">({unit})</span>} <span className="text-risk-high">*</span>
        </label>
        <input
          id={`field-${field}`}
          type="number"
          value={form[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={rule ? `${rule.min} — ${rule.max}` : ''}
          min={rule?.min}
          max={rule?.max}
          step="any"
          className={`w-full px-3 py-2.5 bg-surface border rounded-lg text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
            error ? 'border-risk-high' : 'border-border hover:border-border-hover'
          }`}
        />
        {error && <p className="text-xs text-risk-high mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Section A: User Data */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Data Pengguna</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderField('age', 'Usia', 'tahun')}
          {renderField('asthmaHistory', 'Riwayat Asma', null, 'select', [
            { value: 'yes', label: 'Ya' },
            { value: 'no', label: 'Tidak' },
          ])}
          {renderField('smokingStatus', 'Status Merokok', null, 'select', [
            { value: 'never', label: 'Tidak Pernah' },
            { value: 'former', label: 'Mantan Perokok' },
            { value: 'active', label: 'Perokok Aktif' },
          ])}
          {renderField('outdoorExposure', 'Durasi Paparan Outdoor', 'jam/hari')}
        </div>
      </div>

      {/* Section B: Air Quality */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Wind className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Kondisi Kualitas Udara</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderField('pm25', 'PM2.5', AQ_THRESHOLDS.pm25.unit)}
          {renderField('pm10', 'PM10', AQ_THRESHOLDS.pm10.unit)}
          {renderField('so2', 'SO₂', AQ_THRESHOLDS.so2.unit)}
          {renderField('no2', 'NO₂', AQ_THRESHOLDS.no2.unit)}
          {renderField('co', 'CO', AQ_THRESHOLDS.co.unit)}
          {renderField('o3', 'O₃', AQ_THRESHOLDS.o3.unit)}
          {renderField('temperature', 'Suhu Udara', ENV_THRESHOLDS.temperature.unit)}
          {renderField('humidity', 'Kelembapan Udara', ENV_THRESHOLDS.humidity.unit)}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Memproses...
          </>
        ) : (
          'Tentukan Risiko'
        )}
      </button>

      {Object.keys(errors).length > 0 && (
        <p className="text-sm text-risk-high mt-3">
          Terdapat {Object.keys(errors).length} field yang perlu diperbaiki.
        </p>
      )}
    </form>
  );
}
