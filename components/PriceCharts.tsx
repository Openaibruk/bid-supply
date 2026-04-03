'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

interface PriceData {
  date: string;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  bids: number;
}

export function PriceCharts() {
  const [data, setData] = useState<PriceData[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    setProductsLoading(true);
    const fourteenDaysAgo = subDays(new Date(), 14).toISOString();
    // Fetch products and their recent bid counts in one round trip
    supabase
      .from('products')
      .select('product_id, product_name')
      .limit(50) // decent pool to rank
      .then(async ({ data, error }) => {
        if (error) {
          console.error(error);
          setProductsLoading(false);
          return;
        }
        if (!data || data.length === 0) {
          setProductsLoading(false);
          return;
        }
        const productIds = data.map(p => p.product_id);
        // Fetch bid counts per product for last 14 days
        const { data: bidsData } = await supabase
          .from('dc_bids')
          .select('product_id')
          .gte('created_at', fourteenDaysAgo)
          .in('product_id', productIds);
        const counts = new Map<number, number>();
        (bidsData || []).forEach((b: any) => {
          counts.set(b.product_id, (counts.get(b.product_id) || 0) + 1);
        });
        // Sort products by bid count descending; if none have bids, keep alphabetical
        const sorted = [...data].sort((a, b) => (counts.get(b.product_id) || 0) - (counts.get(a.product_id) || 0));
        setProducts(sorted.map(p => ({ id: p.product_id, name: p.product_name })));
        if (sorted.length > 0) setSelectedProduct(sorted[0].product_id);
        setProductsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    setLoading(true);
    setError(null);
    const start = subDays(new Date(), 14);
    supabase
      .from('dc_bids')
      .select('bid_price, created_at')
      .eq('product_id', selectedProduct)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          setError(error.message);
          return;
        }
        if (!data || data.length === 0) {
          setData([]);
          return;
        }
        const byDate: Record<string, number[]> = {};
        (data as any[]).forEach(b => {
          const date = format(parseISO(b.created_at), 'MM/dd');
          if (!byDate[date]) byDate[date] = [];
          byDate[date].push(b.bid_price);
        });
        const result = Object.entries(byDate).map(([date, prices]) => ({
          date,
          minPrice: Math.min(...prices),
          maxPrice: Math.max(...prices),
          avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
          bids: prices.length,
        }));
        setData(result);
      });
  }, [selectedProduct]);

  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Price Trends</h2>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="product-select" className="sr-only">Select Product</label>
          <select
            id="product-select"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(Number(e.target.value))}
            disabled={productsLoading}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-52 flex items-center justify-center">
          <div className="text-xs text-slate-400 animate-pulse">Loading price data…</div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-sm font-medium text-red-800 mb-1">Failed to load price data</p>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">No price data available for this product</p>
          <p className="text-xs text-slate-500 mt-1">Bids will appear here once suppliers start bidding</p>
        </div>
      ) : (
        <>
          {/* Price Range Chart */}
          <div className="h-52 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#0f172a',
                  }}
                  formatter={(value: any) => [`${Math.round(value).toLocaleString()} ETB`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#475569' }} />
                <Bar dataKey="minPrice" name="Min" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="maxPrice" name="Max" fill="#a855f7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgPrice" name="Avg" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bid Volume Chart */}
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#0f172a',
                  }}
                  formatter={(value: any) => [value, '']}
                />
                <Line
                  type="monotone"
                  dataKey="bids"
                  name="Bids"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}