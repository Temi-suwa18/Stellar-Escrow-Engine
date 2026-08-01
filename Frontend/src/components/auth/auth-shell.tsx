import Link from 'next/link';
import { Check } from 'lucide-react';
import { Logo } from '@/components/marketing/logo';

const PANEL_POINTS = [
  'Non-custodial settlement on Stellar',
  'One API for freelance, ecommerce, rental, and logistics escrow',
  'Test-mode keys available immediately, no approval wait',
] as const;

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0b0f19] p-10 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_50%_at_20%_0%,rgba(99,102,241,0.25),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px]"
        />

        <Link href="/" className="relative z-10">
          <Logo className="text-white" />
        </Link>

        <div className="relative z-10 flex flex-col gap-6">
          <p className="text-balance text-3xl font-semibold leading-tight tracking-tight">
            A universal escrow protocol for Stellar.
          </p>
          <ul className="flex flex-col gap-3">
            {PANEL_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm text-white/70">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/40">© {new Date().getFullYear()} ESCRA</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 px-6 py-16">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          </div>

          {children}

          <p className="text-muted-foreground text-center text-sm">{footer}</p>
        </div>
      </div>
    </div>
  );
}
