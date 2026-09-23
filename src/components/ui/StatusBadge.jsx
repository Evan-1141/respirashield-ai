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
};

export default function StatusBadge({ type = 'risk', color = 'green', label, size = 'md', showIcon = true }) {
  if (type === 'status') {
    const style = STATUS_STYLES[color] || STATUS_STYLES.online;
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
