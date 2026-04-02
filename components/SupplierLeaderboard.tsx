'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Trophy, TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useLang } from '@/contexts/LanguageContext';

interface Supplier {
  supplier_id: number;
  supplier_name: string;
  total_bids: number;
  wins: number;
  win_rate: number;
  avg_price: number;
}

export function SupplierLeaderboard() {
  const { t } = useLang();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        const { data } = await supabase
          .from('dc_suppliers')
          .select('supplier_id, supplier_name, active')
          .eq('active', true);
        if (!data) return;

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
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 bg-slate-200 rounded" />
          <div className="h-4 w-40 bg-slate-100 rounded"></div>
        </div>
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 animate-pulse">
              <div className="w-8 h-4 bg-slate-100 rounded" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-slate-100 rounded mb-1" />
                <div className="h-3 w-24 bg-slate-50 rounded" />
              </div>
              <div className="text-right">
                <div className="h-4 w-12 bg-slate-100 rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-blue-600" />
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{t('supplierRank')}</h2>
        <span className="text-[11px] text-slate-500 ml-auto">Last 30 days</span>
      </div>
      {suppliers.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">{t('noSupplierData')}</p>
      ) : (
        <div className="space-y-2">
          {suppliers.map((s, i) => (
            <div
              key={s.supplier_id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                i === 0 ? 'bg-amber-50 border-amber-200' :
                i === 1 ? 'bg-slate-50 border-slate-200' :
                i === 2 ? 'bg-orange-50 border-orange-200' :
                'bg-white border-slate-200'
              }`}
            >
              <span className="text-lg w-8 text-center">{i < 3 ? medals[i] : <span className="text-slate-400 text-sm">{i + 1}</span>}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{s.supplier_name}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
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
                <p className="text-sm font-semibold text-emerald-600">{s.win_rate.toFixed(0)}%</p>
                {s.avg_price > 0 && (
                  <p className="text-[11px] text-slate-500">{Math.round(s.avg_price).toLocaleString()} ETB</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
