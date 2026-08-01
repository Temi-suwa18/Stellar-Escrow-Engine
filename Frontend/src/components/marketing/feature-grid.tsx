import { Briefcase, Car, Gavel, Lock, Milestone, ShoppingCart, Truck, Users } from 'lucide-react';
import { FadeIn } from './fade-in';

const FEATURES = [
  {
    icon: Briefcase,
    title: 'Freelance',
    description: 'Escrow project payments with milestone-based releases as work is delivered.',
    tag: 'Milestone-based',
  },
  {
    icon: ShoppingCart,
    title: 'Ecommerce',
    description: 'Hold buyer funds until delivery is confirmed — chargeback-proof, on-chain.',
    tag: 'Auto-release',
  },
  {
    icon: Car,
    title: 'Rentals & vehicles',
    description: 'Security deposits and rental payments released automatically on return.',
    tag: 'Time-locked',
  },
  {
    icon: Truck,
    title: 'Logistics',
    description: 'Shipment-linked escrow that releases on proof of delivery.',
    tag: 'Milestone-based',
  },
  {
    icon: Milestone,
    title: 'Milestone payments',
    description: 'Split any deal into milestones, each independently funded and released.',
    tag: 'Composable',
  },
  {
    icon: Gavel,
    title: 'Dispute resolution',
    description: 'Built-in arbitrator workflow when depositor and beneficiary disagree.',
    tag: 'Arbitrated',
  },
  {
    icon: Users,
    title: 'Multi-signature',
    description: 'Require multiple approvals before high-value releases go through.',
    tag: 'Multi-sig',
  },
  {
    icon: Lock,
    title: 'Time locks',
    description: 'Automatic release or refund once a deadline passes with no action.',
    tag: 'Automated',
  },
] as const;

export function FeatureGrid() {
  return (
    <section id="features" className="border-border border-t py-24">
      <div className="container">
        <FadeIn className="mx-auto max-w-2xl">
          <span className="text-primary flex items-center gap-1.5 text-xs uppercase tracking-widest">
            <span className="bg-primary h-1.5 w-1.5 rounded-full" />
            Capabilities
          </span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            One escrow engine, every use case
          </h2>
          <p className="text-muted-foreground mt-4 text-balance">
            Stop building custom escrow logic per product line — the category just changes the
            defaults, not the API.
          </p>
        </FadeIn>

        <div className="divide-border border-border mt-14 grid divide-x divide-y border sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description, tag }, index) => (
            <FadeIn key={title} delay={index * 0.03}>
              <div className="hover:bg-muted/40 group flex h-full flex-col gap-4 p-6 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="border-border text-muted-foreground group-hover:border-primary/50 group-hover:text-primary flex h-9 w-9 items-center justify-center rounded-md border transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-muted-foreground font-mono text-xs">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide">{title}</h3>
                  <p className="text-muted-foreground text-sm">{description}</p>
                </div>
                <div className="border-border text-primary mt-auto flex items-center gap-1.5 border-t pt-3 text-[11px] uppercase tracking-widest">
                  <span className="bg-primary h-1 w-1 rounded-full" />
                  {tag}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
