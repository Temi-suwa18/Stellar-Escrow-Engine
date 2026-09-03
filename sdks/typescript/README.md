# @stellar-escrow/sdk

Official TypeScript/JavaScript client for the ESCRA escrow API. Zero
dependencies beyond the platform's own `fetch` (Node 18+, browsers, edge
runtimes).

```bash
npm install @stellar-escrow/sdk
```

```ts
import { StellarEscrow } from '@stellar-escrow/sdk';

const escrow = new StellarEscrow(process.env.ESCROW_API_KEY!, {
  baseUrl: 'http://localhost:4000', // defaults to the production API
});

const deal = await escrow.create({
  category: 'FREELANCE',
  amount: 500,
  asset: 'USDC',
  depositorWallet: 'GABC...123',
  beneficiaryWallet: 'GXYZ...789',
  arbitratorWallet: 'GARB...456',
  milestones: [
    { description: 'Design draft', amount: 200 },
    { description: 'Final delivery', amount: 300 },
  ],
});

// If the deal is chain-eligible (has an arbitrator + a resolvable asset),
// `deal.unsignedCreateTransactionXdr` is a transaction for the depositor's
// wallet to sign and submit before funding.

await escrow.fund(deal.id, { stellarTxHash: '...' });
await escrow.releaseMilestone(deal.id, deal.milestones[0].id);
```

## API

| Method | Endpoint |
|---|---|
| `create(input)` | `POST /escrows` |
| `list(query?)` | `GET /escrows` |
| `get(id)` | `GET /escrows/:id` |
| `fund(id, input)` | `POST /escrows/:id/fund` |
| `release(id, input?)` | `POST /escrows/:id/release` |
| `releaseMilestone(id, milestoneId)` | `POST /escrows/:id/milestones/:milestoneId/release` |
| `refund(id, input?)` | `POST /escrows/:id/refund` |
| `dispute(id, input)` | `POST /escrows/:id/dispute` |
| `resolve(id, input)` | `POST /escrows/:id/resolve` |
| `getOnChain(id)` | `GET /escrows/:id/on-chain` |

Every method throws `EscrowApiError` (with `status`, `code`, `type`, and
`requestId`) on a non-2xx response — the API's Stripe-style error envelope,
decoded for you.

`amount` fields come back as `string` (Prisma serializes `Decimal` that way
over JSON) — use `Number(deal.amount)` if you need to do arithmetic.

## Development

```bash
pnpm install   # from repo root
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```
