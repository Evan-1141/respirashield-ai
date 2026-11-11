'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThemeProvider from '@/components/layout/ThemeProvider';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import { TOKEN_KEY } from '@/lib/api';
import useStorageItem from '@/lib/useStorageItem';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const token = useStorageItem(TOKEN_KEY);

  // Client-side gate only; the backend still enforces auth on every protected endpoint.
  useEffect(() => {
    if (token === '') router.replace('/login');
  }, [token, router]);

  if (!token) return null;

  return (
    <ThemeProvider>
      <div className="flex h-dvh overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <MobileNav />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
