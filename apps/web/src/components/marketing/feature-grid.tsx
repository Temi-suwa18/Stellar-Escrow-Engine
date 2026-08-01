import { BarChart3, FileText, Lock, Repeat, Share2, ShieldCheck, Webhook, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FadeIn } from './fade-in';

const FEATURES = [
  {
    icon: Zap,
    title: 'Hosted checkout',
    description:
      'Branded checkout pages for XLM, USDC, and any Stellar asset. Mobile-first, no redirects needed.',
  },
  {
    icon: Repeat,
    title: 'Subscriptions',
    description:
      'Monthly, weekly, or annual billing with trials, metered usage, dunning, and lifecycle webhooks.',
  },
  {
    icon: FileText,
    title: 'Invoicing',
    description:
      'Draft and recurring invoices, taxes, discounts, PDF generation, and automatic payment reminders.',
  },
  {
    icon: Lock,
    title: 'Escrow',
    description:
      'Soroban-backed escrow with milestone releases, time locks, multi-sig approval, and arbitrated disputes.',
  },
  {
    icon: Share2,
    title: 'Split payments',
    description:
      'Automatic revenue sharing across unlimited recipients — commissions, affiliates, and vendor payouts.',
  },
  {
    icon: ShieldCheck,
    title: 'Treasury',
    description:
      'Multi-wallet treasury with spending policies, approval workflows, and scheduled transfers.',
  },
  {
    icon: Webhook,
    title: 'Webhooks',
    description:
      'Signed event delivery with automatic retries for every payment, subscription, invoice, and escrow event.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description:
      'Revenue, MRR/ARR, churn, payment success rate, and customer lifetime value — exportable anytime.',
  },
] as const;

export function FeatureGrid() {
  return (
    <section id="features" className="border-border border-t py-24">
      <div className="container">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Everything a payments team needs
          </h2>
          <p className="text-muted-foreground mt-4 text-balance">
            One platform instead of five vendors — built for teams accepting payments on Stellar.
          </p>
        </FadeIn>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }, index) => (
            <FadeIn key={title} delay={index * 0.04}>
              <Card className="hover:border-primary/40 group h-full transition-colors hover:shadow-md">
                <CardHeader>
                  <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground mb-1 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{description}</p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
