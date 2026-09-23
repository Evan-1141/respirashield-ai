'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import HistoryTable from '@/components/history/HistoryTable';
import HistoryDetail from '@/components/history/HistoryDetail';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { getPredictionHistory } from '@/lib/api';
import { RISK_LEVELS } from '@/lib/config';
import { Search, Filter, History, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 8;

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    getPredictionHistory().then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let result = [...records];

    if (riskFilter !== 'all') {
      result = result.filter((r) => r.riskLevel === Number(riskFilter));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => {
        const date = new Date(r.createdAt).toLocaleDateString('id-ID');
        const riskLabel = RISK_LEVELS[r.riskLevel]?.label?.toLowerCase() || '';
        return (
          date.includes(q) ||
          riskLabel.includes(q) ||
          String(r.airQuality.pm25).includes(q) ||
          String(r.airQuality.pm10).includes(q)
        );
      });
    }

    return result;
  }, [records, riskFilter, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [search, riskFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner label="Memuat riwayat..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Header
        title="Riwayat Prediksi"
        subtitle="Semua hasil klasifikasi risiko yang telah dilakukan."
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan tanggal, PM2.5, PM10..."
            className="w-full pl-9 pr-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted flex-shrink-0" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            aria-label="Filter tingkat risiko"
          >
            <option value="all">Semua Risiko</option>
            <option value="0">Risiko Rendah</option>
            <option value="1">Risiko Sedang</option>
            <option value="2">Risiko Tinggi</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="Tidak ada riwayat ditemukan"
          description={search || riskFilter !== 'all'
            ? 'Coba ubah filter atau kata kunci pencarian.'
            : 'Belum ada hasil prediksi. Mulai dengan melakukan prediksi risiko.'}
        />
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Menampilkan {paginated.length} dari {filtered.length} hasil</span>
            <span>Mock Data</span>
          </div>

          <HistoryTable records={paginated} onViewDetail={setSelectedRecord} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted bg-surface border border-border rounded-lg hover:text-foreground hover:border-border-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                    page === p
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted bg-surface border border-border hover:text-foreground hover:border-border-hover'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted bg-surface border border-border rounded-lg hover:text-foreground hover:border-border-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Detail Prediksi"
        size="lg"
      >
        <HistoryDetail record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      </Modal>
    </div>
  );
}
