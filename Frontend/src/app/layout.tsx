import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: {
    default: 'ESCRA',
    template: '%s · ESCRA',
  },
  description:
    'A universal escrow protocol on Stellar — freelance, ecommerce, rentals/vehicles, logistics, and milestone payments. Apps just call the API.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${mono.variable} font-mono antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
