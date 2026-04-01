'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [err, setErr] = useState<string | null>(null);
  const [bids, setBids] = useState(0);
  const [suppliers, setSuppliers] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [products, setProducts] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await Promise.all([
        supabase.from('dc_bids').select('*', { count: 'exact', head: true }),
        supabase.from('dc_suppliers').select('*', { count: 'exact', head: true }),
        supabase.from('dc_bidding_cycles').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
      ]);
      setBids(res[0].count ?? 0);
      setSuppliers(res[1].count ?? 0);
      setCycles(res[2].count ?? 0);
      setProducts(res[3].count ?? 0);
      if (res[0].error) setErr(res[0].error.message);
      else setReady(true);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#08090c] flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-white">Bid Supply</h1>
        {err ? (
          <p className="text-red-400 font-mono text-sm">❌ {err}</p>
        ) : ready ? (
          <div className="grid grid-cols-4 gap-6 max-w-2xl mx-auto mt-12">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <p className="text-zinc-500 text-sm">Bids</p>
              <p className="text-4xl font-bold text-white">{bids.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <p className="text-zinc-500 text-sm">Suppliers</p>
              <p className="text-4xl font-bold text-white">{suppliers.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <p className="text-zinc-500 text-sm">Cycles</p>
              <p className="text-4xl font-bold text-white">{cycles.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <p className="text-zinc-500 text-sm">Products</p>
              <p className="text-4xl font-bold text-white">{products.toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <p className="text-zinc-500">Loading data...</p>
        )}
      </div>
    </div>
  );
}
