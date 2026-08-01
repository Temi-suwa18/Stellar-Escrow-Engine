import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" aria-hidden>
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
      <span className="text-lg font-semibold tracking-tight">ESCRA</span>
    </span>
  );
}
