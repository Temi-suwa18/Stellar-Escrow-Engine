import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CodeWindow } from './code-window';
import { FadeIn } from './fade-in';

const PAYMENT_SNIPPET = `import { StellarCommerce } from "@stellar-commerce/sdk";

const stellar = new StellarCommerce(process.env.STELLAR_API_KEY);

// Create a payment
const payment = await stellar.payments.create({
  amount: 100,
  asset: "USDC",
  description: "Premium Subscription",
});

// Or a hosted checkout session
const session = await stellar.checkout.sessions.create({
  lineItems: [{ price: "price_premium_monthly", quantity: 1 }],
  successUrl: "https://example.com/success",
});`;

const STATS = [
  { value: '3-5s', label: 'Average settlement time on Stellar' },
  { value: '7', label: 'Official SDKs — TS, Python, Go, Rust, PHP, Java' },
  { value: '0', label: 'Custody of merchant funds held by us' },
] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.08),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.15] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]"
      />

      <div className="container grid gap-16 pb-24 pt-20 lg:grid-cols-2 lg:items-center lg:pb-32 lg:pt-28">
        <FadeIn className="flex flex-col items-start gap-6">
          <Badge variant="secondary" className="gap-1.5 py-1.5 pl-2 pr-3">
            <Sparkles className="text-primary h-3.5 w-3.5" />
            Built for Web3 · Powered by Soroban
          </Badge>

          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Payment infrastructure for the{' '}
            <span className="bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 bg-clip-text text-transparent">
              Stellar network
            </span>
          </h1>

          <p className="text-muted-foreground max-w-xl text-balance text-lg">
            Checkout, subscriptions, invoicing, escrow, and treasury — one API, a few lines of code,
            and non-custodial settlement on Stellar and Soroban.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start building <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#developers">Read the docs</Link>
            </Button>
          </div>

          <dl className="border-border mt-4 grid w-full grid-cols-3 gap-6 border-t pt-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-2xl font-bold tracking-tight">{stat.value}</dd>
                <dd className="text-muted-foreground text-xs">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </FadeIn>

        <FadeIn delay={0.15}>
          <CodeWindow filename="create-payment.ts" code={PAYMENT_SNIPPET} />
        </FadeIn>
      </div>
    </section>
  );
}
