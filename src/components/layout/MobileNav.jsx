'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import {
  LayoutDashboard,
  Brain,
  Wind,
  History,
  Cpu,
  User,
  Menu,
  X,
  Sun,
  Moon,
  Shield,
  Wifi,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/prediction', label: 'Prediksi Risiko', icon: Brain },
  { href: '/monitoring', label: 'Monitoring', icon: Wind },
  { href: '/history', label: 'Riwayat', icon: History },
  { href: '/devices', label: 'Perangkat', icon: Cpu },
  { href: '/profile', label: 'Profil', icon: User },
];

// Bottom tab nav items (subset for mobile bottom bar)
const BOTTOM_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/prediction', label: 'Prediksi', icon: Brain },
  { href: '/monitoring', label: 'Monitor', icon: Wind },
  { href: '/history', label: 'Riwayat', icon: History },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Close drawer on route change
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  return (
    <>
      {/* Top bar (mobile only) */}
      <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-surface border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            RespiraShield AI
          </span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
      </header>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 right-0 z-50 w-72 bg-surface border-l border-border transform transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Menu
            </span>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-active text-sidebar-active-text'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3 space-y-2">
          {/* System Status */}
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted">
            <Wifi className="w-3.5 h-3.5 text-status-online" />
            <span>Sistem Online</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-sidebar-text hover:bg-sidebar-hover hover:text-foreground transition-colors w-full"
            aria-label={theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            <span>{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
          </button>

          {/* User */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Evan Danendra</p>
              <p className="text-xs text-muted">Pengguna</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border flex items-center justify-around h-16 px-1">
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-lg text-[11px] font-medium transition-colors min-w-0 ${
                isActive
                  ? 'text-primary'
                  : 'text-muted hover:text-foreground'
              }`}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-lg text-[11px] font-medium text-muted hover:text-foreground transition-colors"
          aria-label="Menu lainnya"
        >
          <Menu className="w-5 h-5" />
          <span>Lainnya</span>
        </button>
      </nav>
    </>
  );
}
