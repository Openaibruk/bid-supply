'use client';

import { useEffect, useState } from 'react';
import { LiveTicker } from '@/components/LiveTicker';
import { TodaySummary } from '@/components/TodaySummary';
import { ActiveCycles } from '@/components/ActiveCycles';
import { WinnerFeed } from '@/components/WinnerFeed';
import { SupplierLeaderboard } from '@/components/SupplierLeaderboard';
import { PriceCharts } from '@/components/PriceCharts';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Home() {
  const [connectionHealthy, setConnectionHealthy] = useState(false);

  useEffect(() => {
    supabase
      .from('dc_bids')
      .select('id', { count: 'exact', head: true })
      .then(({ error }) => setConnectionHealthy(!error));
  }, []);

  return (
    <div className="min-h-screen bg-[#08090c]">
      {/* Top Bar */}
      <header className="border-b border-zinc-800/60 bg-[#08090c]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">BS</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight">Bid Supply</h1>
            <span className="hidden sm:inline text-xs text-zinc-500">Live Bidding Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            {connectionHealthy ? (
              <span className="flex items-center gap-1.5 text-xs text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-400 live-dot" />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                Connecting…
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Live Ticker */}
      <LiveTicker />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Today Summary Cards */}
        <TodaySummary />

        {/* Middle Row: Charts + Active Cycles */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PriceCharts />
          </div>
          <div>
            <ActiveCycles />
          </div>
        </div>

        {/* Bottom Row: Winners + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WinnerFeed />
          <SupplierLeaderboard />
        </div>

        {/* Footer */}
        <footer className="border-t border-zinc-800/60 pt-6 pb-8 text-center">
          <p className="text-xs text-zinc-600">
            Bid Supply — Real-time product bidding transparency • Powered by seller-incentive-pulse
          </p>
        </footer>
      </main>
    </div>
  );
}
