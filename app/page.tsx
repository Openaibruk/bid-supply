'use client';

'use client';

import './globals.css';
import { useLang } from '@/contexts/LanguageContext';
import { LiveTicker } from '@/components/LiveTicker';
import { TodaySummary } from '@/components/TodaySummary';
import { ActiveCycles } from '@/components/ActiveCycles';
import { PriceCharts } from '@/components/PriceCharts';
import { SupplierLeaderboard } from '@/components/SupplierLeaderboard';
import { WinnerFeed } from '@/components/WinnerFeed';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function Page() {
  const { t } = useLang();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Live ticker */}
      <ErrorBoundary>
        <LiveTicker />
      </ErrorBoundary>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow">
              BS
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-slate-900">Bid Supply</h1>
              <p className="text-[11px] text-slate-500">{t('bidSupplyLive')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('live')}
            </span>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Top summary */}
        <section>
          <ErrorBoundary>
            <TodaySummary />
          </ErrorBoundary>
        </section>

        {/* Middle grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ErrorBoundary>
              <PriceCharts />
            </ErrorBoundary>
            <ErrorBoundary>
              <ActiveCycles />
            </ErrorBoundary>
          </div>
          <div className="space-y-6">
            <ErrorBoundary>
              <WinnerFeed />
            </ErrorBoundary>
            <ErrorBoundary>
              <SupplierLeaderboard />
            </ErrorBoundary>
          </div>
        </section>

        {/* Footer explainer */}
        <section className="rounded-xl bg-slate-50 border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">{t('howWinnerChosen')}</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {t('howWinnerDesc')}
          </p>
        </section>

        <footer className="text-xs text-slate-500 text-center pt-4">
          Bid Supply — Real-time transparency for live bidding markets
        </footer>
      </main>
    </div>
  );
}
