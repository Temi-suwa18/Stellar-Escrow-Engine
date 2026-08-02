import { CodeWindow } from '@/components/marketing/code-window';

const ERROR_SNIPPET = `{
  "error": {
    "type": "invalid_request_error",
    "code": "conflict",
    "message": "Cannot fund an escrow in FUNDED status",
    "requestId": "req_a1b2c3d4"
  }
}`;

const ERROR_TYPES = [
  { type: 'invalid_request_error', meaning: 'Bad input, or the escrow is not in a valid state for this action.' },
  { type: 'authentication_error', meaning: 'Missing or invalid X-Api-Key.' },
  { type: 'rate_limit_error', meaning: 'Too many requests — back off and retry.' },
  { type: 'api_error', meaning: "Something failed on our end. Safe to retry; include the requestId if you report it." },
] as const;

export function ErrorEnvelope() {
  return (
    <section className="border-border bg-muted/30 border-b py-16">
      <div className="container">
        <div className="mx-auto grid max-w-3xl gap-8 lg:grid-cols-2 lg:items-start">
          <div className="flex min-w-0 flex-col gap-4">
            <span className="text-primary flex items-center gap-1.5 text-xs uppercase tracking-widest">
              <span className="bg-primary h-1.5 w-1.5 rounded-full" />
              Errors
            </span>
            <h2 className="text-2xl font-bold tracking-tight">One error shape, always</h2>
            <p className="text-muted-foreground text-sm">
              Every non-2xx response — validation failures, auth errors, internal errors — uses the
              same envelope, so you never have to branch on response shape. The SDK decodes this into
              a typed <code className="bg-background rounded px-1.5 py-0.5 font-mono text-xs">EscrowApiError</code>{' '}
              automatically.
            </p>
            <ul className="mt-2 flex flex-col gap-3">
              {ERROR_TYPES.map(({ type, meaning }) => (
                <li key={type} className="flex flex-col gap-0.5">
                  <code className="font-mono text-xs font-semibold">{type}</code>
                  <span className="text-muted-foreground text-xs">{meaning}</span>
                </li>
              ))}
            </ul>
          </div>
          <CodeWindow filename="error-response.json" code={ERROR_SNIPPET} className="min-w-0" />
        </div>
      </div>
    </section>
  );
}
