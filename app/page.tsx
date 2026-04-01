'use client';

import { useEffect, useState, useCallback } from 'react';

const API = 'https://ckckcqszswqcyswctkab.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrY2tjcXN6c3dxY3lzd2N0a2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3Mjk3NjEsImV4cCI6MjA2NTMwNTc2MX0.av4gcddK_C9PO4KbzjjxwqLed2RCHVTSEhjHZt0hZAM';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

interface Bid { id: string; bid_price: number; is_winner: boolean; product_id: number; supplier_id: number; created_at: string; }
interface Prod { product_id: number; product_name: string; }
interface Supp { supplier_id: number; supplier_name: string; }
interface Cycle { cycle_id: string; cycle_name: string; starts_at: string; ends_at: string; }

const D: Record<string, Record<string, string>> = {
  en: { title:'Bid Supply', live:'LIVE', bids:'Bids', products:'Products', suppliers:'Suppliers', cycles:'Cycles', winners:'Winners', overview:'Overview', charts:'Price Trends', rankings:'Rankings', latestWinners:'Recent Winners', supplierRank:'Supplier Standings', priceTrend:'Avg Bid Price', bidVol:'Bid Volume', cycleProgress:'Active Cycles', noData:'No data yet', etb:'ETB', remaining:'left', total:'total', registered:'registered', updated:'Updated', error:'Something went wrong', retry:'Retry' },
  am: { title:'ቢድ ሳፕላይ', live:'ቀጥታ', bids:'ዋጋዎች', products:'ምርቶች', suppliers:'አቅራቢዎች', cycles:'ዑደቶች', winners:'አሸናፊዎች', overview:'አጠቃላይ', charts:'ዋጋ አዝማሚያ', rankings:'ደረጃ', latestWinners:'የቅርብ አሸናፊዎች', supplierRank:'የአቅራቢ ደረጃ', priceTrend:'አማካይ ዋጋ', bidVol:'የዋጋ ብዛት', cycleProgress:'ንቁ ዑደቶች', noData:'ዳታ የለም', etb:'ብር', remaining:'ቀርቷል', total:'ጠቅላላ', registered:'የተመዘገቡ', updated:'የተሻሻለ', error:'ስህተት ተከስቷል', retry:'እንደገና ይሞክሩ' },
};
const T = (lang: string, key: string) => D[lang]?.[key] ?? key;

