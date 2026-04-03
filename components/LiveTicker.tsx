'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TickerBid {
  id: string;
  product_name: string;
  supplier_name: string;
  bid_price: number;
  created_at: string;
  is_winner: boolean;
}

export function LiveTicker() {
  const [bids, setBids] = useState<TickerBid[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const FOUR_HOURS_AGO = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const DAY_AGO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    async function fetchBids() {
      let { data } = await supabase
        .from('dc_bids')
        .select('id, product_name, supplier_name, bid_price, created_at, is_winner')
        .gte('created_at', FOUR_HOURS_AGO)
        .order('created_at', { ascending: false })
        .limit(30);
      if (!data || data.length === 0) {
        // Fallback: extend window to 24h
        ({ data } = await supabase
          .from('dc_bids')
          .select('id, product_name, supplier_name, bid_price, created_at, is_winner')
          .gte('created_at', DAY_AGO)
          .order('created_at', { ascending: false })
          .limit(30));
      }
      if (data) setBids(data as any[]);
    }

    fetchBids();

    const channel = supabase
      .channel('ticker')
      .on(
        'postgres_changes',
        { event: 'INSERT', table: 'dc_bids', schema: '*' },
        (payload) => {
          const newBid = payload.new as any;
          setBids((prev) => [newBid, ...prev].slice(0, 30));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (bids.length === 0) {
    return (
      <div className="border-b border-slate-200 bg-slate-50 py-2 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <span className="text-xs text-slate-500">No recent bids to display</span>
        </div>
      </div>
    );
  }

  const items = [...bids, ...bids.map(b => ({ ...b, _ariaHidden: true }))];

  return (
    <div
      className="border-b border-slate-200 bg-slate-50 py-2 overflow-hidden relative"
      role="marquee"
      aria-label="Recent bids"
      aria-live="polite"
    >
      <div
        className="flex gap-8 whitespace-nowrap"
        style={{
          animation: `marquee 60s linear infinite`,
          animationPlayState: paused ? 'paused' : 'running',
          width: 'fit-content',
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {items.map((bid, i) => (
          <div
            key={`${bid.id}-${i}`}
            aria-hidden={bid._ariaHidden ? true : undefined}
            className="flex items-center gap-2 text-sm shrink-0"
          >
            {bid.is_winner ? (
              <span className="text-green-600">🏆</span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
            )}
            <span className="text-slate-900 font-medium max-w-[120px] truncate">{bid.product_name}</span>
            <span className="text-slate-400">—</span>
            <span className="text-slate-900">{bid.bid_price.toLocaleString()} ETB</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 text-xs">{bid.supplier_name}</span>
            <span className="text-slate-500 text-xs">{format(parseISO(bid.created_at), 'HH:mm')}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="marquee"] {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}