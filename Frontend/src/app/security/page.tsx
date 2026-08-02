import type { Metadata } from 'next';
import Link from 'next/link';
import { Github, KeyRound, Lock, ShieldCheck, Wallet } from 'lucide-react';
import { Navbar } from '@/components/marketing/navbar';
import { Footer } from '@/components/marketing/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Security',
};

const PRACTICES = [
  {
    icon: Wallet,
    title: 'Non-custodial by design',
    description:
      'The API never holds signing keys for escrowed funds. Money moves through a Soroban smart contract that only the depositor, beneficiary, or arbitrator wallet can authorize — not through a database balance ESCRA controls.',
  },
  {
    icon: ShieldCheck,
    title: 'On-chain state is the source of truth',
    description:
      'For any escrow registered on-chain, every fund/release/refund/dispute/resolve call is verified against the real Soroban contract state before the API trusts it — not just the transaction hash a caller happens to send.',
  },
  {
    icon: KeyRound,
    title: 'Session security',
    description:
      'Short-lived JWT access tokens paired with rotating refresh tokens — reusing an already-rotated refresh token is detected and rejected, not silently accepted. Passwords are hashed with bcrypt; 2FA uses standard TOTP with single-use recovery codes.',
  },
  {
    icon: Lock,
    title: 'Rate limiting on credential-guessing endpoints',
    description:
      'Login, registration, magic-link requests, and 2FA confirmation/disable are all throttled well below the API’s general rate limit, specifically because they’re the shape of endpoint brute-force tooling targets.',
  },
] as const;

export default function SecurityPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="border-border border-b py-20">
          <div className="container flex flex-col items-center gap-5 text-center">
            <span className="text-primary flex items-center gap-1.5 text-xs uppercase tracking-widest">
              <span className="bg-primary h-1.5 w-1.5 rounded-full" />
              Security
            </span>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              How ESCRA handles security
            </h1>
            <p className="text-muted-foreground max-w-2xl text-balance text-lg">
              ESCRA is a young, openly-developed project — this page describes what&apos;s
              actually implemented today, not an aspirational compliance checklist.
            </p>
          </div>
        </section>

        <section className="border-border border-b py-16">
          <div className="container">
            <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
              {PRACTICES.map(({ icon: Icon, title, description }) => (
                <Card key={title} className="h-full rounded-md">
                  <CardHeader>
                    <div className="bg-primary/10 text-primary border-primary/30 mb-1 flex h-9 w-9 items-center justify-center rounded-md border">
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm uppercase tracking-wide">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground text-sm">{description}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container flex flex-col items-center gap-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Reporting a vulnerability</h2>
            <p className="text-muted-foreground max-w-xl text-balance">
              Please report security issues privately rather than through a public GitHub issue.
              See <code className="bg-muted rounded px-1.5 py-0.5 text-xs">SECURITY.md</code> in
              the repository for the current disclosure process.
            </p>
            <Link
              href="https://github.com/Temi-suwa18/Stellar-Escrow-Engine/security/policy"
              target="_blank"
              rel="noreferrer"
              className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
            >
              <Github className="h-4 w-4" /> View SECURITY.md
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
