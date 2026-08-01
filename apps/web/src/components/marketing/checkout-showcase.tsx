import { Check } from 'lucide-react';
import { CheckoutPreview } from './checkout-preview';
import { FadeIn } from './fade-in';

const POINTS = [
  'Drop-in hosted checkout — no PCI scope, no custom UI to build',
  'Accepts XLM, USDC, and any Stellar asset you configure',
  'Branded to your product: logo, colors, and copy',
  'Session expiry, QR codes, and mobile-first layout built in',
] as const;

export function CheckoutShowcase() {
  return (
    <section className="border-border border-t py-24">
      <div className="container grid items-center gap-16 lg:grid-cols-2">
        <FadeIn className="flex flex-col gap-6">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            A checkout your customers actually trust
          </h2>
          <p className="text-muted-foreground text-balance">
            Every session is a hosted page you can embed or redirect to — live countdown, network
            badge, and payment status included.
          </p>
          <ul className="flex flex-col gap-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm">
                <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </FadeIn>

        <FadeIn delay={0.15} className="flex justify-center lg:justify-end">
          <CheckoutPreview />
        </FadeIn>
      </div>
    </section>
  );
}
