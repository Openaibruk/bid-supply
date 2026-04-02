import './globals.css';
import { LiveTicker } from '@/components/LiveTicker';
import { TodaySummary } from '@/components/TodaySummary';
import { ActiveCycles } from '@/components/ActiveCycles';
import { PriceCharts } from '@/components/PriceCharts';
import { SupplierLeaderboard } from '@/components/SupplierLeaderboard';
import { WinnerFeed } from '@/components/WinnerFeed';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100">
      {/* Live ticker */}
      <LiveTicker />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#08090c]/90 backdrop-blur border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
              BS
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight">Bid Supply</h1>
              <p className="text-[11px] text-zinc-500">Live Bidding Transparency</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 live-dot" />
              LIVE
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Top summary */}
        <section>
          <TodaySummary />
        </section>

        {/* Middle grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PriceCharts />
            <ActiveCycles />
          </div>
          <div className="space-y-6">
            <WinnerFeed />
            <SupplierLeaderboard />
          </div>
        </section>

        {/* Footer explainer */}
        <section className="rounded-xl bg-zinc-900/40 border border-zinc-800/40 p-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-2">How winners are chosen</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Bids are collected live from participating suppliers. After the bidding cycle closes, each bid is evaluated based on price, quality, and sourcing terms. The winning bid is publicly posted here with a timestamp. The process is auditable and transparent — everyone sees the same data at the same time.
          </p>
        </section>

        <footer className="text-xs text-zinc-600 text-center pt-4">
          Bid Supply — Real-time transparency for live bidding markets
        </footer>
      </main>
    </div>
  );
}
