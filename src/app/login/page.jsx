'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import ThemeProvider from '@/components/layout/ThemeProvider';
import { login, register } from '@/lib/api';

const INPUT_CLASS =
  'w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary hover:border-border-hover';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const isRegister = mode === 'register';

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setIsLoading(true);
    try {
      if (isRegister) {
        await register(form.get('name'), form.get('email'), form.get('password'));
      } else {
        await login(form.get('email'), form.get('password'));
      }
      router.replace('/dashboard');
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Coba lagi.');
      setIsLoading(false);
    }
  }

  return (
    <ThemeProvider>
      <main className="min-h-dvh flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {isRegister ? 'Buat Akun' : 'Masuk'}
              </h1>
              <p className="text-xs text-muted">RespiraShield AI</p>
            </div>
          </div>

          {error && (
            <div role="alert" className="bg-risk-high/10 border border-risk-high text-risk-high px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">Nama</label>
                <input id="name" name="name" required maxLength={128} autoComplete="name" className={INPUT_CLASS} />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" className={INPUT_CLASS} />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={isRegister ? 8 : undefined}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className={INPUT_CLASS}
              />
              {isRegister && <p className="text-xs text-muted mt-1">Minimal 8 karakter.</p>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isLoading ? 'Memproses…' : isRegister ? 'Daftar' : 'Masuk'}
            </button>
          </form>

          <p className="text-sm text-muted text-center mt-5">
            {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
            <button
              type="button"
              onClick={() => { setMode(isRegister ? 'login' : 'register'); setError(null); }}
              className="font-medium text-primary hover:underline"
            >
              {isRegister ? 'Masuk' : 'Daftar'}
            </button>
          </p>
        </div>
      </main>
    </ThemeProvider>
  );
}
