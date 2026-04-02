'use client';

import { useLang } from '@/contexts/LanguageContext';

export function LanguageToggle() {
  const { locale, setLocale, t } = useLang();

  return (
    <button
      onClick={() => setLocale(locale === 'am' ? 'en' : 'am')}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
      title={locale === 'am' ? 'Switch to English' : 'እንግሊዝኛ ይቀይሩ'}
    >
      <span className="text-base">
        {locale === 'am' ? '🇪🇹' : '🇬🇧'}
      </span>
      <span className="hidden sm:inline">{locale === 'am' ? 'አማርኛ' : 'English'}</span>
    </button>
  );
}