/* ─── SVG Price Chart ─── */
function PriceChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) return null;
  const W = 520, H = 140, P = 28;
  const mx = Math.max(...data.map(d => d.value), 1);
  const mn = 0;
  const rng = mx - mn || 1;
  const sx = (W - P * 2) / Math.max(data.length - 1, 1);
  const ty = (v: number) => H - P - ((v - mn) / rng) * (H - P * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H + 14}`} className="w-full">
      {[0, .5, 1].map(p => {
        const y = ty(mn + p * rng);
        return <g key={p}>
          <line x1={P} x2={W - P} y1={y} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={.5} />
          <text x={P - 6} y={y + 3} textAnchor="end" fontSize={7} fill="rgba(255,255,255,0.2)">{Math.round(mn + p * rng)}</text>
        </g>;
      })}
      <path d={data.map((d, i) => `${i ? 'L' : 'M'}${P + i * sx} ${ty(d.value)}`).join(' ')}
        fill="none" stroke="url(#lineGrad)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={data.map((d, i) => `${i ? 'L' : 'M'}${P + i * sx} ${ty(d.value)}`).join(' ') +
        ` L${P + (data.length - 1) * sx} ${H - P} L${P} ${H - P} Z`}
        fill="url(#areaGrad)" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={P + i * sx} cy={ty(d.value)} r={3} fill="#818cf8" stroke="#0a0a0f" strokeWidth={2} />
          <text x={P + i * sx} y={H + 10} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.2)">{d.label.slice(3)}</text>
        </g>
      ))}
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#a78bfa" /></linearGradient>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity={0.15} /><stop offset="100%" stopColor="#818cf8" stopOpacity={0} /></linearGradient>
      </defs>
    </svg>
  );
}

/* ─── SVG Volume Bars ─── */
function VolChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) return null;
  const W = 520, H = 80, P = 28;
  const mx = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(8, (W - P * 2) / data.length - 6);

  return (
    <svg viewBox={`0 0 ${W} ${H + 14}`} className="w-full">
      {data.map((d, i) => {
        const h = Math.max(3, (d.value / mx) * (H - 6));
        const x = P + i * ((W - P * 2) / data.length) + 3;
        return <g key={i}>
          <rect x={x} y={H - h} width={barW} height={h} rx={3} fill="url(#barGrad)" />
          <text x={x + barW / 2} y={H + 10} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.2)">{d.label.slice(3)}</text>
        </g>;
      })}
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity={0.7} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.1} /></linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Ticker ─── */
function Ticker({ bids, pMap, sMap, lang }: { bids: Bid[]; pMap: (n: number) => string; sMap: (n: number) => string; lang: string }) {
  const items = [...bids, ...bids];
  return (
    <div className="overflow-hidden border-b border-white/[0.04] bg-white/[0.01]">
      <div className="flex gap-8 py-2.5 whitespace-nowrap" style={{ animation: 'tick 50s linear infinite', width: `${items.length * 260}px` }}>
        {items.slice(0, 60).map((b, i) => (
          <span key={`${b.id}-${i}`} className="inline-flex items-center gap-2 text-[12px]">
            {b.is_winner
              ? <span className="text-amber-400">🏆</span>
              : <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />}
            <span className="text-white/70 font-medium">{pMap(b.product_id)}</span>
            <span className="text-indigo-400 font-semibold font-mono">{b.bid_price.toLocaleString()}</span>
            <span className="text-white/20">{T(lang, 'etb')}</span>
            <span className="text-white/15">·</span>
            <span className="text-white/30">{sMap(b.supplier_id)}</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes tick{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

/* ─── Glass Card ─── */
function Glass({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.015] to-transparent pointer-events-none" />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN
   ═══════════════════════════════════════ */
export default function Home() {
  const [lang, setLang] = useState<'en' | 'am'>('en');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [bids, setBids] = useState<Bid[]>([]);
  const [products, setProducts] = useState<Prod[]>([]);
  const [suppliers, setSuppliers] = useState<Supp[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [tab, setTab] = useState(0);
  const [updated, setUpdated] = useState('');

  const pMap = useCallback((id: number) => {
    const p = products.find(p => Number(p.product_id) === Number(id));
    return p?.product_name || `#${id}`;
  }, [products]);

  const sMap = useCallback((id: number) => {
    const s = suppliers.find(s => Number(s.supplier_id) === Number(id));
    return s?.supplier_name || `#${id}`;
  }, [suppliers]);

  useEffect(() => {
    async function load() {
      try {
        const [p, s, c, b] = await Promise.all([
          fetch(`${API}/products?select=product_id,product_name&limit=300`, { headers: H }).then(r => r.json()),
          fetch(`${API}/dc_suppliers?select=supplier_id,supplier_name&limit=300`, { headers: H }).then(r => r.json()),
          fetch(`${API}/dc_bidding_cycles?select=cycle_id,cycle_name,starts_at,ends_at&order=ends_at.asc`, { headers: H }).then(r => r.json()),
          fetch(`${API}/dc_bids?select=id,bid_price,is_winner,product_id,supplier_id,created_at&order=created_at.desc&limit=300`, { headers: H }).then(r => r.json()),
        ]);
        setProducts(Array.isArray(p) ? p : []);
        setSuppliers(Array.isArray(s) ? s : []);
        setCycles(Array.isArray(c) ? c : []);
        setBids(Array.isArray(b) ? b : []);
        setUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setReady(true);
      }
    }
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const L = (k: string) => T(lang, k);
  const now = Date.now();
  const activeCycles = cycles.filter(c => new Date(c.starts_at).getTime() <= now && new Date(c.ends_at).getTime() >= now);
  const winners = bids.filter(b => b.is_winner);
  const recentWinners = [...winners].slice(0, 8);
  const uniqueProds = new Set(bids.map(b => b.product_id));
  const uniqueSupps = new Set(bids.map(b => b.supplier_id));

  const leaderboard = (() => {
    const agg: Record<number, { bids: number; wins: number }> = {};
    bids.forEach(b => {
      if (!agg[b.supplier_id]) agg[b.supplier_id] = { bids: 0, wins: 0 };
      agg[b.supplier_id].bids++;
      if (b.is_winner) agg[b.supplier_id].wins++;
    });
    return Object.entries(agg).map(([id, v]) => ({ id: +id, ...v, rate: v.bids ? (v.wins / v.bids) * 100 : 0 }))
      .filter(r => r.bids > 0).sort((a, b) => b.wins - a.wins).slice(0, 10);
  })();

  const volData = (() => {
    const map: Record<string, number> = {};
    const cutoff = Date.now() - 14 * 86400000;
    bids.filter(b => new Date(b.created_at).getTime() >= cutoff).forEach(b => {
      const d = b.created_at.slice(5, 10);
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([d, c]) => ({ label: d, value: c }));
  })();

  const priceData = (() => {
    const map: Record<string, number[]> = {};
    const cutoff = Date.now() - 14 * 86400000;
    bids.filter(b => new Date(b.created_at).getTime() >= cutoff).forEach(b => {
      const d = b.created_at.slice(5, 10);
      if (!map[d]) map[d] = [];
      map[d].push(b.bid_price);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
      .map(([d, prices]) => ({ label: d, value: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) }));
  })();

  const medals = ['🥇', '🥈', '🥉'];
  const tabs = [L('overview'), L('charts'), L('rankings')];

  if (!ready && !error) return (
    <div className="min-h-screen bg-[#08080c] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-indigo-400 font-black text-sm">BS</span>
        </div>
        <p className="text-white/20 text-sm">Connecting…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#08080c] flex items-center justify-center">
      <div className="text-center p-8 rounded-2xl bg-white/[0.02] border border-red-500/20 max-w-sm">
        <p className="text-red-400 font-medium mb-2">{L('error')}</p>
        <p className="text-white/20 text-xs font-mono mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500 transition">{L('retry')}</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#08080c] text-white antialiased">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(99,102,241,0.05), transparent 70%)' }} />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#08080c]/90 backdrop-blur-2xl">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-white font-black text-[10px]">BS</span>
            </div>
            <span className="text-sm font-bold tracking-tight">{L('title')}</span>
            <span className="text-[10px] text-white/20 ml-1">{L('updated')} {updated}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/15">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-400 tracking-wide">{L('live')}</span>
            </div>
            <button onClick={() => setLang(l => l === 'en' ? 'am' : 'en')}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] hover:bg-white/[0.08] transition">
              {lang === 'en' ? '🇪🇹 አማ' : '🇬🇧 EN'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Ticker ── */}
      {bids.length > 0 && <Ticker bids={bids} pMap={pMap} sMap={sMap} lang={lang} />}

      <main className="relative max-w-[1100px] mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '🎯', label: L('bids'), val: bids.length, sub: `${winners.length} ${L('winners')}`, color: 'from-indigo-500/10' },
            { icon: '📦', label: L('products'), val: uniqueProds.size, sub: `${products.length} ${L('total')}`, color: 'from-amber-500/10' },
            { icon: '👥', label: L('suppliers'), val: uniqueSupps.size, sub: `${suppliers.length} ${L('registered')}`, color: 'from-emerald-500/10' },
            { icon: '⚡', label: L('cycles'), val: activeCycles.length, sub: `${cycles.length} ${L('total')}`, color: 'from-violet-500/10' },
          ].map((c, i) => (
            <Glass key={i}>
              <div className={`p-4 bg-gradient-to-br ${c.color} to-transparent`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">{c.icon}</span>
                  <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">{c.label}</span>
                </div>
                <p className="text-3xl font-bold tracking-tight">{c.val.toLocaleString()}</p>
                <p className="text-[10px] text-white/20 mt-0.5">{c.sub}</p>
              </div>
            </Glass>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-0.5 bg-white/[0.02] p-1 rounded-xl border border-white/[0.05] w-fit">
          {tabs.map((name, i) => (
            <button key={i} onClick={() => setTab(i)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                tab === i
                  ? 'bg-indigo-500/15 text-indigo-300 shadow-sm border border-indigo-500/20'
                  : 'text-white/25 hover:text-white/50'
              }`}>
              {['📊', '📈', '🏅'][i]} {name}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW ══ */}
        {tab === 0 && (
          <div className="space-y-5">
            <Glass>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm">🏆</span>
                  <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{L('latestWinners')}</h2>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="text-[9px] text-white/20 uppercase tracking-wider">
                      <th className="text-left py-2 font-semibold">Product</th>
                      <th className="text-left py-2 font-semibold">Supplier</th>
                      <th className="text-right py-2 font-semibold">Price</th>
                      <th className="text-right py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentWinners.map(w => (
                      <tr key={w.id} className="border-t border-white/[0.03] hover:bg-white/[0.02] transition">
                        <td className="py-3">
                          <p className="text-sm font-medium text-white/80">{pMap(w.product_id)}</p>
                          <p className="text-[9px] text-white/15">{new Date(w.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="py-3 text-sm text-white/40">{sMap(w.supplier_id)}</td>
                        <td className="py-3 text-right">
                          <span className="text-sm font-bold text-indigo-400 font-mono">{w.bid_price.toLocaleString()}</span>
                          <span className="text-[9px] text-white/20 ml-1">{L('etb')}</span>
                        </td>
                        <td className="py-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-[9px] font-bold text-emerald-400">
                            🏆 Winner
                          </span>
                        </td>
                      </tr>
                    ))}
                    {recentWinners.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-8 text-white/15 text-sm">{L('noData')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Glass>

            {/* Cycles */}
            {activeCycles.length > 0 && (
              <Glass>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span>⚡</span>
                    <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{L('cycleProgress')}</h2>
                    <div className="flex-1 h-px bg-white/[0.04]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeCycles.map(c => {
                      const total = Math.max(1, (new Date(c.ends_at).getTime() - new Date(c.starts_at).getTime()) / 86400000);
                      const left = Math.max(0, Math.ceil((new Date(c.ends_at).getTime() - now) / 86400000));
                      const pct = Math.min(100, ((total - left) / total) * 100);
                      return (
                        <div key={c.cycle_id}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white/70">{c.cycle_name}</span>
                            <span className="text-[10px] text-indigo-400 font-mono">{left}d {L('remaining')}</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex justify-between text-[8px] text-white/15 mt-1">
                            <span>{c.starts_at.slice(5, 10)}</span>
                            <span>{pct.toFixed(0)}%</span>
                            <span>{c.ends_at.slice(5, 10)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Glass>
            )}
          </div>
        )}

        {/* ══ CHARTS ══ */}
        {tab === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Glass>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">📊</span>
                  <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{L('priceTrend')}</h2>
                </div>
                {priceData.length > 0 ? <PriceChart data={priceData} /> : <p className="text-white/15 text-sm text-center py-8">{L('noData')}</p>}
              </div>
            </Glass>
            <Glass>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">📈</span>
                  <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{L('bidVol')}</h2>
                </div>
                {volData.length > 0 ? <VolChart data={volData} /> : <p className="text-white/15 text-sm text-center py-8">{L('noData')}</p>}
              </div>
            </Glass>
          </div>
        )}

        {/* ══ RANKINGS ══ */}
        {tab === 2 && (
          <Glass>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">🏅</span>
                <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{L('supplierRank')}</h2>
                <div className="flex-1 h-px bg-white/[0.04]" />
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-[9px] text-white/20 uppercase tracking-wider">
                    <th className="text-left py-2 font-semibold w-10">#</th>
                    <th className="text-left py-2 font-semibold">Supplier</th>
                    <th className="text-right py-2 font-semibold">Bids</th>
                    <th className="text-right py-2 font-semibold">Wins</th>
                    <th className="text-right py-2 font-semibold">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((r, i) => (
                    <tr key={r.id} className={`border-t border-white/[0.03] hover:bg-white/[0.02] transition ${i === 0 ? 'bg-amber-500/[0.03]' : ''}`}>
                      <td className="py-3 text-base">{i < 3 ? medals[i] : <span className="text-white/15 text-xs">{i + 1}</span>}</td>
                      <td className="py-3 text-sm font-medium text-white/70">{sMap(r.id)}</td>
                      <td className="py-3 text-right text-sm text-white/30 font-mono tabular-nums">{r.bids}</td>
                      <td className="py-3 text-right text-sm font-semibold text-white/60 tabular-nums">{r.wins}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-16 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500/50" style={{ width: `${r.rate}%` }} />
                          </div>
                          <span className="text-xs font-bold text-emerald-400 w-8 text-right tabular-nums">{r.rate.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-white/15 text-sm">{L('noData')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Glass>
        )}

        {/* Footer */}
        <footer className="border-t border-white/[0.03] pt-4 pb-6 text-center">
          <p className="text-[9px] text-white/10 tracking-wider">BID SUPPLY — REAL-TIME TRANSPARENCY</p>
        </footer>
      </main>
    </div>
  );
}
