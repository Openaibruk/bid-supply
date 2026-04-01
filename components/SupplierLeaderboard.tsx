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

  useEffect(() => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    
    supabase
      .from('dc_suppliers')
      .select('supplier_id, supplier_name, active')
      .eq('active', true)
      .then(async ({ data, error }) => {
        if (error || !data) return;

        const results = await Promise.all(
          (data as any[]).map(async (s) => {
            const { data: bids } = await supabase
              .from('dc_bids')
              .select('bid_price, is_winner')
              .eq('supplier_id', s.supplier_id)
              .gte('created_at', thirtyDaysAgo);

            const all = bids || [];
            const wins = all.filter(b => b.is_winner).length;
            const prices = all.map(b => b.bid_price);
            const avg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

            return {
              supplier_id: s.supplier_id,
              supplier_name: s.supplier_name,
              total_bids: all.length,
              wins,
              win_rate: all.length > 0 ? (wins / all.length) * 100 : 0,
              avg_price: avg,
            } as Supplier;
          })
        );

        setSuppliers(results.filter(s => s.total_bids > 0).sort((a, b) => b.wins - a.wins).slice(0, 10));
      });
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/60 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-cyan-400" />
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Supplier Leaderboard</h2>
        <span className="text-[11px] text-zinc-600 ml-auto">Last 30 days</span>
      </div>
      {suppliers.length === 0 ? (
        <p className="text-sm text-zinc-600 text-center py-8">No supplier data yet</p>
      ) : (
        <div className="space-y-2">
          {suppliers.map((s, i) => (
            <div
              key={s.supplier_id}
              className={`slide-in flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                i === 0 ? 'bg-amber-500/5 border-amber-500/20' :
                i === 1 ? 'bg-zinc-800/30 border-zinc-700/30' :
                i === 2 ? 'bg-orange-500/5 border-orange-500/15' :
                'bg-zinc-800/20 border-zinc-800/40'
              }`}
            >
              <span className="text-lg w-8 text-center">{i < 3 ? medals[i] : <span className="text-zinc-600 text-sm">{i + 1}</span>}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{s.supplier_name}</p>
                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {s.total_bids} bids
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    {s.wins} wins
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-green-400">{s.win_rate.toFixed(0)}%</p>
                {s.avg_price > 0 && (
                  <p className="text-[11px] text-zinc-600">{Math.round(s.avg_price).toLocaleString()} ETB</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
