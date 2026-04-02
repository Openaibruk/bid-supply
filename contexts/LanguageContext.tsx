'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import messages from '../messages.json';

type Locale = 'am' | 'en';
interface Translations {
  am: Record<string, string>;
  en: Record<string, string>;
}

const translations = messages as Translations;

function getLang(): Locale {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('bid-supply-lang');
    if (stored === 'am' || stored === 'en') return stored;
    const browserLang = navigator.language.startsWith('am') ? 'am' : 'en';
    return browserLang;
  }
  return 'am'; // default Amharic as requested
}

const LanguageContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}>({
  locale: 'am',
  setLocale: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('am');

  useEffect(() => {
    const stored = localStorage.getItem('bid-supply-lang') as Locale | null;
    // Default to Amharic if nothing stored
    const initial = stored || 'am';
    setLocaleState(initial);
  }, []);

  const setLocale = (l: Locale) => {
    localStorage.setItem('bid-supply-lang', l);
    setLocaleState(l);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let val: any = translations;
    for (const k of keys) {
      val = val?.[k];
    }
    if (!val) return key;
    return val[locale] || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
