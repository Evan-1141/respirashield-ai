'use client';

import { ShieldCheck, ShieldAlert, AlertTriangle, Wifi, WifiOff, Activity, CircleDot } from 'lucide-react';

const RISK_STYLES = {
  green: {
    bg: 'bg-risk-low-bg',
    text: 'text-risk-low',
    border: 'border-risk-low-border',
    icon: ShieldCheck,
  },
  yellow: {
    bg: 'bg-risk-medium-bg',
    text: 'text-risk-medium',
    border: 'border-risk-medium-border',
    icon: AlertTriangle,
  },
  red: {
    bg: 'bg-risk-high-bg',
    text: 'text-risk-high',
    border: 'border-risk-high-border',
    icon: ShieldAlert,
  },
  gray: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    icon: CircleDot,
  },
};

const STATUS_STYLES = {
  online: {
    bg: 'bg-status-online-bg',
    text: 'text-status-online',
    border: 'border-status-online/20',
    icon: Wifi,
    label: 'Online',
  },
  offline: {
    bg: 'bg-status-offline-bg',
    text: 'text-status-offline',
    border: 'border-status-offline/20',
    icon: WifiOff,
    label: 'Offline',
  },
  not_configured: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    icon: CircleDot,
    label: 'Belum dikonfigurasi',
  },
  error: {
    bg: 'bg-risk-high-bg',
    text: 'text-status-offline',
    border: 'border-status-offline/20',
    icon: ShieldAlert,
    label: 'Error',
  },
  active: {
    bg: 'bg-status-online-bg',
    text: 'text-status-active',
    border: 'border-status-active/20',
    icon: Activity,
    label: 'Aktif',
  },
  inactive: {
    bg: 'bg-risk-high-bg',
    text: 'text-status-inactive',
    border: 'border-status-inactive/20',
    icon: CircleDot,
    label: 'Tidak Aktif',
  },
  disconnected: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    icon: CircleDot,
    label: 'Belum terhubung',
  },
  no_data: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    icon: CircleDot,
    label: 'Belum terhubung',
  },
  stale: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    icon: CircleDot,
    label: 'Data kedaluwarsa',
  },
  gray: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    icon: CircleDot,
    label: 'Belum terhubung',
  },
  simulation: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
    icon: Activity,
    label: 'Simulasi Aktif',
  },
};

export default function StatusBadge({ type = 'risk', color = 'green', label, size = 'md', showIcon = true }) {
  if (type === 'status') {
    const style = STATUS_STYLES[color] || STATUS_STYLES.gray;
    const Icon = style.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 border rounded-full font-medium ${style.bg} ${style.text} ${style.border} ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
        }`}
      >
        {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
        {label || style.label}
      </span>
    );
  }

  const style = RISK_STYLES[color] || RISK_STYLES.green;
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full font-medium ${style.bg} ${style.text} ${style.border} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-4 py-1.5 text-base' : 'px-3 py-1 text-sm'
      }`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'} />}
      {label}
    </span>
  );
}
