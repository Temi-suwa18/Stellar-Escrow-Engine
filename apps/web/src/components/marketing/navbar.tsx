import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from './logo';

const NAV_LINKS = [
  { href: '#products', label: 'Products' },
  { href: '#developers', label: 'Developers' },
  { href: '#how-it-works', label: 'How it works' },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <div className="border-border bg-background/80 container flex h-16 items-center justify-between rounded-full border px-5 shadow-sm backdrop-blur-md">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" className="rounded-full" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button variant="ghost" size="sm" className="hidden rounded-full sm:inline-flex" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" className="rounded-full" asChild>
            <Link href="/signup">
              Get started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
