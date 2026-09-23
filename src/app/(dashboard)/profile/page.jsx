'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getUserProfile, updateUserProfile } from '@/lib/api';
import { User, Save, X, Pencil, Loader2 } from 'lucide-react';
import { SMOKING_LABELS } from '@/lib/mock-data';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getUserProfile().then((data) => {
      setProfile(data);
      setForm(data);
      setLoading(false);
    });
  }, []);

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

  function validate() {
    const newErrors = {};
    if (!form.name?.trim()) newErrors.name = 'Nama wajib diisi.';
    if (!form.age || form.age < 1 || form.age > 120) newErrors.age = 'Usia harus antara 1-120.';
    if (form.outdoorExposure < 0 || form.outdoorExposure > 24) newErrors.outdoorExposure = 'Durasi harus antara 0-24.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const updated = await updateUserProfile({
        name: form.name,
        age: Number(form.age),
        asthmaHistory: form.asthmaHistory,
        smokingStatus: form.smokingStatus,
        outdoorExposure: Number(form.outdoorExposure),
      });
      setProfile(updated);
      setEditing(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm({ ...profile });
    setErrors({});
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner label="Memuat profil..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Header
        title="Profil"
        subtitle="Kelola informasi pribadi Anda."
      />

      <div className="bg-surface border border-border rounded-xl p-5 sm:p-6">
        {/* Profile Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{profile.name}</h2>
              <p className="text-xs text-muted">
                Bergabung sejak{' '}
                {new Date(profile.createdAt).toLocaleDateString('id-ID', {
                  month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-primary-light rounded-lg hover:bg-primary/10 transition-colors"
              aria-label="Edit profil"
            >
              <Pencil className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}
        </div>

        {/* Profile Fields */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-foreground mb-1.5">
              Nama
            </label>
            {editing ? (
              <>
                <input
                  id="profile-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-3 py-2.5 bg-surface border rounded-lg text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                    errors.name ? 'border-risk-high' : 'border-border hover:border-border-hover'
                  }`}
                />
                {errors.name && <p className="text-xs text-risk-high mt-1">{errors.name}</p>}
              </>
            ) : (
              <p className="text-sm text-foreground py-2.5">{profile.name}</p>
            )}
          </div>

          {/* Age */}
          <div>
            <label htmlFor="profile-age" className="block text-sm font-medium text-foreground mb-1.5">
              Usia <span className="text-muted font-normal">(tahun)</span>
            </label>
            {editing ? (
              <>
                <input
                  id="profile-age"
                  type="number"
                  value={form.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  min="1"
                  max="120"
                  className={`w-full px-3 py-2.5 bg-surface border rounded-lg text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                    errors.age ? 'border-risk-high' : 'border-border hover:border-border-hover'
                  }`}
                />
                {errors.age && <p className="text-xs text-risk-high mt-1">{errors.age}</p>}
              </>
            ) : (
              <p className="text-sm text-foreground py-2.5">{profile.age} tahun</p>
            )}
          </div>

          {/* Asthma History */}
          <div>
            <label htmlFor="profile-asthma" className="block text-sm font-medium text-foreground mb-1.5">
              Riwayat Asma
            </label>
            {editing ? (
              <select
                id="profile-asthma"
                value={form.asthmaHistory ? 'true' : 'false'}
                onChange={(e) => handleChange('asthmaHistory', e.target.value === 'true')}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary hover:border-border-hover"
              >
                <option value="false">Tidak</option>
                <option value="true">Ya</option>
              </select>
            ) : (
              <p className="text-sm text-foreground py-2.5">{profile.asthmaHistory ? 'Ya' : 'Tidak'}</p>
            )}
          </div>

          {/* Smoking Status */}
          <div>
            <label htmlFor="profile-smoking" className="block text-sm font-medium text-foreground mb-1.5">
              Status Merokok
            </label>
            {editing ? (
              <select
                id="profile-smoking"
                value={form.smokingStatus}
                onChange={(e) => handleChange('smokingStatus', e.target.value)}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary hover:border-border-hover"
              >
                <option value="never">Tidak Pernah</option>
                <option value="former">Mantan Perokok</option>
                <option value="active">Perokok Aktif</option>
              </select>
            ) : (
              <p className="text-sm text-foreground py-2.5">{SMOKING_LABELS[profile.smokingStatus]}</p>
            )}
          </div>

          {/* Outdoor Exposure */}
          <div>
            <label htmlFor="profile-exposure" className="block text-sm font-medium text-foreground mb-1.5">
              Durasi Paparan Outdoor <span className="text-muted font-normal">(jam/hari)</span>
            </label>
            {editing ? (
              <>
                <input
                  id="profile-exposure"
                  type="number"
                  value={form.outdoorExposure}
                  onChange={(e) => handleChange('outdoorExposure', e.target.value)}
                  min="0"
                  max="24"
                  step="0.5"
                  className={`w-full px-3 py-2.5 bg-surface border rounded-lg text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                    errors.outdoorExposure ? 'border-risk-high' : 'border-border hover:border-border-hover'
                  }`}
                />
                {errors.outdoorExposure && <p className="text-xs text-risk-high mt-1">{errors.outdoorExposure}</p>}
              </>
            ) : (
              <p className="text-sm text-foreground py-2.5">{profile.outdoorExposure} jam/hari</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {editing && (
          <div className="flex gap-3 mt-6 pt-4 border-t border-border">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted bg-surface border border-border rounded-xl hover:text-foreground hover:border-border-hover transition-colors"
            >
              <X className="w-4 h-4" />
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
