import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="border-primary/40 bg-primary/10 relative flex h-7 w-7 items-center justify-center rounded-md border">
        <svg viewBox="0 0 24 24" fill="none" className="text-primary h-4 w-4" aria-hidden>
          <path
            d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M12 12 3 7m9 5 9-5m-9 5v10"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-lg font-semibold uppercase tracking-widest">ESCRA</span>
    </span>
  );
}
