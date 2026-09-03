import { FadeIn } from './fade-in';

const STEPS = [
  {
    step: '01',
    title: 'Create your account',
    description:
      'Sign up, create an organization, and generate a test-mode API key from the dashboard — no waiting on approval to start integrating.',
  },
  {
    step: '02',
    title: 'Create an escrow',
    description:
      'Pick a category (freelance, ecommerce, rental, logistics), define milestones if needed, and call one endpoint.',
  },
  {
    step: '03',
    title: 'Release or refund',
    description:
      'Funds settle directly on Stellar via Soroban — release on milestone completion, refund on dispute, no intermediary custody.',
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-border border-t py-24">
      <div className="container">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <span className="text-primary flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest">
            <span className="bg-primary h-1.5 w-1.5 rounded-full" />
            How it works
          </span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Live in an afternoon
          </h2>
          <p className="text-muted-foreground mt-4 text-balance">
            No sales calls required to start building against the test network.
          </p>
        </FadeIn>

        <div className="relative mx-auto mt-16 grid max-w-4xl gap-10 sm:grid-cols-3">
          <div
            aria-hidden
            className="bg-border absolute left-0 right-0 top-6 hidden h-px sm:block"
            style={{ marginInline: '16.66%' }}
          />
          {STEPS.map((item, index) => (
            <FadeIn
              key={item.step}
              delay={index * 0.1}
              className="relative flex flex-col items-center text-center sm:items-start sm:text-left"
            >
              <div className="border-border bg-background text-primary relative z-10 flex h-12 w-12 items-center justify-center rounded-md border font-mono text-sm font-bold">
                {item.step}
              </div>
              <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide">{item.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{item.description}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
