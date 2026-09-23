'use client';

import { Wifi, WifiOff, RefreshCw, Cpu } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

export default function DeviceHeader({ device, onRefresh }) {
  if (!device) return null;
  const isOnline = device.status === 'online';

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isOnline ? 'bg-status-online-bg' : 'bg-status-offline-bg'
          }`}>
            <Cpu className={`w-5 h-5 ${isOnline ? 'text-status-online' : 'text-status-offline'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">{device.deviceName}</h2>
              <StatusBadge type="status" color={device.status} size="sm" />
            </div>
            <p className="text-xs text-muted mt-0.5">
              Terakhir diperbarui:{' '}
              {new Date(device.lastSeen).toLocaleString('id-ID', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
              {' '}<span className="text-muted-foreground">• Simulated Data</span>
            </p>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted hover:text-foreground bg-surface border border-border rounded-lg hover:border-border-hover transition-colors"
            aria-label="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>
    </div>
  );
}
