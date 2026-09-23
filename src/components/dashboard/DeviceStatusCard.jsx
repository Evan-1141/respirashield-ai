'use client';

import { Wifi, WifiOff, Cpu, Activity } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

export default function DeviceStatusCard({ device }) {
  if (!device) return null;

  const isOnline = device.status === 'online';

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <h2 className="text-sm font-medium text-muted uppercase tracking-wide mb-3">
        Status Perangkat
      </h2>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isOnline ? 'bg-status-online-bg' : 'bg-status-offline-bg'
        }`}>
          <Cpu className={`w-5 h-5 ${isOnline ? 'text-status-online' : 'text-status-offline'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-foreground truncate">
              {device.deviceName}
            </p>
            <StatusBadge type="status" color={device.status} size="sm" />
          </div>
          <p className="text-xs text-muted">
            Terakhir terlihat:{' '}
            {new Date(device.lastSeen).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          <span>{device.activeSensors || 5}/{device.totalSensors || 6} sensor aktif</span>
        </div>
        <span className="text-muted-foreground">Mock Device</span>
      </div>
    </div>
  );
}
