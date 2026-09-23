'use client';

import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { RISK_LEVELS } from '@/lib/config';

const ICON_MAP = {
  green: ShieldCheck,
  yellow: AlertTriangle,
  red: ShieldAlert,
};

export default function RiskBadge({ riskLevel = 0, size = 'md' }) {
  const info = RISK_LEVELS[riskLevel];
  if (!info) return null;

  const Icon = ICON_MAP[info.color] || ShieldCheck;
  const colorMap = { green: 'risk-low', yellow: 'risk-medium', red: 'risk-high' };
  const c = colorMap[info.color];

  const sizeStyles = {
    sm: { wrapper: 'gap-1.5 px-2.5 py-1 text-xs', icon: 'w-3.5 h-3.5' },
    md: { wrapper: 'gap-2 px-3 py-1.5 text-sm', icon: 'w-4 h-4' },
    lg: { wrapper: 'gap-2.5 px-4 py-2 text-base', icon: 'w-5 h-5' },
  };

  const s = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border bg-${c}-bg text-${c} border-${c}-border ${s.wrapper}`}
    >
      <Icon className={s.icon} />
      {info.label}
    </span>
  );
}
