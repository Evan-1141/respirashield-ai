'use client';

import RiskBadge from '@/components/prediction/RiskBadge';
import { RISK_LEVELS } from '@/lib/config';
import { Eye, Clock } from 'lucide-react';

export default function HistoryTable({ records, onViewDetail }) {
  if (!records || records.length === 0) return null;

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wide">Tanggal</th>
                <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wide">Waktu</th>
                <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wide">PM2.5</th>
                <th className="text-right px-4 py-3 font-medium text-muted text-xs uppercase tracking-wide">PM10</th>
                <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wide">Kondisi</th>
                <th className="text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wide">Hasil Risiko</th>
                <th className="text-center px-4 py-3 font-medium text-muted text-xs uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const date = new Date(record.createdAt);
                const riskInfo = RISK_LEVELS[record.riskLevel];

                return (
                  <tr
                    key={record.id}
                    className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors cursor-pointer"
                    onClick={() => onViewDetail(record)}
                  >
                    <td className="px-4 py-3 text-foreground">
                      {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground tabular-nums">{record.airQuality.pm25}</td>
                    <td className="px-4 py-3 text-right text-foreground tabular-nums">{record.airQuality.pm10}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted">
                        {record.userInput.asthmaHistory ? 'Asma' : 'Non-asma'},{' '}
                        {record.userInput.age} thn
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge riskLevel={record.riskLevel} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); onViewDetail(record); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary-light rounded-lg transition-colors"
                        aria-label="Lihat detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {records.map((record) => {
          const date = new Date(record.createdAt);
          return (
            <div
              key={record.id}
              className="bg-surface border border-border rounded-xl p-4 cursor-pointer hover:shadow-sm hover:border-border-hover transition-all"
              onClick={() => onViewDetail(record)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onViewDetail(record)}
            >
              <div className="flex items-center justify-between mb-2">
                <RiskBadge riskLevel={record.riskLevel} size="sm" />
                <div className="flex items-center gap-1 text-xs text-muted">
                  <Clock className="w-3 h-3" />
                  {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div><span className="text-muted">PM2.5: </span><span className="text-foreground font-medium">{record.airQuality.pm25}</span></div>
                <div><span className="text-muted">PM10: </span><span className="text-foreground font-medium">{record.airQuality.pm10}</span></div>
                <div><span className="text-muted">Usia: </span><span className="text-foreground font-medium">{record.userInput.age} thn</span></div>
                <div><span className="text-muted">Skor: </span><span className="text-foreground font-medium">{(record.predictionScore * 100).toFixed(0)}%</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
