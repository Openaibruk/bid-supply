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
  en: { title:'Bid Supply', live:'LIVE', todayBids:'Bids Today', products:'Products', suppliers:'Suppliers', cycles:'Cycles', winners:'Winners', overview:'Overview', charts:'Price Trends', rankings:'Rankings', latestWinners:'Recent Winners', supplierRank:'Supplier Standings', priceTrend:'Price Range', bidVol:'Bid Volume', cycleProgress:'Active Cycles', noData:'No data yet', etb:'ETB', remaining:'left', total:'total', registered:'registered', updated:'Updated', error:'Something went wrong', retry:'Retry' },
  am: { title:'ቢድ ሳፕላይ', live:'ቀጥታ', todayBids:'ዛሬ የገቡ', products:'ምርቶች', suppliers:'አቅራቢዎች', cycles:'ዑደቶች', winners:'አሸናፊዎች', overview:'አጠቃላይ', charts:'ዋጋ አዝማሚያ', rankings:'ደረጃ', latestWinners:'የቅርብ አሸናፊዎች', supplierRank:'የአቅራቢ ደረጃ', priceTrend:'ዋጋ ክልል', bidVol:'የዋጋ ብዛት', cycleProgress:'ንቁ ዑደቶች', noData:'ዳታ የለም', etb:'ብር', remaining:'ቀርቷል', total:'ጠቅላላ', registered:'የተመዘገቡ', updated:'የተሻሻለ', error:'ስህተት ተከስቷል', retry:'እንደገና ይሞክሩ' },
};
const T = (lang: string, key: string) => D[lang]?.[key] ?? key;

