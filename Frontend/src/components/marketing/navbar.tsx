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
    <header className="border-border bg-background/90 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="border-border/60 bg-muted/40 border-b">
        <div className="text-muted-foreground container flex h-8 items-center justify-between text-[11px] uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <span className="bg-primary h-1.5 w-1.5 rounded-full" />
            Universal escrow protocol on stellar
          </span>
          <span className="hidden sm:inline">Soroban · Non-custodial</span>
        </div>
      </div>

      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground text-xs uppercase tracking-widest"
              asChild
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="hidden text-xs uppercase tracking-widest sm:inline-flex"
            asChild
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" className="text-xs uppercase tracking-widest" asChild>
            <Link href="/signup">
              Create account <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
