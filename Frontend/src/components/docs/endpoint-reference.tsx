const METHOD_STYLES: Record<string, string> = {
  GET: 'text-sky-600 dark:text-sky-400 border-sky-600/30 dark:border-sky-400/30',
  POST: 'text-emerald-600 dark:text-emerald-400 border-emerald-600/30 dark:border-emerald-400/30',
};

interface Endpoint {
  method: 'GET' | 'POST';
  path: string;
  description: string;
}

// Generated from Backend/src/escrows/escrows.controller.ts — keep in sync
// with the actual routes, not an idealized version of them.
const ENDPOINTS: Endpoint[] = [
  { method: 'POST', path: '/escrows', description: 'Create a new escrow deal.' },
  { method: 'GET', path: '/escrows', description: 'List escrows for your organization, paginated.' },
  { method: 'GET', path: '/escrows/:id', description: 'Fetch a single escrow.' },
  {
    method: 'GET',
    path: '/escrows/:id/on-chain',
    description: 'Live state read directly from the escrow smart contract.',
  },
  {
    method: 'POST',
    path: '/escrows/:id/fund',
    description: 'Mark an escrow funded. Verified against the chain when the deal is chain-eligible.',
  },
  {
    method: 'POST',
    path: '/escrows/:id/release',
    description: 'Full release — only valid with no milestones, or once every milestone is released.',
  },
  {
    method: 'POST',
    path: '/escrows/:id/milestones/:milestoneId/release',
    description: 'Release a single milestone.',
  },
  { method: 'POST', path: '/escrows/:id/refund', description: 'Refund the depositor.' },
  {
    method: 'POST',
    path: '/escrows/:id/dispute',
    description: 'Open a dispute — requires an arbitratorWallet on the escrow.',
  },
  {
    method: 'POST',
    path: '/escrows/:id/resolve',
    description: "Arbiter settles a disputed escrow, releasing or refunding.",
  },
];

export function EndpointReference() {
  return (
    <section className="border-border border-b py-16">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <span className="text-primary flex items-center gap-1.5 text-xs uppercase tracking-widest">
            <span className="bg-primary h-1.5 w-1.5 rounded-full" />
            Reference
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">Endpoints</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            All paths are relative to <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">/v1</code>.
          </p>

          <div className="border-border mt-8 divide-y divide-border rounded-md border">
            {ENDPOINTS.map((endpoint) => (
              <div
                key={`${endpoint.method}-${endpoint.path}`}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="flex items-start gap-3 sm:w-72 sm:shrink-0">
                  <span
                    className={`mt-0.5 inline-flex w-14 shrink-0 justify-center rounded border py-0.5 font-mono text-xs font-semibold ${METHOD_STYLES[endpoint.method]}`}
                  >
                    {endpoint.method}
                  </span>
                  <code className="min-w-0 break-all font-mono text-sm">{endpoint.path}</code>
                </div>
                <p className="text-muted-foreground text-sm">{endpoint.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
