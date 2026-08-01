import { cn } from '@/lib/utils';

const CORNER_CLASSES = 'absolute h-3 w-3 border-primary/60';

/** Targeting-reticle style corner brackets, dropped over a hero visual for a technical/verified feel. */
export function BracketFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <span aria-hidden className={cn(CORNER_CLASSES, '-left-2 -top-2 border-l-2 border-t-2')} />
      <span aria-hidden className={cn(CORNER_CLASSES, '-right-2 -top-2 border-r-2 border-t-2')} />
      <span aria-hidden className={cn(CORNER_CLASSES, '-bottom-2 -left-2 border-b-2 border-l-2')} />
      <span
        aria-hidden
        className={cn(CORNER_CLASSES, '-bottom-2 -right-2 border-b-2 border-r-2')}
      />
      {children}
    </div>
  );
}
