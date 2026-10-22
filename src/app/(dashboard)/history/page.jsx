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
import { Search, Filter, History, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

const ITEMS_PER_PAGE = 8;

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [page, setPage] = useState(1);

  async function loadHistory() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPredictionHistory();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError(err.message || 'Gagal memuat riwayat prediksi dari server.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
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
        const pm25 = String(r.airQuality?.pm25 ?? '');
        const pm10 = String(r.airQuality?.pm10 ?? '');
        return (
          date.includes(q) ||
          riskLabel.includes(q) ||
          pm25.includes(q) ||
          pm10.includes(q)
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

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <LoadingSpinner label="Memuat riwayat klasifikasi..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Header
        title="Riwayat Klasifikasi Risiko"
        subtitle="Daftar seluruh riwayat skrining risiko pernapasan yang tersimpan di database."
        onRefresh={loadHistory}
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Gagal Mengambil Riwayat</h4>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface border border-border p-4 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan tanggal, level risiko, atau nilai PM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted shrink-0" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">Semua Tingkat Risiko</option>
            <option value="0">Risiko Rendah</option>
            <option value="1">Risiko Sedang</option>
            <option value="2">Risiko Tinggi</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {paginated.length > 0 ? (
        <div className="space-y-4">
          <HistoryTable
            records={paginated}
            onSelectRecord={(r) => setSelectedRecord(r)}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 text-sm text-muted">
              <span>
                Halaman {page} dari {totalPages} ({filtered.length} total riwayat)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 border border-border rounded-lg hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 border border-border rounded-lg hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={History}
          title="Tidak Ada Riwayat"
          description={
            search || riskFilter !== 'all'
              ? 'Tidak ditemukan data yang cocok dengan kriteria filter Anda.'
              : 'Belum ada riwayat klasifikasi risiko yang tersimpan.'
          }
        />
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title="Rincian Klasifikasi Risiko"
      >
        {selectedRecord && <HistoryDetail record={selectedRecord} />}
      </Modal>
    </div>
  );
}
