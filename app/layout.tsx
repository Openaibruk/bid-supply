import { type ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#08090c] text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
