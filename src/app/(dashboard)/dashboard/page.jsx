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

export default function DashboardPage() {
  const [airQuality, setAirQuality] = useState(null);
  const [trends, setTrends] = useState(null);
  const [device, setDevice] = useState(null);
  const [system, setSystem] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner label="Memuat dashboard..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Header
        title="Selamat Datang di RespiraShield AI"
        subtitle="Pantau kualitas udara dan risiko pernapasan Anda."
        lastUpdated={system?.lastUpdated}
        onRefresh={loadData}
      >
        <StatusBadge
          type="status"
          color={system?.status === 'online' ? 'online' : 'offline'}
          label={system?.status === 'online' ? 'Sistem Online' : 'Sistem Offline'}
          size="sm"
        />
      </Header>

      {/* Risk Overview */}
      <RiskCard riskLevel={0} timestamp={system?.lastUpdated} />

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
