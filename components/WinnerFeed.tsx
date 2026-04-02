'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { Trophy } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

interface Winner {
  id: string;
  product_name: string;
  bid_price: number;
  supplier_name: string;
  volume: number | null;
  created_at: string;
}

export function WinnerFeed() {
  const { t } = useLang();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from('dc_bids')
          .select('id, bid_price, volume, created_at, product_id, supplier_id')
          .eq('is_winner', true)
          .order('created_at', { ascending: false })
          .limit(10);
        if (!data) return;
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
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();

    const channel = supabase
      .channel('winners')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dc_bids', filter: 'is_winner=eq.true' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

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
              <div className="w-8 h-8 rounded-full bg-slate-100" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-slate-100 rounded mb-1" />
                <div className="h-3 w-20 bg-slate-50 rounded" />
              </div>
              <div className="text-right">
                <div className="h-4 w-16 bg-slate-100 rounded ml-auto" />
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
        <Trophy className="w-4 h-4 text-amber-600" />
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{t('recentWinners')}</h2>
      </div>
      {winners.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">{t('noWinnersYet')}</p>
      ) : (
        <div className="space-y-2">
          {winners.map((w) => (
            <div
              key={w.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{w.product_name}</p>
                <p className="text-xs text-slate-500 truncate">
                  {w.supplier_name}{w.volume ? ` • ${w.volume}kg` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-amber-600">{w.bid_price.toLocaleString()} ETB</p>
                <p className="text-[11px] text-slate-500">
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
