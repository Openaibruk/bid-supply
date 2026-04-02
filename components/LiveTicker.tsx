'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format, subHours, parseISO } from 'date-fns';

interface TickerBid {
  id: string;
  product_name: string;
  bid_price: number;
  supplier_name: string;
  is_winner: boolean;
  created_at: string;
}

async function fetchRecentBids(): Promise<TickerBid[]> {
  const since = subHours(new Date(), 4);
  const { data, error } = await supabase
    .from('dc_bids')
    .select('id, bid_price, is_winner, created_at, product_id, supplier_id')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(30);
  if (error || !data) return [];

  const productIds = [...new Set(data.map(b => b.product_id))];
  const supplierIds = [...new Set(data.map(b => b.supplier_id))];

  const [products, suppliers] = await Promise.all([
    supabase.from('products').select('product_id, product_name').in('product_id', productIds as number[]),
    supabase.from('dc_suppliers').select('supplier_id, supplier_name').in('supplier_id', supplierIds as number[]),
  ]);

  const pMap = new Map((products.data || []).map(p => [p.product_id, p.product_name]));
  const sMap = new Map((suppliers.data || []).map(s => [s.supplier_id, s.supplier_name]));

  return data.map(b => ({
    id: b.id,
    product_name: pMap.get(b.product_id) || 'Product',
    bid_price: b.bid_price,
    supplier_name: sMap.get(b.supplier_id) || 'Supplier',
    is_winner: b.is_winner,
    created_at: b.created_at,
  }));
}

export function LiveTicker() {
  const [bids, setBids] = useState<TickerBid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentBids().then(setBids).finally(() => setLoading(false));

    const channel = supabase
      .channel('ticker')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dc_bids' }, () => {
        fetchRecentBids().then(setBids);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return (
      <div className="border-b border-slate-200 bg-slate-50 py-2 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <span className="text-xs text-slate-400">Loading live bids...</span>
        </div>
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="border-b border-slate-200 bg-slate-50 py-2 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <span className="text-xs text-slate-400">No recent bids to display</span>
        </div>
      </div>
    );
  }

  const items = [...bids, ...bids];

  return (
    <div className="border-b border-slate-200 bg-slate-50 py-2 overflow-hidden">
      <div
        className="flex gap-8 whitespace-nowrap"
        style={{
          animation: 'marquee 60s linear infinite',
          width: `${items.length * 280}px`,
        }}
      >
        {items.map((bid, i) => (
          <div key={`${bid.id}-${i}`} className="flex items-center gap-2 text-sm shrink-0">
            {bid.is_winner ? (
              <span className="text-amber-600">🏆</span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            )}
            <span className="text-slate-700 font-medium">{bid.product_name}</span>
            <span className="text-slate-400">—</span>
            <span className="text-slate-800">{bid.bid_price.toLocaleString()} ETB</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 text-xs">{bid.supplier_name}</span>
            <span className="text-slate-400 text-xs">
              {format(parseISO(bid.created_at), 'HH:mm')}
            </span>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
