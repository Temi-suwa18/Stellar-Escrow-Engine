import {
  Briefcase,
  Car,
  Gavel,
  Lock,
  Milestone,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FadeIn } from './fade-in';

const FEATURES = [
  {
    icon: Briefcase,
    title: 'Freelance',
    description: 'Escrow project payments with milestone-based releases as work is delivered.',
  },
  {
    icon: ShoppingCart,
    title: 'Ecommerce',
    description: 'Hold buyer funds until delivery is confirmed — chargeback-proof, on-chain.',
  },
  {
    icon: Car,
    title: 'Rentals & vehicles',
    description: 'Security deposits and rental payments released automatically on return.',
  },
  {
    icon: Truck,
    title: 'Logistics',
    description: 'Shipment-linked escrow that releases on proof of delivery.',
  },
  {
    icon: Milestone,
    title: 'Milestone payments',
    description: 'Split any deal into milestones, each independently funded and released.',
  },
  {
    icon: Gavel,
    title: 'Dispute resolution',
    description: 'Built-in arbitrator workflow when depositor and beneficiary disagree.',
  },
  {
    icon: Users,
    title: 'Multi-signature',
    description: 'Require multiple approvals before high-value releases go through.',
  },
  {
    icon: Lock,
    title: 'Time locks',
    description: 'Automatic release or refund once a deadline passes with no action.',
  },
] as const;

export function FeatureGrid() {
  return (
    <section id="features" className="border-t border-border py-24">
      <div className="container">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            One escrow engine, every use case
          </h2>
          <p className="mt-4 text-balance text-muted-foreground">
            Stop building custom escrow logic per product line — the category just changes the
            defaults, not the API.
          </p>
        </FadeIn>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }, index) => (
            <FadeIn key={title} delay={index * 0.04}>
              <Card className="group h-full transition-colors hover:border-primary/40 hover:shadow-md">
                <CardHeader>
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
