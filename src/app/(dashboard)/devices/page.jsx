'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { getDeviceStatus, getDeviceSensors, getDeviceActivity } from '@/lib/api';
import {
  Cpu, Wifi, WifiOff, Signal, Activity, CircleDot,
  Clock, Info, Zap, AlertTriangle, PlugZap,
} from 'lucide-react';

const ACTIVITY_ICONS = {
  reading: Activity,
  connected: PlugZap,
  disconnected: WifiOff,
  alert: AlertTriangle,
};

const ACTIVITY_COLORS = {
  reading: 'text-primary',
  connected: 'text-status-online',
  disconnected: 'text-status-offline',
  alert: 'text-risk-medium',
};

export default function DevicesPage() {
  const [device, setDevice] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [dev, sens, act] = await Promise.all([
        getDeviceStatus(), getDeviceSensors(), getDeviceActivity(),
      ]);
      setDevice(dev);
      setSensors(sens);
      setActivity(act);
    } catch (err) {
      console.error('Failed to load device data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner label="Memuat data perangkat..." />
      </div>
    );
  }

  if (!device) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Header
        title="Perangkat IoT"
        subtitle="Status dan informasi perangkat monitoring."
        onRefresh={loadData}
      />

      {/* Mock Device Label */}
      <div className="flex items-start gap-2.5 bg-surface-secondary border border-border rounded-xl p-4">
        <Info className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted leading-relaxed">
          Data berikut merupakan <strong>Mock Device</strong> untuk tujuan pengembangan.
          Perangkat fisik ESP32 belum terhubung.
        </p>
      </div>

      {/* Device Overview */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Informasi Perangkat</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            device.status === 'online' ? 'bg-status-online-bg' : 'bg-status-offline-bg'
          }`}>
            <Cpu className={`w-6 h-6 ${device.status === 'online' ? 'text-status-online' : 'text-status-offline'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">{device.deviceName}</h3>
              <StatusBadge type="status" color={device.status} size="sm" />
            </div>
            <p className="text-xs text-muted mt-0.5">{device.deviceCode}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border text-sm">
          <div>
            <p className="text-xs text-muted mb-1">Device ID</p>
            <p className="font-medium text-foreground font-mono text-xs">{device.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Firmware</p>
            <p className="font-medium text-foreground">{device.firmwareVersion}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Lokasi</p>
            <p className="font-medium text-foreground">{device.location}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Uptime</p>
            <p className="font-medium text-foreground">{device.uptime}</p>
          </div>
        </div>
      </div>

      {/* Sensor Status */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Status Sensor</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sensors.map((sensor) => {
            const isActive = sensor.status === 'active';
            return (
              <div
                key={sensor.id}
                className="flex items-start gap-3 p-3 bg-surface-secondary rounded-xl border border-border"
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  isActive ? 'bg-status-active' : 'bg-status-inactive'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{sensor.name}</p>
                    <StatusBadge
                      type="status"
                      color={isActive ? 'active' : 'inactive'}
                      size="sm"
                      showIcon={false}
                    />
                  </div>
                  <p className="text-xs text-muted mt-0.5">{sensor.type}</p>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(sensor.lastUpdate).toLocaleString('id-ID', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                  {sensor.lastReading && (
                    <div className="text-xs text-foreground mt-1.5 font-mono">
                      {Object.entries(sensor.lastReading).map(([key, val]) => (
                        <span key={key} className="mr-2">{key}: {val}</span>
                      ))}
                      <span className="text-muted">{sensor.unit}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Connection Information */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Informasi Koneksi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Wifi className="w-5 h-5 text-status-online" />
            <div>
              <p className="text-xs text-muted">Wi-Fi Status</p>
              <p className="text-sm font-medium text-foreground">{device.connection.wifiStatus}</p>
              <p className="text-xs text-muted">{device.connection.ssid}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Signal className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted">Kekuatan Sinyal</p>
              <p className="text-sm font-medium text-foreground">{device.connection.signalStrength} dBm</p>
              <p className="text-xs text-muted">{device.connection.signalQuality}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted" />
            <div>
              <p className="text-xs text-muted">Komunikasi Terakhir</p>
              <p className="text-sm font-medium text-foreground">
                {new Date(device.connection.lastCommunication).toLocaleString('id-ID', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Device Activity Timeline */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Aktivitas Perangkat</h2>
        <div className="space-y-0">
          {activity.map((item, idx) => {
            const Icon = ACTIVITY_ICONS[item.type] || Activity;
            const colorClass = ACTIVITY_COLORS[item.type] || 'text-muted';
            const isLast = idx === activity.length - 1;

            return (
              <div key={item.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-surface-secondary border border-border flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-border my-1" />}
                </div>
                <div className={`pb-4 ${isLast ? '' : ''}`}>
                  <p className="text-sm text-foreground">{item.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(item.timestamp).toLocaleString('id-ID', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
