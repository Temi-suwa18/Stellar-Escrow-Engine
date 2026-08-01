import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeWindow } from './code-window';
import { BracketFrame } from './bracket-frame';
import { FadeIn } from './fade-in';

const ESCROW_SNIPPET = `import { StellarEscrow } from "@stellar-escrow/sdk";

const escrow = new StellarEscrow(process.env.ESCROW_API_KEY);

// One universal API — any use case
const deal = await escrow.create({
  category: "freelance", // ecommerce | rental | logistics
  amount: 500,
  asset: "USDC",
  depositor: "GABC...123",
  beneficiary: "GXYZ...789",
  milestones: [
    { label: "Design draft", amount: 200 },
    { label: "Final delivery", amount: 300 },
  ],
});

await escrow.release(deal.id, { milestone: 0 });`;

const STATS = [
  { value: '4', label: 'Built-in categories: freelance, ecommerce, rental, logistics' },
  { value: '1', label: 'Universal API — no per-industry integration' },
  { value: '0', label: 'Custody of funds held by us' },
] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.10),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.25] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]"
      />

      <div className="container grid gap-16 pb-24 pt-20 lg:grid-cols-2 lg:items-center lg:pb-32 lg:pt-28">
        <FadeIn className="flex flex-col items-start gap-6">
          <span className="text-primary flex items-center gap-1.5 text-xs uppercase tracking-widest">
            <span className="bg-primary h-1.5 w-1.5 rounded-full" />
            ESCRA / Universal escrow protocol
          </span>

          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            One escrow.
            <br />
            <span className="text-primary">Any deal, verified.</span>
          </h1>

          <p className="text-muted-foreground max-w-xl text-balance text-lg">
            Freelance work, ecommerce orders, vehicle/rental deposits, and logistics shipments — one
            API, with milestone releases, disputes, and multi-sig approval built in. Apps just call
            the API.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" className="uppercase tracking-widest" asChild>
              <Link href="/signup">
                Start building <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="uppercase tracking-widest" asChild>
              <Link href="#developers">Read the docs</Link>
            </Button>
          </div>

          <dl className="border-border mt-4 grid w-full grid-cols-3 gap-6 border-t pt-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-2xl font-bold tracking-tight">{stat.value}</dd>
                <dd className="text-muted-foreground text-xs uppercase tracking-wide">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </FadeIn>

        <FadeIn delay={0.15} className="hidden lg:block">
          <BracketFrame className="mx-6 my-6">
            <CodeWindow filename="create-escrow.ts" code={ESCROW_SNIPPET} />
          </BracketFrame>
        </FadeIn>
        <FadeIn delay={0.15} className="lg:hidden">
          <CodeWindow filename="create-escrow.ts" code={ESCROW_SNIPPET} />
        </FadeIn>
      </div>
    </section>
  );
}
