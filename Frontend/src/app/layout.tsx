import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

const DESCRIPTION =
  'A universal escrow protocol on Stellar — freelance, ecommerce, rentals/vehicles, logistics, and milestone payments. Apps just call the API.';

// Needed for Next to resolve OpenGraph/Twitter image URLs to absolute ones;
// falls back to localhost in dev, matching the pattern already used for
// APP_URL elsewhere in this codebase (Backend's env.validation.ts, the new
// sitemap.ts).
const SITE_URL = process.env.APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ESCRA',
    template: '%s · ESCRA',
  },
  description: DESCRIPTION,
  openGraph: {
    title: 'ESCRA — Universal escrow protocol on Stellar',
    description: DESCRIPTION,
    siteName: 'ESCRA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ESCRA — Universal escrow protocol on Stellar',
    description: DESCRIPTION,
  },
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
