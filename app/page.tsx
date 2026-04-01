'use client';

import { useEffect, useState, useCallback } from 'react';

/* ─── Supabase REST API (no SDK dependency) ─── */
const API = 'https://ckckcqszswqcyswctkab.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrY2tjcXN6c3dxY3lzd2N0a2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3Mjk3NjEsImV4cCI6MjA2NTMwNTc2MX0.av4gcddK_C9PO4KbzjjxwqLed2RCHVTSEhjHZt0hZAM';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const q = (path: string) => fetch(`${API}/${path}`, { headers: H }).then(r => r.json());

/* ─── types ─── */
interface Bid { id: string; bid_price: number; is_winner: boolean; product_id: number; supplier_id: number; created_at: string; }
interface Prod { product_id: number; product_name: string; }
interface Supp { supplier_id: number; supplier_name: string; }
interface Cycle { cycle_id: string; cycle_name: string; starts_at: string; ends_at: string; }

/* ─── i18n ─── */
const dict: Record<string, Record<string, string>> = {
  en: {
    title: 'Bid Supply',
    live: 'LIVE',
    todayBids: "Today's Bids",
    products: 'Products',
    suppliers: 'Suppliers',
    activeCycles: 'Active Cycles',
    winners: 'Winners',
    priceTrend: 'Price Trend',
    bidActivity: 'Bid Activity',
    supplierRank: 'Supplier Standings',
    cycleProgress: 'Cycle Progress',
    latestWinners: 'Latest Winners',
    noData: 'No data yet',
    remaining: 'remaining',
    bids: 'bids',
    updated: 'Updated',
    etb: 'ETB',
    total: 'total',
    registered: 'registered',
    lang: 'Language',
  },
  am: {
    title: 'ቢድ ሳፕላይ',
    live: 'ቀጥታ',
    todayBids: 'ዛሬ የገቡ ዋጋዎች',
    products: 'ምርቶች',
    suppliers: 'አቅራቢዎች',
    activeCycles: 'ንቁ ዑደቶች',
    winners: 'አሸናፊዎች',
    priceTrend: 'ዋጋ አዝማሚያ',
    bidActivity: 'ዋጋ እንቅስቃሴ',
    supplierRank: 'የአቅራቢ ደረጃ',
    cycleProgress: 'የዑደት ሂደት',
    latestWinners: 'የቅርብ ጊዜ አሸናፊዎች',
    noData: 'ዳታ የለም',
    remaining: 'ቀርቷል',
    bids: 'ዋጋዎች',
    updated: 'የተሻሻለ',
    etb: 'ብር',
    total: 'ጠቅላላ',
    registered: 'የተመዘገቡ',
    lang: 'ቋንቋ',
  },
};

function t(lang: string, key: string) {
  return dict[lang]?.[key] ?? key;
}

/* ═══════════════════════════════════════════════
   LIVE TICKER
   ═══════════════════════════════════════════════ */
