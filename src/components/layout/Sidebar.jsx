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
  Sun,
  Moon,
  Shield,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/prediction', label: 'Prediksi Risiko', icon: Brain },
  { href: '/monitoring', label: 'Monitoring Udara', icon: Wind },
  { href: '/history', label: 'Riwayat', icon: History },
  { href: '/devices', label: 'Perangkat IoT', icon: Cpu },
  { href: '/profile', label: 'Profil', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden lg:flex flex-col bg-sidebar-bg border-r border-sidebar-border transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-semibold text-foreground leading-tight truncate">
              RespiraShield AI
            </h1>
            <p className="text-[11px] text-muted leading-tight">
              Risk Monitoring
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-active text-sidebar-active-text'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-foreground'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* System Status */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Wifi className="w-3.5 h-3.5 text-status-online" />
            <span>Sistem Online</span>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center py-3 border-t border-sidebar-border">
          <Wifi className="w-4 h-4 text-status-online" aria-label="Sistem Online" />
        </div>
      )}

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-text hover:bg-sidebar-hover hover:text-foreground transition-colors w-full ${
            collapsed ? 'justify-center' : ''
          }`}
          aria-label={theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 flex-shrink-0" />
          ) : (
            <Moon className="w-5 h-5 flex-shrink-0" />
          )}
          {!collapsed && (
            <span>{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
          )}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-text hover:bg-sidebar-hover hover:text-foreground transition-colors w-full ${
            collapsed ? 'justify-center' : ''
          }`}
          aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 flex-shrink-0" />
              <span>Tutup Sidebar</span>
            </>
          )}
        </button>
      </div>

      {/* User */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">
                Evan Danendra
              </p>
              <p className="text-xs text-muted truncate">Pengguna</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
