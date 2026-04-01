'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Target, Trophy, Package, TrendingUp, Users, Award } from 'lucide-react';

interface TodayStats {
  totalBids: number;
  winners: number;
  uniqueProducts: number;
  uniqueSuppliers: number;
  avgPrice: number;
  totalVolume: number;
}

export function TodaySummary() {
  const [stats, setStats] = useState<TodayStats>({
    totalBids: 0,
    winners: 0,
    uniqueProducts: 0,
    uniqueSuppliers: 0,
    avgPrice: 0,
    totalVolume: 0,
  });

  useEffect(() => {
    const today = startOfDay(new Date()).toISOString();
    supabase
      .from('dc_bids')
      .select('bid_price, is_winner, product_id, supplier_id, volume')
      .gte('created_at', today)
      .then(({ data, error }) => {
        if (error || !data) return;
        const bids = data as any[];
        const prices = bids.map(b => b.bid_price);
        setStats({
          totalBids: bids.length,
          winners: bids.filter(b => b.is_winner).length,
          uniqueProducts: new Set(bids.map(b => b.product_id)).size,
          uniqueSuppliers: new Set(bids.map(b => b.supplier_id)).size,
          avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
          totalVolume: bids.reduce((s, b) => s + (b.volume || 0), 0),
        });
      });
  }, []);

  const cards = [
    { label: 'Total Bids', value: stats.totalBids.toLocaleString(), icon: Target, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Winners', value: stats.winners.toLocaleString(), icon: Trophy, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Products', value: stats.uniqueProducts.toLocaleString(), icon: Package, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Suppliers', value: stats.uniqueSuppliers.toLocaleString(), icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Avg Price', value: stats.avgPrice > 0 ? `${Math.round(stats.avgPrice).toLocaleString()} ETB` : '—', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Total Volume', value: stats.totalVolume > 0 ? `${Math.round(stats.totalVolume).toLocaleString()} kg` : '—', icon: Award, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl bg-zinc-900/60 border border-zinc-800/60 p-4 hover:border-zinc-700/60 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${c.bg}`}>
              <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
            </div>
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{c.label}</span>
          </div>
          <p className="text-xl font-bold tracking-tight">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
