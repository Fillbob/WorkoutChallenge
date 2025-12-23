import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { Suspense } from 'react';
import { AuthProvider } from '@/components/auth-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Workout Challenge 2026',
  description: 'Join the 3-month workout challenge (Jan 1–Mar 31, 2026).'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900`}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                <Link href="/" className="text-lg font-semibold text-primary">
                  Workout Challenge 2026
                </Link>
                <nav className="flex items-center gap-4 text-sm font-medium text-slate-700">
                  <Link href="/dashboard">Dashboard</Link>
                  <Link href="/profile">Profile</Link>
                  <Link href="/admin">Admin</Link>
                </nav>
              </div>
            </header>
            <main className="flex-1">
              <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                {children}
              </Suspense>
            </main>
            <footer className="border-t border-slate-200 bg-white/80">
              <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-600">
                Built for the Jan–Mar 2026 workout challenge. Privacy-first, human-reviewed verification.
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
