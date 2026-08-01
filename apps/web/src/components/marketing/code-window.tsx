import { cn } from '@/lib/utils';

// A small, dependency-free tokenizer for the JS/TS snippets shown on the
// marketing site. Not a general-purpose highlighter — just enough token
// classes (comments, strings, keywords, numbers, punctuation) to make the
// code samples readable at a glance without shipping a full highlighting
// library for a handful of static snippets.
const TOKEN_PATTERN =
  /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(const|await|async|function|return|new|import|from|export|default|if|else|for|throw|class|extends)\b|\b(\d+(?:\.\d+)?)\b/gm;

function highlight(code: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  TOKEN_PATTERN.lastIndex = 0;
  while ((match = TOKEN_PATTERN.exec(code)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(code.slice(lastIndex, match.index));
    }
    const [full, comment, string, keyword, number] = match;
    if (comment) {
      nodes.push(
        <span key={key++} className="text-muted-foreground/70">
          {comment}
        </span>,
      );
    } else if (string) {
      nodes.push(
        <span key={key++} className="text-emerald-600 dark:text-emerald-400">
          {string}
        </span>,
      );
    } else if (keyword) {
      nodes.push(
        <span key={key++} className="text-sky-600 dark:text-sky-400">
          {keyword}
        </span>,
      );
    } else if (number) {
      nodes.push(
        <span key={key++} className="text-amber-600 dark:text-amber-400">
          {number}
        </span>,
      );
    } else {
      nodes.push(full);
    }
    lastIndex = match.index + full.length;
  }
  if (lastIndex < code.length) nodes.push(code.slice(lastIndex));
  return nodes;
}

export function CodeWindow({
  filename,
  code,
  className,
}: {
  filename: string;
  code: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border overflow-hidden rounded-xl border bg-[#0b0f19] shadow-2xl shadow-black/10 dark:shadow-black/40',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-white/5 bg-white/[0.03] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
        <span className="ml-3 font-mono text-xs text-white/40">{filename}</span>
      </div>
      <pre className="overflow-x-auto p-5 text-sm leading-relaxed">
        <code className="font-mono text-white/90">{highlight(code)}</code>
      </pre>
    </div>
  );
}
