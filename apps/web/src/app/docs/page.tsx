import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Github } from 'lucide-react';
import { Navbar } from '@/components/marketing/navbar';
import { Footer } from '@/components/marketing/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Developer docs',
};

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="flex max-w-lg flex-col items-center gap-5 text-center">
          <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-2xl">
            <BookOpen className="h-7 w-7" />
          </div>
          <Badge variant="secondary">On the roadmap</Badge>
          <h1 className="text-balance text-3xl font-bold tracking-tight">
            The developer portal isn&apos;t live yet
          </h1>
          <p className="text-muted-foreground text-balance">
            Interactive API docs, the API explorer, and downloadable SDKs ship alongside the Payment
            API module. Until then, the platform is being built in the open — every module is
            documented in the repo as it lands.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link
                href="https://github.com/Temi-suwa18/Stellar-Commerce-API"
                target="_blank"
                rel="noreferrer"
              >
                <Github className="mr-1.5 h-4 w-4" /> Follow progress on GitHub
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                Back home <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
