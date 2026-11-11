'use client';

import { useState } from 'react';
import { User, Wind, Loader2, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';
import { validateField, VALIDATION_RULES, AQ_THRESHOLDS, ENV_THRESHOLDS } from '@/lib/config';
import { getAirQuality, getUserProfile } from '@/lib/api';

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
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState(null);

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

  async function handleAutoSync() {
    setSyncing(true);
    setSyncNotice(null);
    try {
      const [aq, prof] = await Promise.all([
        getAirQuality().catch(() => null),
        getUserProfile().catch(() => null),
      ]);

      const updated = { ...form };

      if (prof) {
        if (prof.age) updated.age = prof.age;
        if (prof.asthmaHistory !== undefined) updated.asthmaHistory = prof.asthmaHistory ? 'yes' : 'no';
        if (prof.smokingStatus) updated.smokingStatus = prof.smokingStatus;
        if (prof.outdoorExposure !== undefined) updated.outdoorExposure = prof.outdoorExposure;
      }

      const sensorFields = ['pm25', 'pm10', 'so2', 'no2', 'co', 'o3', 'temperature', 'humidity'];
      const hasCompletePhysicalReading = Boolean(
        aq?.available && aq?.source === 'iot' && aq?.status === 'CONNECTED'
        && sensorFields.every((field) => typeof aq[field] === 'number')
      );

      if (hasCompletePhysicalReading) {
        sensorFields.forEach((field) => { updated[field] = aq[field]; });
      }

      setForm(updated);
      if (hasCompletePhysicalReading) {
        setErrors({});
        setSyncNotice({ type: 'success', message: 'Data sensor fisik yang valid dan profil berhasil dimuat.' });
      } else {
        const message = aq?.source === 'simulation'
          ? 'Data simulasi tidak digunakan untuk prediksi. Hubungkan ESP32 dan kirim pembacaan fisik yang lengkap.'
          : 'Data sensor fisik belum tersedia atau belum lengkap. Profil diperbarui bila tersedia; nilai sensor tidak diubah.';
        setSyncNotice({ type: 'warning', message });
      }
    } catch (err) {
      console.error('Failed to sync from sensor/profile:', err);
      setSyncNotice({ type: 'warning', message: 'Gagal menghubungi backend. Data sensor tidak diubah.' });
    } finally {
      setSyncing(false);
    }
  }

  function validateForm() {
    const newErrors = {};

    const ageErr = validateField('age', form.age);
    if (ageErr) newErrors.age = ageErr;

    if (!form.asthmaHistory) newErrors.asthmaHistory = 'Riwayat Asma wajib dipilih.';
    if (!form.smokingStatus) newErrors.smokingStatus = 'Status Merokok wajib dipilih.';

    const exposureErr = validateField('outdoorExposure', form.outdoorExposure);
    if (exposureErr) newErrors.outdoorExposure = exposureErr;

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
          placeholder={rule ? `${rule.min} – ${rule.max}` : ''}
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
      {/* Quick IoT Auto-Fill Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-primary shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-foreground">Integrasi IoT & Profil Cepat</h4>
            <p className="text-xs text-muted">Ambil data pembacaan sensor terbaru dan profil pengguna secara otomatis.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAutoSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-colors border border-primary/30 disabled:opacity-50 shrink-0"
        >
          {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
          Isi Otomatis dari Sensor & Profil
        </button>
      </div>

      {syncNotice && (
        <div className={`p-3 rounded-lg mb-4 text-xs flex items-center gap-2 ${
          syncNotice.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300'
        }`}>
          {syncNotice.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{syncNotice.message}</span>
        </div>
      )}

      {/* Section A: User Data */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Data Pengguna (4 Fitur Personal)</h3>
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
          <h3 className="text-base font-semibold text-foreground">Kondisi Kualitas Udara (8 Fitur Sensor IoT)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderField('pm25', 'PM2.5', AQ_THRESHOLDS.pm25.unit)}
          {renderField('pm10', 'PM10', AQ_THRESHOLDS.pm10.unit)}
          {renderField('so2', 'SO2', AQ_THRESHOLDS.so2.unit)}
          {renderField('no2', 'NO2', AQ_THRESHOLDS.no2.unit)}
          {renderField('co', 'CO', AQ_THRESHOLDS.co.unit)}
          {renderField('o3', 'O3', AQ_THRESHOLDS.o3.unit)}
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
            Memproses Klasifikasi Risiko...
          </>
        ) : (
          'Tentukan Risiko Pernapasan'
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
