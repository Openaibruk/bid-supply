'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Trophy, TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface Supplier {
  supplier_id: number;
  supplier_name: string;
  total_bids: number;
  wins: number;
  win_rate: number;
  avg_price: number;
}

export function SupplierLeaderboard() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

    setLoading(true);
    supabase
      .from('dc_suppliers')
      .select('supplier_id, supplier_name')
      .eq('active', true)
      .then(async ({ data: supData, error: supErr }) => {
        if (supErr) {
          setError(supErr.message);
          setLoading(false);
          return;
        }
        if (!supData) {
          setSuppliers([]);
          setLoading(false);
          return;
        }

        try {
          const { data: bidsData } = await supabase
            .from('dc_bids')
            .select('supplier_id, bid_price, is_winner')
            .gte('created_at', thirtyDaysAgo);

          const bids = bidsData || [];

          const agg = new Map<number, { total_bids: number; wins: number; prices: number[] }>();
          for (const b of bids as any[]) {
            const sid = b.supplier_id;
            if (!agg.has(sid)) agg.set(sid, { total_bids: 0, wins: 0, prices: [] });
            const rec = agg.get(sid)!;
            rec.total_bids += 1;
            if (b.is_winner) rec.wins += 1;
            rec.prices.push(b.bid_price);
          }

          const results: Supplier[] = supData
            .map((s: any) => {
              const stats = agg.get(s.supplier_id);
              if (!stats) return null;
              const win_rate = stats.total_bids > 0 ? (stats.wins / stats.total_bids) * 100 : 0;
              const avg = stats.prices.length > 0 ? stats.prices.reduce((a, b) => a + b, 0) / stats.prices.length : 0;
              return {
                supplier_id: s.supplier_id,
                supplier_name: s.supplier_name,
                total_bids: stats.total_bids,
                wins: stats.wins,
                win_rate,
                avg_price: avg,
              } as Supplier;
            })
            .filter((s): s is Supplier => s !== null)
            .sort((a, b) => b.wins - a.wins)
            .slice(0, 10);

          setSuppliers(results);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      });
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  if (loading) {
    return (
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-slate-300" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Supplier Leaderboard</h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
              <div className="w-8 h-6 bg-slate-200 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
                <div className="flex gap-4">
                  <div className="h-3 bg-slate-100 rounded w-12 animate-pulse" />
                  <div className="h-3 bg-slate-100 rounded w-12 animate-pulse" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-4 bg-slate-200 rounded w-10 ml-auto animate-pulse" />
                <div className="h-3 bg-slate-100 rounded w-16 ml-auto animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm font-medium text-red-800 mb-1">Failed to load supplier leaderboard</p>
        <p className="text-xs text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-cyan-600" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Supplier Leaderboard</h2>
        <span className="text-[11px] text-slate-500 ml-auto">Last 30 days</span>
      </div>
      {suppliers.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">No supplier data yet</p>
          <p className="text-xs text-slate-500 mt-1">Supplier statistics will appear once bids are recorded</p>
        </div>
      ) : (
        <div className="space-y-2">
          {suppliers.map((s, i) => (
            <div
              key={s.supplier_id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-slate-50 ${
                i === 0 ? 'bg-amber-50 border-amber-200' :
                i === 1 ? 'bg-slate-50 border-slate-200' :
                i === 2 ? 'bg-orange-50 border-orange-200' :
                'bg-white border-slate-200'
              }`}
            >
              <span className="text-lg w-8 text-center">{i < 3 ? medals[i] : <span className="text-slate-500 text-sm">{i + 1}</span>}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{s.supplier_name}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-slate-400" />
                    {s.total_bids} bids
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-slate-400" />
                    {s.wins} wins
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-green-600">{s.win_rate.toFixed(0)}%</p>
                {s.avg_price > 0 && (
                  <p className="text-xs text-slate-500">{Math.round(s.avg_price).toLocaleString()} ETB</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}