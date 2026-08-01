'use client';

import { Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeWindow } from './code-window';
import { FadeIn } from './fade-in';

const TABS = [
  {
    value: 'checkout',
    label: 'Checkout',
    filename: 'checkout.ts',
    code: `const session = await stellar.checkout.sessions.create({
  lineItems: [
    { price: "price_pro_plan", quantity: 1 },
  ],
  successUrl: "https://acme.com/success",
  cancelUrl: "https://acme.com/cancel",
  allowedAssets: ["USDC", "XLM"],
});

// Redirect the customer to session.url`,
    points: [
      'XLM, USDC, and custom Stellar assets',
      'Custom branding, discount codes, and tax',
      'QR code for wallet-to-wallet payment',
    ],
  },
  {
    value: 'subscriptions',
    label: 'Subscriptions',
    filename: 'subscriptions.ts',
    code: `const subscription = await stellar.subscriptions.create({
  customer: "cus_8xJ2k",
  price: "price_pro_monthly",
  trialDays: 14,
});

await stellar.subscriptions.pause(subscription.id);
await stellar.subscriptions.resume(subscription.id);`,
    points: [
      'Monthly, weekly, annual, and metered billing',
      'Trials, pause/resume, upgrade/downgrade',
      'Automatic retries on failed payments',
    ],
  },
  {
    value: 'escrow',
    label: 'Escrow',
    filename: 'escrow.ts',
    code: `const escrow = await stellar.escrow.create({
  amount: 5000,
  asset: "USDC",
  milestones: [
    { description: "Design delivered", amount: 2000 },
    { description: "Final delivery", amount: 3000 },
  ],
  arbitrator: "GARB...XYZ",
});

await stellar.escrow.releaseMilestone(escrow.id, 0);`,
    points: [
      'Milestone-based releases on Soroban',
      'Multi-signature approval and time locks',
      'Built-in arbitrated dispute workflow',
    ],
  },
  {
    value: 'treasury',
    label: 'Treasury',
    filename: 'treasury.ts',
    code: `const transfer = await stellar.treasury.transfers.schedule({
  fromWallet: "wal_operating",
  toWallet: "wal_payroll",
  amount: 12000,
  asset: "USDC",
  requiresApproval: true,
  runAt: "2026-08-01T00:00:00Z",
});`,
    points: [
      'Multi-wallet treasury with spending policies',
      'Approval workflows for scheduled transfers',
      'Cash-flow analytics across every wallet',
    ],
  },
] as const;

export function CodeShowcase() {
  return (
    <section id="products" className="border-border bg-muted/30 border-t py-24">
      <div className="container">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            One API, every product
          </h2>
          <p className="text-muted-foreground mt-4 text-balance">
            The same client, the same auth, the same webhooks — across checkout, subscriptions,
            escrow, and treasury.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mx-auto mt-14 max-w-5xl">
          <Tabs defaultValue="checkout">
            <TabsList className="mx-auto flex h-auto w-fit flex-wrap justify-center gap-1">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-8">
                <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                  <ul className="flex flex-col gap-3 lg:order-2">
                    {tab.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm">
                        <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <CodeWindow filename={tab.filename} code={tab.code} className="lg:order-1" />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </FadeIn>
      </div>
    </section>
  );
}
