'use client';

import { useRouter } from 'next/navigation';
import { User, LogOut } from 'lucide-react';
import { USER_KEY, logout } from '@/lib/api';
import useStorageItem from '@/lib/useStorageItem';

function parseUser(raw) {
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export default function UserMenu({ className = '' }) {
  const router = useRouter();
  const user = parseUser(useStorageItem(USER_KEY));

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <User className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{user?.name ?? 'Pengguna'}</p>
        <p className="text-xs text-muted truncate">{user?.email ?? ''}</p>
      </div>
      <button
        onClick={handleLogout}
        className="p-2 rounded-lg text-sidebar-text hover:bg-sidebar-hover hover:text-foreground transition-colors"
        aria-label="Keluar"
        title="Keluar"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
