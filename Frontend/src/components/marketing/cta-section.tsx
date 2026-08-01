import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FadeIn } from './fade-in';

export function CtaSection() {
  return (
    <section className="border-border border-t py-24">
      <div className="container">
        <FadeIn>
          <div className="border-border bg-primary/5 relative overflow-hidden rounded-md border px-6 py-16 text-center sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:48px_48px] opacity-30 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]"
            />
            <div className="relative flex flex-col items-center gap-6">
              <span className="text-primary flex items-center gap-1.5 text-xs uppercase tracking-widest">
                <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                Get started
              </span>
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Start escrowing deals today
              </h2>
              <p className="text-muted-foreground max-w-xl text-balance">
                Free in test mode. No credit card required to start integrating.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button size="lg" className="uppercase tracking-widest" asChild>
                  <Link href="/signup">
                    Create an account <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="uppercase tracking-widest" asChild>
                  <Link href="/docs">Read the docs</Link>
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
