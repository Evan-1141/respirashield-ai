'use client';

import { RefreshCw } from 'lucide-react';

export default function Header({ title, subtitle, lastUpdated, onRefresh, actions, children }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted mt-0.5">{subtitle}</p>
        )}
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-1">
            Terakhir diperbarui: {new Date(lastUpdated).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 mt-3 sm:mt-0">
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
        {actions}
        {children}
      </div>
    </div>
  );
}
