import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Github, ShieldCheck, Workflow, Zap } from 'lucide-react';
import { Navbar } from '@/components/marketing/navbar';
import { Footer } from '@/components/marketing/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'About',
};

const PRINCIPLES = [
  {
    icon: Workflow,
    title: 'One protocol, not four',
    description:
      "Freelance work, ecommerce orders, rental deposits, and logistics shipments all reduce to the same shape: funds held until a condition is met. ESCRA is that one condition-based primitive, with milestones, disputes, and time locks as configuration — not four separate products wearing the same logo.",
  },
  {
    icon: ShieldCheck,
    title: 'Non-custodial by construction',
    description:
      'Funds move through a Soroban smart contract on Stellar, not through a balance in our database. The API brokers transactions for wallets to sign — it never holds the keys, so it can never unilaterally move anyone’s money.',
  },
  {
    icon: Zap,
    title: 'Built in the open, module by module',
    description:
      'Every module ships complete — real code, real tests, no placeholders — before the next one starts, and the build log is the commit history, not a roadmap slide.',
  },
] as const;

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="border-border border-b py-20">
          <div className="container flex flex-col items-center gap-5 text-center">
            <span className="text-primary flex items-center gap-1.5 text-xs uppercase tracking-widest">
              <span className="bg-primary h-1.5 w-1.5 rounded-full" />
              About
            </span>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              Escrow shouldn&apos;t need a new integration for every use case
            </h1>
            <p className="text-muted-foreground max-w-2xl text-balance text-lg">
              ESCRA is a universal escrow protocol on Stellar — one API and one Soroban contract
              standing in for the checkout-escrow, rental-deposit, and milestone-payment
              integrations most platforms end up building three separate times.
            </p>
          </div>
        </section>

        <section className="border-border border-b py-16">
          <div className="container">
            <div className="grid gap-6 sm:grid-cols-3">
              {PRINCIPLES.map(({ icon: Icon, title, description }) => (
                <Card key={title} className="h-full rounded-md">
                  <CardHeader>
                    <div className="bg-primary/10 text-primary border-primary/30 mb-1 flex h-9 w-9 items-center justify-center rounded-md border">
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm uppercase tracking-wide">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground text-sm">{description}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container flex flex-col items-center gap-5 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Follow the build</h2>
            <p className="text-muted-foreground max-w-xl text-balance">
              ESCRA is developed in the open. The README tracks exactly what&apos;s implemented
              versus planned, module by module, and the commit history is the real changelog.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild>
                <Link
                  href="https://github.com/Temi-suwa18/Stellar-Escrow-Engine"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github className="mr-1.5 h-4 w-4" /> View the repository
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/docs">
                  Read the docs <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
