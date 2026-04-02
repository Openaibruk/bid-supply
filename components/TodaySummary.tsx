'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { startOfDay } from 'date-fns';
import { Target, Trophy, Package, TrendingUp, Users, Award } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

interface TodayStats {
  totalBids: number;
  winners: number;
  uniqueProducts: number;
  uniqueSuppliers: number;
  avgPrice: number;
  totalVolume: number;
}

export function TodaySummary() {
  const { t } = useLang();
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
    const fetch = async () => {
      setLoading(true);
      try {
        const today = startOfDay(new Date()).toISOString();
        const { data, error } = await supabase
          .from('dc_bids')
          .select('bid_price, is_winner, product_id, supplier_id, volume')
          .gte('created_at', today);
        if (error) throw error;
        const bids = data as any[] || [];
        const prices = bids.map(b => b.bid_price);
        setStats({
          totalBids: bids.length,
          winners: bids.filter(b => b.is_winner).length,
          uniqueProducts: new Set(bids.map(b => b.product_id)).size,
          uniqueSuppliers: new Set(bids.map(b => b.supplier_id)).size,
          avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
          totalVolume: bids.reduce((s, b) => s + (b.volume || 0), 0),
        });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const cards = [
    { key: 'totalBids', label: t('totalBids'), icon: Target, color: 'text-blue-600', bg: 'bg-blue-100' },
    { key: 'winners', label: t('winners'), icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { key: 'uniqueProducts', label: t('products'), icon: Package, color: 'text-amber-600', bg: 'bg-amber-100' },
    { key: 'uniqueSuppliers', label: t('suppliers'), icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-100' },
    { key: 'avgPrice', label: t('avgPrice'), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100', format: (v: number) => v > 0 ? `${Math.round(v).toLocaleString()} ETB` : '—' },
    { key: 'totalVolume', label: t('totalVolume'), icon: Award, color: 'text-pink-600', bg: 'bg-pink-100', format: (v: number) => v > 0 ? `${Math.round(v).toLocaleString()} kg` : '—' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(c => (
          <div key={c.key} className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${c.bg}`}></div>
              <div className="h-3 w-16 bg-slate-200 rounded"></div>
            </div>
            <div className="h-7 w-20 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">Error loading data: {error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div
          key={c.key}
          className="rounded-xl bg-white border border-slate-200 p-4 hover:border-blue-300 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${c.bg}`}>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{c.label}</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {c.format ? c.format(stats[c.key as keyof TodayStats] as number) : (stats[c.key as keyof TodayStats] as number).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
