'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { useLang } from '@/contexts/LanguageContext';

interface PricePoint {
  date: string;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  bids: number;
}

function fmt(val: unknown) {
  const n = typeof val === 'number' ? val : Number(val);
  return `${Math.round(n).toLocaleString()} ETB`;
}

export function PriceCharts() {
  const { t } = useLang();
  const [data, setData] = useState<PricePoint[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await supabase.from('products').select('product_id, product_name').limit(10);
        if (data) {
          const ps = data.map(p => ({ id: p.product_id, name: p.product_name }));
          setProducts(ps);
          if (ps.length > 0 && !selectedProduct) setSelectedProduct(ps[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    const fetch = async () => {
      const start = format(subDays(new Date(), 14), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('dc_bids')
        .select('bid_price, created_at')
        .eq('product_id', selectedProduct)
        .gte('created_at', start)
        .order('created_at', { ascending: true });
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
      const result: PricePoint[] = Object.entries(byDate).map(([date, prices]) => ({
        date,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        bids: prices.length,
      }));
      setData(result);
    };
    fetch();
  }, [selectedProduct]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-200 rounded" />
            <div className="h-4 w-32 bg-slate-100 rounded"></div>
          </div>
          <div className="h-8 w-40 bg-slate-100 rounded-md"></div>
        </div>
        <div className="h-52 bg-slate-50 rounded mb-4 animate-pulse" />
        <div className="h-32 bg-slate-50 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{t('priceTrends')}</h2>
        </div>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(Number(e.target.value))}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
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
                    color: '#1e293b',
                  }}
                  formatter={(value: unknown) => [fmt(value), '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="minPrice" name="Min" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="maxPrice" name="Max" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgPrice" name="Avg" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
                    color: '#1e293b',
                  }}
                />
                <Line type="monotone" dataKey="bids" name="Bids" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
