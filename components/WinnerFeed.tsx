'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { Trophy } from 'lucide-react';

interface Winner {
  id: string;
  product_name: string;
  bid_price: number;
  supplier_name: string;
  volume: number | null;
  created_at: string;
}

export function WinnerFeed() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWinners();

    const channel = supabase
      .channel('winners')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dc_bids', filter: 'is_winner=eq.true' },
        () => { fetchWinners(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchWinners() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('dc_bids')
        .select('id, bid_price, volume, created_at, product_id, supplier_id')
        .eq('is_winner', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (!data) {
        setWinners([]);
        setLoading(false);
        return;
      }

      const productIds = [...new Set(data.map(b => b.product_id))];
      const supplierIds = [...new Set(data.map(b => b.supplier_id))];

      const [products, suppliers] = await Promise.all([
        supabase.from('products').select('product_id, product_name').in('product_id', productIds as number[]),
        supabase.from('dc_suppliers').select('supplier_id, supplier_name').in('supplier_id', supplierIds),
      ]);

      const pMap = new Map((products.data || []).map(p => [p.product_id, p.product_name]));
      const sMap = new Map((suppliers.data || []).map(s => [s.supplier_id, s.supplier_name]));

      setWinners(data.map(b => ({
        id: b.id,
        product_name: pMap.get(b.product_id) || 'Unknown',
        bid_price: b.bid_price,
        supplier_name: sMap.get(b.supplier_id) || 'Unknown',
        volume: b.volume,
        created_at: b.created_at,
      })));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-slate-300" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Recent Winners</h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <div className="w-3.5 h-3.5 bg-amber-200 rounded animate-pulse" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse" />
              </div>
              <div className="text-right space-y-2">
                <div className="h-4 bg-slate-200 rounded w-16 ml-auto animate-pulse" />
                <div className="h-3 bg-slate-100 rounded w-12 ml-auto animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Recent Winners</h2>
      </div>
      {error ? (
        <div className="text-center py-8">
          <p className="text-sm font-medium text-red-800 mb-1">Failed to load winners</p>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      ) : winners.length === 0 ? (
        <div className="text-center py-8">
          <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">No winners yet today</p>
          <p className="text-xs text-slate-500 mt-1">Winning bids will be announced here after each cycle closes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {winners.map((w) => (
            <div
              key={w.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{w.product_name}</p>
                <p className="text-xs text-slate-500 truncate">
                  {w.supplier_name}{w.volume ? ` • ${w.volume}kg` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-amber-600">{w.bid_price.toLocaleString()} ETB</p>
                <p className="text-xs text-slate-500">
                  {format(parseISO(w.created_at), 'HH:mm')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}