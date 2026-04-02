import { type ReactNode } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="am">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
