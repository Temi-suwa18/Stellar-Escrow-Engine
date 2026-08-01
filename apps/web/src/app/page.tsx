import Link from 'next/link';
import { ArrowRight, Lock, Repeat, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

const FEATURES = [
  {
    icon: Zap,
    title: 'Accept payments in minutes',
    description:
      'Hosted checkout, payment links, and a REST API that takes a few lines of code to integrate.',
  },
  {
    icon: Repeat,
    title: 'Subscriptions & invoicing',
    description:
      'Recurring billing, metered usage, trials, dunning, and automated invoice reminders.',
  },
  {
    icon: Lock,
    title: 'Escrow, built on Soroban',
    description:
      'Milestone releases, multi-signature approvals, time locks, and arbitrated disputes.',
  },
  {
    icon: ShieldCheck,
    title: 'Treasury you control',
    description:
      'Multi-wallet treasury, spending policies, approval workflows, and cash-flow analytics.',
  },
] as const;

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border border-b">
        <div className="container flex h-16 items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">Stellar Commerce</span>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/docs">Developers</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                Get started <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container flex flex-col items-center gap-6 py-24 text-center">
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Payment infrastructure for the Stellar network
          </h1>
          <p className="text-muted-foreground max-w-xl text-balance text-lg">
            Checkout, subscriptions, invoicing, escrow, and treasury — one API, built for Web3 and
            Soroban.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start building <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/docs">Read the docs</Link>
            </Button>
          </div>
          <pre className="border-border bg-muted mt-4 w-full max-w-lg overflow-x-auto rounded-lg border p-4 text-left text-sm">
            <code>{`const payment = await stellar.payments.create({
  amount: 100,
  asset: "USDC",
  description: "Premium Subscription"
});`}</code>
          </pre>
        </section>

        <section className="border-border bg-muted/30 border-t py-20">
          <div className="container grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="border-border bg-card flex flex-col gap-3 rounded-lg border p-6"
              >
                <Icon className="text-primary h-6 w-6" />
                <h3 className="font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-border border-t py-8">
        <div className="text-muted-foreground container text-center text-sm">
          © {new Date().getFullYear()} Stellar Commerce. Built for the Stellar network.
        </div>
      </footer>
    </div>
  );
}
