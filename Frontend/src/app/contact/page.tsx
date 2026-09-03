import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Github, MessageSquare, ShieldAlert } from 'lucide-react';
import { Navbar } from '@/components/marketing/navbar';
import { Footer } from '@/components/marketing/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Contact',
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Get in touch
            </h1>
            <p className="text-muted-foreground max-w-lg text-balance">
              ESCRA is developed in the open, so the fastest way to reach a real person is through
              the repository itself.
            </p>
          </div>

          <div className="grid w-full gap-4 sm:grid-cols-2">
            <Card className="rounded-md">
              <CardHeader>
                <div className="bg-primary/10 text-primary border-primary/30 mb-1 flex h-9 w-9 items-center justify-center rounded-md border">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm uppercase tracking-wide">
                  Questions &amp; feature requests
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-muted-foreground text-sm">
                  Open a GitHub issue — it&apos;s public, searchable, and the same place build
                  progress is tracked.
                </p>
                <Button variant="outline" size="sm" className="w-fit" asChild>
                  <Link
                    href="https://github.com/Temi-suwa18/Stellar-Escrow-Engine/issues"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Github className="mr-1.5 h-3.5 w-3.5" /> Open an issue
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-md">
              <CardHeader>
                <div className="bg-primary/10 text-primary border-primary/30 mb-1 flex h-9 w-9 items-center justify-center rounded-md border">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm uppercase tracking-wide">
                  Report a security issue
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-muted-foreground text-sm">
                  Please don&apos;t file a public issue for vulnerabilities — see the disclosure
                  process instead.
                </p>
                <Button variant="outline" size="sm" className="w-fit" asChild>
                  <Link href="/security">
                    Security page <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
