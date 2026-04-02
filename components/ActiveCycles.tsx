'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock } from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { useLang } from '@/contexts/LanguageContext';

interface Cycle {
  cycle_id: string;
  cycle_name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  bid_count?: number;
}

export function ActiveCycles() {
  const { t } = useLang();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('dc_bidding_cycles')
          .select('*')
          .order('ends_at', { ascending: true });
        if (error) throw error;
        const now = new Date();
        const active = (data as any[])
          .filter(c => isBefore(now, new Date(c.ends_at)) && isAfter(now, new Date(c.starts_at)))
          .slice(0, 5);
        setCycles(active as Cycle[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 bg-slate-200 rounded" />
          <div className="h-4 w-32 bg-slate-100 rounded"></div>
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="p-3 rounded-lg border border-slate-200 animate-pulse">
              <div className="flex justify-between mb-2">
                <div className="h-4 w-40 bg-slate-100 rounded"></div>
                <div className="h-3 w-12 bg-slate-100 rounded"></div>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (cycles.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">{t('activeCycles')}</h2>
        </div>
        <p className="text-sm text-slate-500 text-center py-8">{t('noActiveCycles')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-blue-600" />
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{t('activeCycles')}</h2>
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
                <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                  <Clock className="w-3 h-3" />
                  {daysLeft} {t('daysLeft')}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
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
