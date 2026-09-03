import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Github, KeyRound } from 'lucide-react';
import { Navbar } from '@/components/marketing/navbar';
import { Footer } from '@/components/marketing/footer';
import { CodeWindow } from '@/components/marketing/code-window';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EndpointReference } from '@/components/docs/endpoint-reference';
import { ErrorEnvelope } from '@/components/docs/error-envelope';

export const metadata: Metadata = {
  title: 'Developer docs',
};

const QUICKSTART_SNIPPET = `npm install @stellar-escrow/sdk`;

const CREATE_SNIPPET = `import { StellarEscrow } from "@stellar-escrow/sdk";

const escrow = new StellarEscrow(process.env.ESCROW_API_KEY);

const deal = await escrow.create({
  category: "freelance",
  amount: 500,
  asset: "USDC",
  depositorWallet: "GABC...123",
  beneficiaryWallet: "GXYZ...789",
  arbitratorWallet: "GARB...456",
  milestones: [
    { description: "Design draft", amount: 200 },
    { description: "Final delivery", amount: 300 },
  ],
});

await escrow.releaseMilestone(deal.id, deal.milestones[0].id);`;

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="border-border border-b py-20">
          <div className="container flex flex-col items-center gap-5 text-center">
            <Badge variant="secondary">Test mode available now — no approval wait</Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              Developer docs
            </h1>
            <p className="text-muted-foreground max-w-2xl text-balance text-lg">
              One REST API for freelance, ecommerce, rental, and logistics escrow, plus an official
              TypeScript SDK. Everything below is generated from the actual API — not a mockup.
            </p>
          </div>
        </section>

        <section className="border-border border-b py-16">
          <div className="container grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="flex min-w-0 flex-col gap-4">
              <span className="text-primary flex items-center gap-1.5 text-xs uppercase tracking-widest">
                <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                Quickstart
              </span>
              <h2 className="text-2xl font-bold tracking-tight">Install the SDK</h2>
              <CodeWindow filename="terminal" code={QUICKSTART_SNIPPET} className="min-w-0" />
              <p className="text-muted-foreground text-sm">
                No SDK for your language yet? Every endpoint below works with a plain HTTP client —
                the SDK is a thin wrapper, not a requirement.
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-4">
              <span className="text-primary flex items-center gap-1.5 text-xs uppercase tracking-widest">
                <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                Create your first escrow
              </span>
              <h2 className="text-2xl font-bold tracking-tight">Same API, any deal</h2>
              <CodeWindow filename="create-escrow.ts" code={CREATE_SNIPPET} className="min-w-0" />
            </div>
          </div>
        </section>

        <section className="border-border border-b py-16">
          <div className="container">
            <Card className="mx-auto max-w-3xl rounded-md">
              <CardHeader>
                <div className="bg-primary/10 text-primary border-primary/30 mb-1 flex h-9 w-9 items-center justify-center rounded-md border">
                  <KeyRound className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm uppercase tracking-wide">Authentication</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground flex flex-col gap-3 text-sm">
                <p>
                  Every request is authenticated with an API key sent as the{' '}
                  <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">X-Api-Key</code>{' '}
                  header — not a dashboard session. The organization on every resource is whichever
                  one issued the key, so there&apos;s no separate organization id in the URL.
                </p>
                <p>
                  Generate a test-mode key from your dashboard immediately after signing up — no
                  approval wait, no sales call.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <EndpointReference />
        <ErrorEnvelope />

        <section className="py-20">
          <div className="container flex flex-col items-center gap-5 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Ready to build?</h2>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild>
                <Link href="/signup">
                  Create an account <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link
                  href="https://github.com/Temi-suwa18/Stellar-Escrow-Engine"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github className="mr-1.5 h-4 w-4" /> View source on GitHub
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
