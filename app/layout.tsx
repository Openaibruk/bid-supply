import { type ReactNode } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'Bid Supply — Real-time transparency',
  description: 'Live bidding dashboard with price trends, supplier leaderboard, and winner feed.',
  openGraph: {
    title: 'Bid Supply Dashboard',
    description: 'Real-time transparency for live bidding markets',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="am">
      <body className={`min-h-screen bg-white text-slate-900 antialiased ${inter.className}`}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
