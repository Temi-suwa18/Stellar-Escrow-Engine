'use client';

import { Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeWindow } from './code-window';
import { FadeIn } from './fade-in';

const TABS = [
  {
    value: 'freelance',
    label: 'Freelance',
    filename: 'freelance.ts',
    code: `const deal = await escrow.create({
  category: "freelance",
  amount: 1500,
  asset: "USDC",
  depositor: client.wallet,
  beneficiary: freelancer.wallet,
  milestones: [
    { label: "Wireframes", amount: 500 },
    { label: "Final build", amount: 1000 },
  ],
});

await escrow.releaseMilestone(deal.id, 0);`,
    points: [
      'Fund the whole project up front, pay out per milestone',
      'Freelancer sees funds are secured before starting work',
      'Dispute a milestone without unwinding the whole deal',
    ],
  },
  {
    value: 'ecommerce',
    label: 'Ecommerce',
    filename: 'ecommerce.ts',
    code: `const order = await escrow.create({
  category: "ecommerce",
  amount: 89.99,
  asset: "USDC",
  depositor: buyer.wallet,
  beneficiary: seller.wallet,
  autoReleaseAfterDays: 14,
});

// Buyer confirms receipt, or it auto-releases after 14 days
await escrow.release(order.id);`,
    points: [
      'Buyer funds are held until delivery is confirmed',
      'Automatic release after a configurable window',
      'No chargebacks — funds move on-chain once released',
    ],
  },
  {
    value: 'rental',
    label: 'Rentals',
    filename: 'rental.ts',
    code: `const deposit = await escrow.create({
  category: "rental",
  amount: 400,
  asset: "USDC",
  depositor: renter.wallet,
  beneficiary: owner.wallet,
  timeLockUntil: returnDate,
});

// On clean return:
await escrow.refund(deposit.id);
// On damage claim:
await escrow.dispute(deposit.id, { reason: "Damage reported" });`,
    points: [
      'Security deposits held for the rental period',
      'Time-locked to the expected return date',
      'Refund on clean return, dispute on damage claims',
    ],
  },
  {
    value: 'logistics',
    label: 'Logistics',
    filename: 'logistics.ts',
    code: `const shipment = await escrow.create({
  category: "logistics",
  amount: 2200,
  asset: "USDC",
  depositor: shipper.wallet,
  beneficiary: carrier.wallet,
  milestones: [
    { label: "Pickup confirmed", amount: 700 },
    { label: "Proof of delivery", amount: 1500 },
  ],
});`,
    points: [
      'Pay carriers per checkpoint, not all-or-nothing',
      'Proof-of-delivery triggers the final release',
      'Multi-leg shipments map to multiple milestones',
    ],
  },
] as const;

export function CodeShowcase() {
  return (
    <section id="products" className="border-border bg-muted/30 border-t py-24">
      <div className="container">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <span className="text-primary flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest">
            <span className="bg-primary h-1.5 w-1.5 rounded-full" />
            Products
          </span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Same API. Different deal.
          </h2>
          <p className="text-muted-foreground mt-4 text-balance">
            The category changes what defaults apply — the integration you write doesn&apos;t
            change.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mx-auto mt-14 max-w-5xl">
          <Tabs defaultValue="freelance">
            <TabsList className="mx-auto flex h-auto w-fit flex-wrap justify-center gap-1 rounded-md">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs uppercase tracking-widest"
                >
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
