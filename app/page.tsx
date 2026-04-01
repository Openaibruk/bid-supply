'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format, subDays, parseISO } from 'date-fns';

/* ─── types ─── */
interface BidRow {
  id: string;
  bid_price: number;
  volume: number | null;
  is_winner: boolean;
  product_id: number;
  supplier_id: number;
  created_at: string;
}
interface ProductRow { product_id: number; product_name: string; }
interface SupplierRow { supplier_id: number; supplier_name: string; }
interface CycleRow { cycle_id: string; cycle_name: string; starts_at: string; ends_at: string; status: string; }

/* ─── helpers ─── */
let cachedP: ProductRow[] | null = null;
let cachedS: SupplierRow[] | null = null;
const pMap = (id: number) => cachedP?.find(p => p.product_id === id)?.product_name || '—';
const sMap = (id: number) => cachedS?.find(s => s.supplier_id === id)?.supplier_name || '—';

/* ═══════════════════════════════════════════════
   LIVE TICKER
   ═══════════════════════════════════════════════ */
function LiveTicker({ bids }: { bids: BidRow[] }) {
  const items = [...bids, ...bids].map((b, i) => (
    <div key={`${b.id}-${i}`} className="flex items-center gap-2 text-sm shrink-0">
      <span className={b.is_winner ? '' : 'w-2 h-2 rounded-full bg-zinc-600 shrink-0'}>
        {b.is_winner ? '🏆' : ''}
      </span>
      <span className="text-zinc-300 font-medium">{pMap(b.product_id)}</span>
      <span className="text-zinc-500">—</span>
      <span className="text-zinc-300">{b.bid_price.toLocaleString()} ETB</span>
      <span className="text-zinc-600">|</span>
      <span className="text-zinc-500 text-xs">{sMap(b.supplier_id)}</span>
    </div>
  ));

  return (
    <div className="border-b border-zinc-800/60 bg-zinc-900/30 overflow-hidden">
      <div
        className="flex gap-8 py-2 whitespace-nowrap"
        style={{ animation: 'ticker 60s linear infinite', width: `${items.length * 280}px` }}
      >
        {items}
      </div>
      <style>{`@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(calc(-50%))}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PRICE CHART (simple SVG)
   ═══════════════════════════════════════════════ */
function PriceChart({ bids, products }: { bids: BidRow[]; products: ProductRow[] }) {
  const daily = (() => {
    const map: Record<string, number[]> = {};
    bids.forEach(b => {
      const d = format(parseISO(b.created_at), 'dd');
      if (!map[d]) map[d] = [];
      map[d].push(b.bid_price);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([d, prices]) => ({
        date: d,
        avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        min: Math.min(...prices),
        max: Math.max(...prices),
        count: prices.length,
      }));
  })();

  if (daily.length === 0) return null;

  const maxAvg = Math.max(...daily.map(d => d.avg), 1);
  const barW = 36;
  const chartH = 80;

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📊</span>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Avg Bid Price (Last 7 Days)</h2>
      </div>
      <div className="flex items-end gap-2 justify-center h-[100px]">
        {daily.map(d => (
          <div key={d.date} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-zinc-600">{d.avg}</span>
            <div className="rounded-t w-[36px] bg-gradient-to-t from-indigo-700 to-indigo-400 transition-all hover:from-indigo-500 hover:to-cyan-300 cursor-default"
              style={{ height: `${Math.max(4, (d.avg / maxAvg) * chartH)}px` }}
            />
            <span className="text-[10px] text-zinc-600">{d.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUPPLIER LEADERBOARD
   ═══════════════════════════════════════════════ */
function SupplierLeaderboard({ bids }: { bids: BidRow[] }) {
  const rows = (() => {
    const agg: Record<number, { bids: number; wins: number }> = {};
    bids.forEach(b => {
      if (!agg[b.supplier_id]) agg[b.supplier_id] = { bids: 0, wins: 0 };
      agg[b.supplier_id].bids++;
      if (b.is_winner) agg[b.supplier_id].wins++;
    });
    return Object.entries(agg)
      .map(([id, v]) => ({ supplier_id: Number(id), ...v, rate: v.bids > 0 ? (v.wins / v.bids) * 100 : 0 }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 8);
  })();

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🏅</span>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Supplier Standings</h2>
      </div>
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div key={r.supplier_id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-zinc-800/30">
            <span className="text-sm w-6 text-center">{i < 3 ? medals[i] : <span className="text-zinc-600">{i + 1}</span>}</span>
            <span className="flex-1 text-sm text-zinc-200 truncate">{sMap(r.supplier_id)}</span>
            <span className="text-xs text-zinc-600">{r.bids} bids</span>
            <span className="text-sm font-semibold text-green-400 w-10 text-right">{r.rate.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   WINNER FEED
   ═══════════════════════════════════════════════ */
function WinnerFeed({ bids }: { bids: BidRow[] }) {
  const winners = bids
    .filter(b => b.is_winner)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🏆</span>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Latest Winners</h2>
      </div>
      <div className="space-y-1.5">
        {winners.map(w => (
          <div key={w.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-zinc-800/30">
            <span className="text-amber-400 text-sm">🏆</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-200 truncate">{pMap(w.product_id)}</p>
              <p className="text-[11px] text-zinc-600 truncate">{sMap(w.supplier_id)}{w.volume ? ` • ${w.volume}kg` : ''}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-amber-400">{w.bid_price.toLocaleString()}</p>
              <p className="text-[10px] text-zinc-600">{format(parseISO(w.created_at), 'HH:mm')}</p>
            </div>
          </div>
        ))}
        {winners.length === 0 && <p className="text-zinc-600 text-sm py-4 text-center">No winners yet</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ACTIVE CYCLES
   ═══════════════════════════════════════════════ */
function ActiveCycles({ cycles }: { cycles: CycleRow[] }) {
  const now = new Date();
  const active = cycles.filter(c => {
    const s = new Date(c.starts_at);
    const e = new Date(c.ends_at);
    return now >= s && now <= e;
  }).slice(0, 4);

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚡</span>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Cycles</h2>
      </div>
      <div className="space-y-3">
        {active.map(c => {
          const total = (new Date(c.ends_at).getTime() - new Date(c.starts_at).getTime()) / 86400000;
          const left = Math.max(0, Math.ceil((new Date(c.ends_at).getTime() - now.getTime()) / 86400000));
          const pct = total > 0 ? ((total - left) / total) * 100 : 0;
          return (
            <div key={c.cycle_id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-200">{c.cycle_name}</p>
                <span className="text-[11px] text-indigo-400">{left}d left</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            </div>
          );
        })}
        {active.length === 0 && <p className="text-zinc-600 text-sm py-4 text-center">No active cycles</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */
export default function Home() {
  const [tickerBids, setTickerBids] = useState<BidRow[]>([]);
  const [allCycles, setAllCycles] = useState<CycleRow[]>([]);
  const [ready, setReady] = useState(false);

  /* summary numbers */
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayWinners, setTodayWinners] = useState(0);
  const [todayProducts, setTodayProducts] = useState(0);
  const [todaySuppliers, setTodaySuppliers] = useState(0);
  const [totalBids, setTotalBids] = useState(0);

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('product_id, product_name'),
      supabase.from('dc_suppliers').select('supplier_id, supplier_name'),
      supabase.from('dc_bidding_cycles').select('cycle_id, cycle_name, starts_at, ends_at, status'),
      supabase.from('dc_bids').select('*').order('created_at', { ascending: false }),
    ]).then(([pRes, sRes, cRes, bRes]) => {
      cachedP = pRes.data || [];
      const products = cachedP as ProductRow[];
      cachedS = sRes.data || [];
      const suppliers = cachedS as SupplierRow[];
      const cycles = (cRes.data || []) as CycleRow[];
      const allBids = (bRes.data || []) as BidRow[];

      /* today's stats */
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const today = allBids.filter(b => b.created_at.startsWith(todayStr));
      setTodayTotal(today.length);
      setTodayWinners(today.filter(b => b.is_winner).length);
      setTodayProducts(new Set(today.map(b => b.product_id)).size);
      setTodaySuppliers(new Set(today.map(b => b.supplier_id)).size);
      setTotalBids(allBids.length);

      /* last 30 bids for ticker */
      setTickerBids(allBids.slice(0, 30));
      setAllCycles(cycles);
      setReady(true);
    });
  }, []);

  const cards = [
    { label: 'Today\'s Bids', value: todayTotal, color: 'text-indigo-400', accent: 'border-indigo-500/20' },
    { label: 'Today\'s Winners', value: todayWinners, color: 'text-green-400', accent: 'border-green-500/20' },
    { label: 'Products Active', value: todayProducts, color: 'text-amber-400', accent: 'border-amber-500/20' },
    { label: 'Suppliers Bidding', value: todaySuppliers, color: 'text-cyan-400', accent: 'border-cyan-500/20' },
  ];

  return (
    <div className="min-h-screen bg-[#08090c]">
      {/* ─── HEADER ─── */}
      <header className="border-b border-zinc-800/60 bg-[#08090c]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">BS</span>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Bid Supply</h1>
              <p className="text-[11px] text-zinc-600">Live Bidding Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Live</span>
          </div>
        </div>
      </header>

      {!ready ? (
        <div className="flex items-center justify-center h-64">
          <span className="text-zinc-600">Loading data…</span>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* ─── LIVE TICKER ─── */}
          {tickerBids.length > 0 && <LiveTicker bids={tickerBids} />}

          {/* ─── SUMMARY CARDS ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {cards.map(c => (
              <div key={c.label} className={`rounded-xl bg-zinc-900/60 border ${c.accent} p-4`}>
                <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{c.label}</p>
                <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* ─── CHART + CYCLES ROW ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PriceChart bids={tickerBids} products={cachedP || []} />
            </div>
            <ActiveCycles cycles={allCycles} />
          </div>

          {/* ─── WINNERS + LEADERBOARD ROW ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WinnerFeed bids={tickerBids} />
            <SupplierLeaderboard bids={tickerBids} />
          </div>

          {/* ─── FOOTER ─── */}
          <footer className="border-t border-zinc-800/60 pt-6 pb-8 text-center">
            <p className="text-[11px] text-zinc-700">
              Bid Supply — Real-time product bidding transparency • {totalBids.toLocaleString()} total bids tracked
            </p>
          </footer>
        </div>
      )}
    </div>
  );
}
