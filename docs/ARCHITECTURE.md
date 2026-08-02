# Architecture

A tour of how the pieces fit together — for contributors, not end users
(end-user API docs live at `/docs` on the marketing site, backed by
`Backend/src/escrows/escrows.controller.ts`; interactive Swagger is served
at `Backend`'s `/docs` route outside production).

## The shape of the system

```
                    ┌─────────────────────┐
   Browser  ──────► │  Frontend (Next.js)  │  session-authenticated
                    │  dashboard/marketing │  (JWT, via /auth/*)
                    └──────────┬───────────┘
                               │ /v1/auth/*, /v1/organizations/*
                               ▼
   API-key   ──────► ┌──────────────────────┐        ┌──────────────────┐
   caller             │  Backend (NestJS)     │───────►│  Postgres (Prisma) │
   ("apps just        │  /v1/escrows/*        │        └──────────────────┘
   call the API")     └──────────┬───────────┘
                               │ verifies on-chain state via
                               ▼
                    ┌──────────────────────┐        ┌──────────────────┐
                    │ @stellar-escrow/      │───────►│ Soroban escrow    │
                    │ blockchain (internal) │        │ contract (testnet)│
                    └──────────────────────┘        └──────────────────┘
```

Two genuinely separate auth models exist side by side, on purpose:

- **Dashboard** (`Frontend/`): a human signs in, gets a JWT session, manages
  their organization and API keys.
- **Escrows API** (`/v1/escrows/*`): an *application* calls it with an
  `X-Api-Key` header. This is deliberate — "apps just call the API" is the
  actual product, not a JWT-gated dashboard flow. The dashboard cannot call
  the Escrows API directly for this reason (see `Backend/src/api-keys/` —
  the dashboard's job is to *issue* the key an app then uses).

## Why an escrow needs both a DB row and a chain registration

`Escrow` rows exist in Postgres regardless of blockchain configuration —
creating one never depends on a reachable Soroban RPC. A row becomes
*chain-eligible* only when it has an `arbitratorWallet` (the contract
requires one; the DB allows null) and its `asset` resolves to a real
Soroban token contract (`BlockchainService.resolveAssetContract` — derived
deterministically from the SDK, e.g. `Asset.native().contractId(...)` for
XLM, never a hardcoded/guessed address table).

For a chain-eligible escrow, every state-changing call
(`fund`/`release`/`refund`/`dispute`/`resolve`) requires a
`stellarTxHash` and is verified against live contract state
(`BlockchainService.verifyOnChain` in `Backend/src/escrows/escrows.service.ts`)
before the DB row's status changes — the API never trusts a client-supplied
hash on faith. Eligibility itself is *recomputed* from the escrow's
existing fields every time, not stored as a flag, specifically so the DB
and the chain can never drift out of sync with each other.

For a non-chain-eligible escrow (no arbitrator, or an unresolvable asset),
every action falls back to the original DB-only behavior — nothing about
enabling the blockchain integration is a breaking change for existing rows.

## Monorepo boundaries

| Package | Depends on | Publishes |
|---|---|---|
| `packages/database` | Prisma schema | `@stellar-escrow/database` (Postgres client) |
| `Blockchain/contracts/escrow` | soroban-sdk (Rust) | the deployed WASM contract |
| `Blockchain/sdk` | `@stellar/stellar-sdk` | `@stellar-escrow/blockchain` — internal contract client, used only by `Backend` |
| `sdks/typescript` | nothing but `fetch` | `@stellar-escrow/sdk` — the **public** API client, what integrators install |
| `Backend` | `database`, `blockchain` | the NestJS API |
| `Frontend` | none of the above | the dashboard/marketing site, talks to `Backend` over HTTP only |

The two TypeScript "SDK" packages exist for different audiences and don't
share code: `Blockchain/sdk` is Backend-internal plumbing for talking to
the Soroban contract directly; `sdks/typescript` is what a developer
integrating with the *hosted API* installs, and never touches Soroban
directly.

## Where to look for more detail

- `Blockchain/README.md` — the contract's state machine, deployment steps,
  and why the codec is verified against real contract-emitted XDR rather
  than assumed from docs.
- `Infra/terraform/README.md` — what's actually provisioned on AWS and
  what's still a manual, gated step.
- `SECURITY.md` — known limitations and the vulnerability disclosure process.
