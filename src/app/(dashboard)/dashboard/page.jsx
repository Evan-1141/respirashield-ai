'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import RiskCard from '@/components/dashboard/RiskCard';
import AirQualityGrid from '@/components/dashboard/AirQualityGrid';
import EnvironmentCard from '@/components/dashboard/EnvironmentCard';
import DeviceStatusCard from '@/components/dashboard/DeviceStatusCard';
import AirQualityChart from '@/components/dashboard/AirQualityChart';
import QuickActions from '@/components/dashboard/QuickActions';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { getAirQuality, getAirQualityTrends, getDeviceStatus, getSystemStatus } from '@/lib/api';
import { AlertCircle, Clock, Cpu } from 'lucide-react';

export default function DashboardPage() {
  const [airQuality, setAirQuality] = useState(null);
  const [trends, setTrends] = useState(null);
  const [device, setDevice] = useState(null);
  const [system, setSystem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [aq, tr, dev, sys] = await Promise.all([
        getAirQuality(),
        getAirQualityTrends(),
        getDeviceStatus(),
        getSystemStatus(),
      ]);
      setAirQuality(aq);
      setTrends(tr);
      setDevice(dev);
      setSystem(sys);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Gagal memuat data dari server backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // Poll data setiap 30 detik untuk telemetry aktual
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !airQuality) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <LoadingSpinner label="Memuat dashboard RespiraShield AI..." />
      </div>
    );
  }

  const isIoT = airQuality?.source === 'iot';
  const isStale = Boolean(airQuality?.isStale);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Header
        title="Selamat Datang di RespiraShield AI"
        subtitle="Pantau kualitas udara dan klasifikasi risiko pernapasan secara real-time."
        lastUpdated={airQuality?.recordedAt || system?.lastUpdated}
        onRefresh={loadData}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Data Source Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isIoT
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
                : 'bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            {isIoT ? 'Sensor Fisik (IoT)' : 'Data Simulasi'}
          </span>

          {/* System Online / Offline Status */}
          <StatusBadge
            type="status"
            color={system?.status === 'online' ? 'online' : 'offline'}
            label={system?.status === 'online' ? 'Sistem Online' : 'Sistem Offline'}
            size="sm"
          />
        </div>
      </Header>

      {/* Backend Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Gagal Mengambil Data Backend</h4>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Stale Telemetry Warning */}
      {isStale && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 p-3.5 rounded-xl flex items-center gap-2.5 text-xs">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            <strong>Data Kedaluwarsa:</strong> Pembacaan sensor terakhir diterima {airQuality?.staleMinutes} menit lalu.
            Nyalakan mikrokontroler atau simulator untuk memperbarui data terkini.
          </span>
        </div>
      )}

      {/* Risk Overview */}
      <RiskCard riskLevel={0} timestamp={airQuality?.recordedAt || system?.lastUpdated} />

      {/* Air Quality Grid */}
      <AirQualityGrid data={airQuality} trends={trends} />

      {/* Environment + Device Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EnvironmentCard
          temperature={airQuality?.temperature}
          humidity={airQuality?.humidity}
          trends={trends}
        />
        <DeviceStatusCard
          device={{
            ...device,
            activeSensors: system?.activeSensors,
            totalSensors: system?.totalSensors,
          }}
        />
      </div>

      {/* Chart */}
      <AirQualityChart />

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
