'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock } from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';

interface Cycle {
  cycle_id: string;
  cycle_name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  bid_count?: number;
}

export function ActiveCycles() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('dc_bidding_cycles')
      .select('*')
      .order('ends_at', { ascending: true })
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          console.error(error);
          return;
        }
        if (!data) {
          setCycles([]);
          return;
        }
        const now = new Date();
        const active = (data as any[])
          .filter(c => isBefore(now, new Date(c.ends_at)) && isAfter(now, new Date(c.starts_at)))
          .slice(0, 5);
        setCycles(active as Cycle[]);
      });
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-slate-300" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Active Cycles</h2>
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse" />
                <div className="h-4 bg-slate-200 rounded w-12 animate-pulse" />
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-slate-300 rounded-full w-2/3 animate-pulse" />
              </div>
              <div className="flex justify-between mt-2">
                <div className="h-3 bg-slate-100 rounded w-20 animate-pulse" />
                <div className="h-3 bg-slate-100 rounded w-24 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (cycles.length === 0) {
    return (
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-slate-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Active Cycles</h2>
        </div>
        <div className="text-center py-8">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">No active cycles right now</p>
          <p className="text-xs text-slate-500 mt-1">New bidding cycles will appear here once scheduled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-indigo-500" />
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Active Cycles</h2>
      </div>
      <div className="space-y-3">
        {cycles.map((cycle) => {
          const daysLeft = Math.max(0, differenceInDays(new Date(cycle.ends_at), new Date()));
          const totalDays = differenceInDays(new Date(cycle.ends_at), new Date(cycle.starts_at));
          const daysPassed = totalDays - daysLeft;
          const progress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

          return (
            <div key={cycle.cycle_id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-900">{cycle.cycle_name}</p>
                <span className="flex items-center gap-1 text-xs text-indigo-600">
                  <Clock className="w-3 h-3" />
                  {daysLeft}d left
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {format(new Date(cycle.starts_at), 'MMM dd')} — {format(new Date(cycle.ends_at), 'MMM dd, yyyy')}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}