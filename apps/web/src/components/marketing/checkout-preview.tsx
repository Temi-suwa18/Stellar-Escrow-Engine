'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const START_SECONDS = 29 * 60 + 42;

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** A live-feeling (but static-data) preview of the hosted checkout widget merchants embed. */
export function CheckoutPreview() {
  const [secondsLeft, setSecondsLeft] = useState(START_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((value) => (value > 0 ? value - 1 : START_SECONDS));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-border bg-card w-full max-w-sm rounded-2xl border p-6 shadow-xl shadow-black/5 dark:shadow-black/30">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-sm font-bold text-white">
          A
        </div>
        <div>
          <p className="text-sm font-semibold">Acme Store</p>
          <p className="text-muted-foreground text-xs">Order #8842</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-1 py-4 text-center">
        <span className="text-muted-foreground text-xs uppercase tracking-wide">Amount due</span>
        <span className="text-4xl font-bold tracking-tight">
          25.00 <span className="text-muted-foreground text-lg font-medium">USDC</span>
        </span>
      </div>

      <div className="border-border bg-muted/40 flex flex-col gap-2 rounded-lg border px-4 py-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Network</span>
          <Badge variant="secondary">Stellar mainnet</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Expires in</span>
          <span className="font-mono font-medium tabular-nums">{formatCountdown(secondsLeft)}</span>
        </div>
      </div>

      <Button className="mt-5 w-full" size="lg">
        Complete payment
      </Button>

      <p className="text-muted-foreground mt-4 flex items-center justify-center gap-1.5 text-xs">
        <ShieldCheck className="h-3.5 w-3.5" />
        Secured by Stellar Commerce
      </p>
    </div>
  );
}
