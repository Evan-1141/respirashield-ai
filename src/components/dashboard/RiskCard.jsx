'use client';

import { ShieldCheck, ShieldAlert, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import { RISK_LEVELS } from '@/lib/config';

export default function RiskCard({ riskLevel = 0, timestamp }) {
  const info = RISK_LEVELS[riskLevel];
  const colorMap = { green: 'risk-low', yellow: 'risk-medium', red: 'risk-high' };
  const colorKey = colorMap[info.color] || 'risk-low';

  const IconMap = { green: ShieldCheck, yellow: AlertTriangle, red: ShieldAlert };
  const Icon = IconMap[info.color] || ShieldCheck;

  return (
    <div className={`bg-surface border border-border rounded-xl p-5 sm:p-6 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-sm font-medium text-muted uppercase tracking-wide">
          Tingkat Risiko Pernapasan
        </h2>
        <StatusBadge color={info.color} label={info.label} size="sm" />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-xl bg-${colorKey}-bg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 text-${colorKey}`} />
        </div>
        <div>
          <p className={`text-xl font-semibold text-${colorKey}`}>
            {info.label}
          </p>
          <p className="text-sm text-muted mt-0.5">{info.description}</p>
        </div>
      </div>

      {timestamp && (
        <p className="text-xs text-muted-foreground mb-4">
          Klasifikasi terakhir:{' '}
          {new Date(timestamp).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <p className="text-[11px] text-muted-foreground italic max-w-[240px]">
          Klasifikasi risiko berbasis data, bukan diagnosis medis.
        </p>
        <Link
          href="/prediction"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
        >
          Lihat Detail
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
