'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

    setLoading(true);
    supabase
      .from('dc_bids')
      .select('bid_price, is_winner, product_id, supplier_id, volume')
      .gte('created_at', startOfToday)
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          setError(error.message);
          return;
        }
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
    { label: 'Total Bids', value: stats.totalBids.toLocaleString(), icon: Target, iconColor: 'text-indigo-600', bgColor: 'bg-indigo-100' },
    { label: 'Winners', value: stats.winners.toLocaleString(), icon: Trophy, iconColor: 'text-green-700', bgColor: 'bg-green-100' },
    { label: 'Products', value: stats.uniqueProducts.toLocaleString(), icon: Package, iconColor: 'text-amber-700', bgColor: 'bg-amber-100' },
    { label: 'Suppliers', value: stats.uniqueSuppliers.toLocaleString(), icon: Users, iconColor: 'text-cyan-700', bgColor: 'bg-cyan-100' },
    { label: 'Avg Price', value: stats.avgPrice > 0 ? `${Math.round(stats.avgPrice).toLocaleString()} ETB` : '—', icon: TrendingUp, iconColor: 'text-purple-600', bgColor: 'bg-purple-100' },
    { label: 'Total Volume', value: stats.totalVolume > 0 ? `${Math.round(stats.totalVolume).toLocaleString()} kg` : '—', icon: Award, iconColor: 'text-pink-600', bgColor: 'bg-pink-100' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(c => (
          <div key={c.label} className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${c.bgColor}`} />
              <span className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">{c.label}</span>
            </div>
            <div className="h-6 bg-slate-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm font-medium text-red-800 mb-1">Failed to load today’s summary</p>
        <p className="text-xs text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${c.bgColor}`}>
              <c.icon className={`w-3.5 h-3.5 ${c.iconColor}`} />
            </div>
            <span className="text-[11px] font-medium text-slate-600 uppercase tracking-wider">{c.label}</span>
          </div>
          <p className="text-lg md:text-xl font-bold tracking-tight text-slate-900 break-words">{c.value}</p>
        </div>
      ))}
    </div>
  );
}