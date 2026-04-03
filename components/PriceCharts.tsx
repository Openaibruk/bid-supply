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

  useEffect(() => {
    // Fetch top products
    supabase
      .from('products')
      .select('product_id, product_name')
      .limit(10)
      .then(({ data }) => {
        if (data) {
          setProducts(data.map(p => ({ id: p.product_id, name: p.product_name })));
          if (data.length > 0) setSelectedProduct(data[0].product_id);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;

    const start = subDays(new Date(), 14);
    supabase
      .from('dc_bids')
      .select('bid_price, created_at')
      .eq('product_id', selectedProduct)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!data || data.length === 0) {
          setData([]);
          return;
        }

        // Group by date
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
          <TrendingUp className="w-4 h-4 text-purple-500" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Price Trends</h2>
        </div>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(Number(e.target.value))}
          className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        >
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-12">No price data available for this product</p>
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