function Ticker({ bids, pMap, sMap, lang }: { bids: Bid[]; pMap: (n: number) => string; sMap: (n: number) => string; lang: string }) {
  const items = [...bids, ...bids];
  return (
    <div className="overflow-hidden border-b border-zinc-800/50 bg-zinc-900/40">
      <div className="flex gap-10 py-2.5 whitespace-nowrap" style={{ animation: 'ticker 60s linear infinite', width: `${items.length * 300}px` }}>
        {items.map((b, i) => (
          <span key={`${b.id}-${i}`} className="inline-flex items-center gap-2 text-sm">
            {b.is_winner ? <span className="text-amber-400">🏆</span> : <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />}
            <span className="text-zinc-300">{pMap(b.product_id)}</span>
            <span className="text-indigo-400 font-mono font-semibold">{b.bid_price.toLocaleString()}</span>
            <span className="text-zinc-600 text-xs">{t(lang, 'etb')}</span>
            <span className="text-zinc-500 text-xs">• {sMap(b.supplier_id)}</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(calc(-50%))}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PRICE RANGE CHART (Pure SVG)
   ═══════════════════════════════════════════════ */
function PriceChart({ bids, lang }: { bids: Bid[]; lang: string }) {
  const daily = (() => {
    const map: Record<string, number[]> = {};
    const cutoff = Date.now() - 14 * 86400000;
    bids.filter(b => new Date(b.created_at).getTime() >= cutoff).forEach(b => {
      const d = b.created_at.slice(5, 10);
      if (!map[d]) map[d] = [];
      map[d].push(b.bid_price);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
      .map(([date, prices]) => ({ date, avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length), min: Math.min(...prices), max: Math.max(...prices), count: prices.length }));
  })();

  if (!daily.length) return <div className="text-zinc-600 text-sm py-10 text-center">{t(lang, 'noData')}</div>;

  const W = 600, H = 180, PAD = 30;
  const maxVal = Math.max(...daily.map(d => d.max), 1);
  const minVal = Math.min(...daily.map(d => d.min), 0);
  const range = maxVal - minVal || 1;
  const xStep = (W - PAD * 2) / (daily.length - 1 || 1);

  const toY = (v: number) => H - PAD - ((v - minVal) / range) * (H - PAD * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full h-[200px]">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = toY(minVal + pct * range);
        return <g key={pct}>
          <line x1={PAD} x2={W - PAD} y1={y} y2={y} stroke="#27272a" strokeWidth={0.5} />
          <text x={PAD - 4} y={y + 3} textAnchor="end" fontSize={8} fill="#52525b">{Math.round(minVal + pct * range)}</text>
        </g>;
      })}
      {/* Range area */}
      <path
        d={daily.map((d, i) => `${i === 0 ? 'M' : 'L'}${PAD + i * xStep} ${toY(d.max)}`).join(' ') +
          daily.slice().reverse().map((d, i) => ` L${PAD + (daily.length - 1 - i) * xStep} ${toY(d.min)}`).join(' ') + ' Z'}
        fill="url(#rangeGrad)" opacity={0.3} />
      {/* Avg line */}
      <path
        d={daily.map((d, i) => `${i === 0 ? 'M' : 'L'}${PAD + i * xStep} ${toY(d.avg)}`).join(' ')}
        fill="none" stroke="#818cf8" strokeWidth={2} strokeLinecap="round" />
      {/* Dots */}
      {daily.map((d, i) => (
        <g key={i}>
          <circle cx={PAD + i * xStep} cy={toY(d.avg)} r={3} fill="#818cf8" />
          <text x={PAD + i * xStep} y={H + 12} textAnchor="middle" fontSize={8} fill="#52525b">{d.date.slice(3)}</text>
        </g>
      ))}
      <defs>
        <linearGradient id="rangeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   BID VOLUME BARS
   ═══════════════════════════════════════════════ */
function VolumeChart({ bids }: { bids: Bid[] }) {
  const daily = (() => {
    const map: Record<string, number> = {};
    const cutoff = Date.now() - 14 * 86400000;
    bids.filter(b => new Date(b.created_at).getTime() >= cutoff).forEach(b => {
      const d = b.created_at.slice(5, 10);
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([date, count]) => ({ date, count }));
  })();

  if (!daily.length) return null;
  const maxC = Math.max(...daily.map(d => d.count), 1);

  return (
    <div className="flex items-end gap-1 h-[100px]">
      {daily.map(d => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group/bar">
          <div className="w-full rounded-t bg-gradient-to-t from-indigo-700/30 to-indigo-500/15 group-hover/bar:from-indigo-600/50 transition-all cursor-default"
            style={{ height: `${Math.max(6, (d.count / maxC) * 100)}%` }}>
            <span className="opacity-0 group-hover/bar:opacity-100 text-[9px] text-indigo-300 flex justify-center pt-0.5">{d.count}</span>
          </div>
          <span className="text-[8px] text-zinc-700 leading-none">{d.date.slice(3)}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */
export default function Home() {
  const [lang, setLang] = useState<'en' | 'am'>('en');
  const [ready, setReady] = useState(false);
  const [bids, setBids] = useState<Bid[]>([]);
  const [products, setProducts] = useState<Prod[]>([]);
  const [suppliers, setSuppliers] = useState<Supp[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [lastUpdate, setLastUpdate] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'rankings'>('overview');

  const pMap = useCallback((id: number) => products.find(p => p.product_id === id)?.product_name || '—', [products]);
  const sMap = useCallback((id: number) => suppliers.find(s => s.supplier_id === id)?.supplier_name || '—', [suppliers]);

  useEffect(() => {
    async function load() {
      try {
        const [p, s, c, b] = await Promise.all([
          q('products?select=product_id,product_name&limit=300'),
          q('dc_suppliers?select=supplier_id,supplier_name&limit=300'),
          q('dc_bidding_cycles?select=cycle_id,cycle_name,starts_at,ends_at&order=ends_at.asc'),
          q('dc_bids?select=id,bid_price,is_winner,product_id,supplier_id,created_at&order=created_at.desc&limit=200'),
        ]);
        setProducts(p || []);
        setSuppliers(s || []);
        setCycles(c || []);
        setBids(b || []);
        setLastUpdate(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        console.error('Load failed:', e);
      } finally {
        setReady(true);
      }
    }
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  /* ─── derived stats ─── */
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBids = bids.filter(b => b.created_at.startsWith(todayStr));
  const winners = todayBids.filter(b => b.is_winner);

  /* ─── active cycles ─── */
  const now = Date.now();
  const activeCycles = cycles.filter(c => new Date(c.starts_at).getTime() <= now && new Date(c.ends_at).getTime() >= now);

  /* ─── supplier leaderboard ─── */
  const leaderboard = (() => {
    const agg: Record<number, { bids: number; wins: number }> = {};
    bids.forEach(b => {
      if (!agg[b.supplier_id]) agg[b.supplier_id] = { bids: 0, wins: 0 };
      agg[b.supplier_id].bids++;
      if (b.is_winner) agg[b.supplier_id].wins++;
    });
    return Object.entries(agg)
      .map(([id, v]) => ({ id: Number(id), ...v, rate: v.bids > 0 ? (v.wins / v.bids) * 100 : 0 }))
      .filter(r => r.bids > 1)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 8);
  })();

  /* ─── recent winners ─── */
  const recentWinners = bids.filter(b => b.is_winner).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);

  const L = (key: string) => t(lang, key);
  const medals = ['🥇', '🥈', '🥉'];

  /* ═══════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.06), transparent)' }} />

      {/* ─── HEADER ─── */}
      <header className="relative sticky top-0 z-50 border-b border-white/[0.05] bg-[#050508]/90 backdrop-blur-2xl">
        <div className="max-w-[1200px] mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-xs">BS</span>
            </div>
            <span className="font-bold text-sm tracking-tight">{L('title')}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-zinc-600">{L('updated')} {lastUpdate}</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-400">{L('live')}</span>
            </div>
            {/* Language toggle */}
            <button
              onClick={() => setLang(l => l === 'en' ? 'am' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-xs text-zinc-300 hover:bg-zinc-700/60 hover:text-white transition-all"
            >
              {lang === 'en' ? '🇪🇹 አማ' : '🇬🇧 EN'}
            </button>
          </div>
        </div>
      </header>

      {!ready ? (
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <span className="text-indigo-400">●</span>
            </div>
            <p className="text-zinc-600 text-sm">Loading…</p>
          </div>
        </div>
      ) : (
        <>
          {/* ─── LIVE TICKER ─── */}
          {bids.length > 0 && <Ticker bids={bids} pMap={pMap} sMap={sMap} lang={lang} />}

          <main className="max-w-[1200px] mx-auto px-5 py-5 space-y-5">
            {/* ─── TAB NAV ─── */}
            <div className="flex gap-1 bg-zinc-900/40 p-1 rounded-xl border border-white/[0.04] w-fit">
              {([['overview', '📊'], ['charts', '📈'], ['rankings', '🏅']] as const).map(([key, icon]) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === key
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}>
                  {icon} {key === 'overview' ? L('todayBids').split(' ').slice(0, 2).join(' ') : key === 'charts' ? L('priceTrend') : L('supplierRank')}
                </button>
              ))}
            </div>

            {/* ═══ OVERVIEW TAB ═══ */}
            {activeTab === 'overview' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Stat row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: L('todayBids'), val: todayBids.length, sub: `${winners.length} ${L('winners')}` },
                    { label: L('products'), val: new Set(todayBids.map(b => b.product_id)).size, sub: `${products.length} ${L('total')}` },
                    { label: L('suppliers'), val: new Set(todayBids.map(b => b.supplier_id)).size, sub: `${suppliers.length} ${L('registered')}` },
                    { label: L('activeCycles'), val: activeCycles.length, sub: `${cycles.length} ${L('total')}` },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl bg-zinc-900/50 border border-white/[0.05] p-4 hover:border-white/[0.1] transition-colors">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
                      <p className="text-2xl font-bold mt-0.5">{s.val}</p>
                      <p className="text-[10px] text-zinc-600 mt-1">{s.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Winners */}
                <section className="rounded-xl bg-zinc-900/50 border border-white/[0.05] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span>🏆</span>
                    <h2 className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">{L('latestWinners')}</h2>
                    <div className="flex-1 h-px bg-white/[0.04]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recentWinners.map(w => (
                      <div key={w.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors">
                        <span className="text-amber-400 text-sm shrink-0">🏆</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-100 truncate">{pMap(w.product_id)}</p>
                          <p className="text-[10px] text-zinc-600 truncate">{sMap(w.supplier_id)}</p>
                        </div>
                        <span className="text-sm font-bold text-amber-400 font-mono">{w.bid_price.toLocaleString()}</span>
                      </div>
                    ))}
                    {recentWinners.length === 0 && <p className="text-zinc-700 text-sm py-4">{L('noData')}</p>}
                  </div>
                </section>
              </div>
            )}

            {/* ═══ CHARTS TAB ═══ */}
            {activeTab === 'charts' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <section className="rounded-xl bg-zinc-900/50 border border-white/[0.05] p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span>📊</span>
                      <h2 className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">{L('priceTrend')}</h2>
                    </div>
                    <PriceChart bids={bids} lang={lang} />
                  </section>
                  <section className="rounded-xl bg-zinc-900/50 border border-white/[0.05] p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span>📈</span>
                      <h2 className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">{L('bidActivity')}</h2>
                    </div>
                    <VolumeChart bids={bids} />
                  </section>
                </div>

                {/* Cycles */}
                <section className="rounded-xl bg-zinc-900/50 border border-white/[0.05] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span>⚡</span>
                    <h2 className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">{L('cycleProgress')}</h2>
                    <div className="flex-1 h-px bg-white/[0.04]" />
                  </div>
                  {activeCycles.length === 0 ? (
                    <p className="text-zinc-700 text-sm py-4">{L('noData')}</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeCycles.map(c => {
                        const total = Math.max(1, (new Date(c.ends_at).getTime() - new Date(c.starts_at).getTime()) / 86400000);
                        const left = Math.max(0, Math.ceil((new Date(c.ends_at).getTime() - now) / 86400000));
                        const pct = Math.min(100, ((total - left) / total) * 100);
                        return (
                          <div key={c.cycle_id}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium text-zinc-200">{c.cycle_name}</span>
                              <span className="text-[10px] text-indigo-400">{left}d {L('remaining')}</span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="flex justify-between text-[9px] text-zinc-700 mt-1">
                              <span>{c.starts_at.slice(5, 10)}</span>
                              <span>{pct.toFixed(0)}%</span>
                              <span>{c.ends_at.slice(5, 10)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* ═══ RANKINGS TAB ═══ */}
            {activeTab === 'rankings' && (
              <div className="animate-in fade-in duration-300">
                <section className="rounded-xl bg-zinc-900/50 border border-white/[0.05] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span>🏅</span>
                    <h2 className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">{L('supplierRank')}</h2>
                    <div className="flex-1 h-px bg-white/[0.04]" />
                  </div>
                  <div className="space-y-1">
                    {leaderboard.map((r, i) => (
                      <div key={r.id} className={`flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-white/[0.02] transition-colors ${
                        i === 0 ? 'bg-amber-500/[0.04]' : ''
                      }`}>
                        <span className="text-lg w-8 text-center shrink-0">{i < 3 ? medals[i] : <span className="text-zinc-700 text-xs">{i + 1}</span>}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-200 truncate">{sMap(r.id)}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] text-zinc-600">{r.bids} {L('bids')}</span>
                            <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-emerald-500/40" style={{ width: `${r.rate}%` }} />
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-emerald-400">{r.rate.toFixed(0)}%</p>
                          <p className="text-[10px] text-zinc-700">{r.wins}W</p>
                        </div>
                      </div>
                    ))}
                    {leaderboard.length === 0 && <p className="text-zinc-700 text-sm py-6 text-center">{L('noData')}</p>}
                  </div>
                </section>
              </div>
            )}

            {/* ─── FOOTER ─── */}
            <footer className="border-t border-white/[0.04] pt-5 pb-6 text-center">
              <p className="text-[10px] text-zinc-800">Bid Supply — {bids.length.toLocaleString()} {L('bids')} {L('total')}</p>
            </footer>
          </main>
        </>
      )}
    </div>
  );
}
