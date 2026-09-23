'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MetricCard({ label, value, unit, icon: Icon, trend, status, statusColor, onClick, className = '' }) {
  const trendValue = typeof trend === 'number' ? trend : null;
  const isPositive = trendValue > 0;
  const isNegative = trendValue < 0;
  const isNeutral = trendValue === 0;

  return (
    <div
      className={`bg-surface border border-border rounded-xl p-4 transition-all hover:shadow-md hover:border-border-hover ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
          )}
          <span className="text-xs font-medium text-muted uppercase tracking-wide">
            {label}
          </span>
        </div>

        {status && (
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              statusColor === 'green'
                ? 'bg-risk-low-bg text-risk-low'
                : statusColor === 'yellow'
                ? 'bg-risk-medium-bg text-risk-medium'
                : statusColor === 'red'
                ? 'bg-risk-high-bg text-risk-high'
                : 'bg-surface-secondary text-muted'
            }`}
          >
            {status}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-semibold text-foreground tabular-nums">
            {typeof value === 'number' ? value.toFixed(1) : value}
          </p>
          {unit && (
            <p className="text-xs text-muted mt-0.5">{unit}</p>
          )}
        </div>

        {trendValue !== null && (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium ${
              isPositive
                ? 'text-risk-high'
                : isNegative
                ? 'text-risk-low'
                : 'text-muted'
            }`}
          >
            {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
            {isNeutral && <Minus className="w-3.5 h-3.5" />}
            <span>{isPositive ? '+' : ''}{trendValue.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
