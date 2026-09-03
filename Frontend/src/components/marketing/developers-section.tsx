import Link from 'next/link';
import { ArrowRight, BookOpen, Terminal, Webhook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FadeIn } from './fade-in';

const LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'PHP', 'Java'] as const;

const DEV_TOOLS = [
  {
    icon: BookOpen,
    title: 'Interactive API docs',
    description:
      'Full Swagger/OpenAPI reference with a live API explorer — try requests from the browser.',
  },
  {
    icon: Terminal,
    title: 'Official SDKs',
    description:
      'Idiomatic clients for seven languages, generated from the same OpenAPI spec that powers the docs.',
  },
  {
    icon: Webhook,
    title: 'Webhook testing',
    description:
      'Send test events to your local endpoint and inspect delivery attempts, retries, and signatures.',
  },
] as const;

export function DevelopersSection() {
  return (
    <section id="developers" className="border-border bg-muted/30 border-t py-24">
      <div className="container">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <span className="text-primary flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest">
            <span className="bg-primary h-1.5 w-1.5 rounded-full" />
            Developers
          </span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Built for developers
          </h2>
          <p className="text-muted-foreground mt-4 text-balance">
            One OpenAPI spec, seven official SDKs, and a developer portal that doesn&apos;t make you
            dig through PDFs.
          </p>
        </FadeIn>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {DEV_TOOLS.map(({ icon: Icon, title, description }, index) => (
            <FadeIn key={title} delay={index * 0.05}>
              <Card className="h-full rounded-md">
                <CardHeader>
                  <div className="bg-primary/10 text-primary border-primary/30 mb-1 flex h-9 w-9 items-center justify-center rounded-md border">
                    <Icon className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm uppercase tracking-wide">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </FadeIn>
          ))}
        </div>

        <FadeIn
          delay={0.15}
          className="mx-auto mt-14 flex max-w-3xl flex-col items-center gap-6 text-center"
        >
          <div className="flex flex-wrap justify-center gap-2">
            {LANGUAGES.map((lang) => (
              <span
                key={lang}
                className="border-border bg-background rounded-md border px-3.5 py-1.5 text-xs uppercase tracking-widest"
              >
                {lang}
              </span>
            ))}
          </div>
          <Button
            variant="outline"
            className="h-auto whitespace-normal text-center uppercase tracking-widest"
            asChild
          >
            <Link href="/docs">
              Explore the developer portal <ArrowRight className="ml-1.5 inline h-4 w-4 shrink-0" />
            </Link>
          </Button>
        </FadeIn>
      </div>
    </section>
  );
}
