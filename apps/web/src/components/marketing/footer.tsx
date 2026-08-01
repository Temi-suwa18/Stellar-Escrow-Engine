import Link from 'next/link';
import { Github, Twitter } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Logo } from './logo';

const FOOTER_LINKS = {
  Product: [
    { label: 'Freelance', href: '#products' },
    { label: 'Ecommerce', href: '#products' },
    { label: 'Rentals', href: '#products' },
    { label: 'Logistics', href: '#products' },
  ],
  Developers: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API reference', href: '/docs' },
    { label: 'SDKs', href: '#developers' },
    { label: 'Webhooks', href: '#developers' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Security', href: '/security' },
    { label: 'Contact', href: '/contact' },
  ],
} as const;

export function Footer() {
  return (
    <footer className="border-border border-t py-16">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="text-muted-foreground max-w-xs text-sm">
              A universal escrow protocol on Stellar — built for Web3 and Soroban.
            </p>
            <div className="flex gap-3">
              <Link
                href="https://github.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href="https://twitter.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading} className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold">{heading}</h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10" />

        <div className="text-muted-foreground flex flex-col items-center justify-between gap-4 text-sm sm:flex-row">
          <p>© {new Date().getFullYear()} Stellar Escrow Engine. Built for the Stellar network.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
