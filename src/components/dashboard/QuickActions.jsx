'use client';

import Link from 'next/link';
import { Brain, Wind, History } from 'lucide-react';

const ACTIONS = [
  { href: '/prediction', label: 'Cek Risiko', icon: Brain, description: 'Klasifikasi risiko pernapasan' },
  { href: '/monitoring', label: 'Lihat Monitoring', icon: Wind, description: 'Data kualitas udara terkini' },
  { href: '/history', label: 'Lihat Riwayat', icon: History, description: 'Riwayat prediksi risiko' },
];

export default function QuickActions() {
  return (
    <div>
      <h2 className="text-sm font-medium text-muted uppercase tracking-wide mb-3">
        Aksi Cepat
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 bg-surface border border-border rounded-xl p-4 transition-all hover:shadow-md hover:border-primary/30 hover:bg-primary-light group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                <p className="text-xs text-muted">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