function svgChart(data: { label: string; value: number }[], color: string, H: number) {
  if (!data.length) return null;
  const W = 560, P = 24, mx = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(6, (W - P * 2) / data.length - 3);
  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full">
      {data.map((d, i) => {
        const h = Math.max(3, (d.value / mx) * (H - 8));
        return <g key={i}>
          <rect x={P + i * ((W - P * 2) / data.length)} y={H - h} width={barW} height={h}
            rx={3} fill={color} opacity={0.6} className="hover:opacity-100 transition-opacity" />
          <text x={P + i * ((W - P * 2) / data.length) + barW / 2} y={H + 12}
            textAnchor="middle" fontSize={7} fill="#6b7280">{d.label.slice(3)}</text>
        </g>;
      })}
    </svg>
  );
}

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
    return p?.product_name || `Product #${id}`;
  }, [products]);

  const sMap = useCallback((id: number) => {
    const s = suppliers.find(s => Number(s.supplier_id) === Number(id));
    return s?.supplier_name || `Supplier #${id}`;
  }, [suppliers]);

  useEffect(() => {
    async function load() {
      try {
        const [p, s, c, b] = await Promise.all([
          fetch(`${API}/products?select=product_id,product_name&limit=300`, { headers: H }).then(r => r.json()),
          fetch(`${API}/dc_suppliers?select=supplier_id,supplier_name&limit=300`, { headers: H }).then(r => r.json()),
          fetch(`${API}/dc_bidding_cycles?select=cycle_id,cycle_name,starts_at,ends_at&order=ends_at.asc`, { headers: H }).then(r => r.json()),
          fetch(`${API}/dc_bids?select=id,bid_price,is_winner,product_id,supplier_id,created_at&order=created_at.desc&limit=200`, { headers: H }).then(r => r.json()),
        ]);
        setProducts(Array.isArray(p) ? p : []);
        setSuppliers(Array.isArray(s) ? s : []);
        setCycles(Array.isArray(c) ? c : []);
        setBids(Array.isArray(b) ? b : []);
        setUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      } catch (e: any) {
        setError(e.message || 'Failed to load data');
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
  const uniqueProds = new Set(bids.map(b => b.product_id));
  const uniqueSupps = new Set(bids.map(b => b.supplier_id));
  const totalWinners = bids.filter(b => b.is_winner);
  const recentWinners = [...totalWinners].slice(0, 8);

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

  // Loading state
  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-lg">BS</span>
          </div>
          <p className="text-gray-400 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-xl">⚠</span>
          </div>
          <p className="text-red-600 font-medium mb-2">{L('error')}</p>
          <p className="text-gray-400 text-xs mb-4 font-mono">{error}</p>
          <button onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
            {L('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-xs">BS</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">{L('title')}</h1>
              <p className="text-[10px] text-gray-400">{L('updated')} {updated}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-600">{L('live')}</span>
            </div>
            <button onClick={() => setLang(l => l === 'en' ? 'am' : 'en')}
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 transition">
              {lang === 'en' ? '🇪🇹 አማ' : '🇬🇧 EN'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Live Ticker ── */}
      {bids.length > 0 && (
        <div className="overflow-hidden bg-white border-b border-gray-100">
          <div className="flex gap-6 py-2 px-4 sm:px-6 whitespace-nowrap max-w-6xl mx-auto" style={{ animation: 'tick 40s linear infinite', width: `${[...bids, ...bids].length * 280}px` }}>
            {[...bids, ...bids].slice(0, 40).map((b, i) => (
              <span key={`${b.id}-${i}`} className="inline-flex items-center gap-1.5 text-xs">
                {b.is_winner
                  ? <span className="text-amber-500">🏆</span>
                  : <span className="w-1.5 h-1.5 rounded-full bg-indigo-200" />}
                <span className="text-gray-700 font-medium">{pMap(b.product_id)}</span>
                <span className="text-indigo-600 font-semibold">{b.bid_price.toLocaleString()}</span>
                <span className="text-gray-400">{L('etb')}</span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-400">{sMap(b.supplier_id)}</span>
              </span>
            ))}
          </div>
          <style>{`@keyframes tick{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '🎯', label: L('todayBids'), val: bids.length, sub: `${totalWinners.length} ${L('winners')}` },
            { icon: '📦', label: L('products'), val: uniqueProds.size, sub: `${products.length} ${L('total')}` },
            { icon: '👥', label: L('suppliers'), val: uniqueSupps.size, sub: `${suppliers.length} ${L('registered')}` },
            { icon: '⚡', label: L('cycles'), val: activeCycles.length, sub: `${cycles.length} ${L('total')}` },
          ].map((c, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{c.icon}</span>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{c.label}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{c.val.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 mt-1">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Tab Navigation ── */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1 w-fit">
          {tabs.map((name, i) => (
            <button key={i} onClick={() => setTab(i)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === i
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {['📊', '📈', '🏅'][i]} {name}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW TAB ══ */}
        {tab === 0 && (
          <div className="space-y-6">
            {/* Recent Winners Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                <span>🏆</span>
                <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{L('latestWinners')}</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-gray-400 uppercase tracking-wider bg-gray-50/50">
                    <th className="text-left px-5 py-2.5 font-semibold">Product</th>
                    <th className="text-left px-5 py-2.5 font-semibold">Supplier</th>
                    <th className="text-right px-5 py-2.5 font-semibold">Price</th>
                    <th className="text-right px-5 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentWinners.map(w => (
                    <tr key={w.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900">{pMap(w.product_id)}</p>
                        <p className="text-[10px] text-gray-400">{new Date(w.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{sMap(w.supplier_id)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm font-bold text-indigo-600">{w.bid_price.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-400 ml-1">{L('etb')}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-semibold text-emerald-600">
                          🏆 Winner
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentWinners.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">{L('noData')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Active Cycles */}
            {activeCycles.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span>⚡</span>
                  <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{L('cycleProgress')}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeCycles.map(c => {
                    const total = Math.max(1, (new Date(c.ends_at).getTime() - new Date(c.starts_at).getTime()) / 86400000);
                    const left = Math.max(0, Math.ceil((new Date(c.ends_at).getTime() - now) / 86400000));
                    const pct = Math.min(100, ((total - left) / total) * 100);
                    return (
                      <div key={c.cycle_id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{c.cycle_name}</span>
                          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{left}d {L('remaining')}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-400">
                          <span>{c.starts_at.slice(5, 10)}</span>
                          <span>{pct.toFixed(0)}%</span>
                          <span>{c.ends_at.slice(5, 10)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ CHARTS TAB ══ */}
        {tab === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <span>📊</span>
                <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{L('priceTrend')}</h2>
              </div>
              {priceData.length > 0 ? svgChart(priceData, '#6366f1', 140) : <p className="text-gray-400 text-sm text-center py-8">{L('noData')}</p>}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <span>📈</span>
                <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{L('bidVol')}</h2>
              </div>
              {volData.length > 0 ? svgChart(volData, '#10b981', 140) : <p className="text-gray-400 text-sm text-center py-8">{L('noData')}</p>}
            </div>
          </div>
        )}

        {/* ══ RANKINGS TAB ══ */}
        {tab === 2 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <span>🏅</span>
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{L('supplierRank')}</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="text-left px-5 py-2.5 font-semibold w-12">#</th>
                  <th className="text-left px-5 py-2.5 font-semibold">Supplier</th>
                  <th className="text-right px-5 py-2.5 font-semibold">Bids</th>
                  <th className="text-right px-5 py-2.5 font-semibold">Wins</th>
                  <th className="text-right px-5 py-2.5 font-semibold">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r, i) => (
                  <tr key={r.id} className={`border-t border-gray-50 hover:bg-gray-50/50 transition-colors ${i === 0 ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-5 py-3 text-lg">{i < 3 ? medals[i] : <span className="text-gray-300 text-sm">{i + 1}</span>}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{sMap(r.id)}</td>
                    <td className="px-5 py-3 text-right text-sm text-gray-600 tabular-nums">{r.bids}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900 tabular-nums">{r.wins}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${r.rate}%` }} />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 tabular-nums">{r.rate.toFixed(0)}%</span>
                      </span>
                    </td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">{L('noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-gray-100 pt-4 pb-8 text-center">
          <p className="text-[10px] text-gray-300">Bid Supply — Real-time product bidding transparency</p>
        </footer>
      </main>
    </div>
  );
}
