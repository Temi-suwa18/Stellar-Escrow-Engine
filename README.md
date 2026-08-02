# ESCRA - Stellar Escrow Engine

A universal escrow protocol on Stellar — freelance work, ecommerce orders,
rental/vehicle deposits, and logistics shipments, all through one API with
milestone releases, disputes, and multi-sig approval built in. Apps just call
the API.

> **Status:** actively under construction, built module by module. See
> [Build Progress](#build-progress) below for what's implemented today versus
> what's planned.

## Monorepo layout

```
Frontend/           Next.js dashboard & marketing site (App Router)
Backend/             NestJS API — escrows, auth, organizations, webhooks
Blockchain/
  contracts/        Soroban escrow smart contract (Rust), deployed to testnet
  sdk/              @stellar-escrow/blockchain — internal contract client
Infra/
  docker/           Supporting Docker assets
  terraform/        Terraform-ready infrastructure-as-code
packages/
  database/         Prisma schema + generated client (shared by Backend)
  config/           Shared tsconfig presets
sdks/
  typescript/       Official TypeScript/JavaScript SDK
docs/               Architecture and API documentation
```

## Tech stack

| Layer      | Technology                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Frontend   | Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, TanStack Query, Zustand, React Hook Form, Zod |
| Backend    | NestJS, TypeScript, PostgreSQL, Prisma, Redis, BullMQ, Passport/JWT, Swagger                                                   |
| Blockchain | Stellar SDK, Soroban SDK, Soroban smart contracts (Rust)                                                                       |
| Infra      | Docker, Docker Compose, GitHub Actions, Terraform-ready, AWS-ready                                                             |

## Getting started

**Prerequisites:** Node.js 20.11+, pnpm 9+, Docker.

```bash
cp .env.example .env          # fill in real secrets before running anything beyond local dev
pnpm install
docker compose -f Infra/docker/docker-compose.yml up -d postgres redis
pnpm dev                      # runs api (http://localhost:4000) and web (http://localhost:3000)
```

The API's interactive Swagger docs are served at `http://localhost:4000/docs`
outside production. Health probes: `GET /health/live` (liveness) and
`GET /health/ready` (readiness — checks Redis and disk).

### Full stack via Docker Compose

```bash
docker compose -f Infra/docker/docker-compose.yml up --build
```

### Common scripts

| Command                        | Description                                            |
| ------------------------------ | ------------------------------------------------------ |
| `pnpm dev`                     | Run all apps in watch mode                             |
| `pnpm build`                   | Build every workspace via Turborepo                    |
| `pnpm lint` / `pnpm typecheck` | Static checks across the monorepo                      |
| `pnpm test` / `pnpm test:e2e`  | Unit and end-to-end tests                              |
| `pnpm db:migrate`              | Run Prisma migrations against `DATABASE_URL`            |
| `pnpm db:studio`               | Open Prisma Studio                                     |

## Build Progress

Each module below is implemented completely — real code, real tests, no
placeholders — before moving to the next.

- [x] **Module 1 — Monorepo foundation.** pnpm + Turborepo workspace, shared
      tsconfig, NestJS API skeleton (config validation, Pino logging, Helmet,
      CORS, global exception handling, request IDs, rate limiting, Swagger,
      liveness/readiness health checks), Next.js dashboard skeleton (App
      Router, Tailwind + shadcn/ui, dark/light mode, TanStack Query, Zustand
      ready), Docker Compose for local dev, multi-stage Dockerfiles for both
      apps, GitHub Actions CI (lint, typecheck, test, build, Docker build).
- [x] **Module 2 — Database schema.** Full Prisma schema (32 models): users,
      OAuth accounts, sessions, magic links, 2FA recovery codes,
      organizations, membership/RBAC, invitations, API keys, wallets,
      customers, products, prices, payments, transactions, refunds,
      invoices/invoice items, subscriptions, usage records, escrows,
      milestones, split payments/recipients, treasury transfers/approvals,
      webhook endpoints/events, audit logs, notifications, daily metrics
      rollup, org settings. Money stored as `Decimal(20,7)` for Stellar's
      7-decimal precision (not 2-decimal cents). `@stellar-escrow/database`
      wired into the API with a Prisma-backed `/health/ready` check.
      Schema validated via `prisma generate` + a real generated migration
      (`prisma migrate diff`); live `migrate dev` against Postgres still
      needs to be run in an environment with a database available.
- [x] **Module 3 — Authentication & authorization.** Email/password, Google
      OAuth, GitHub OAuth, magic link, 2FA, session management (JWT access +
      rotating refresh tokens with reuse detection), API keys, organization
      invitations, multi-tenant orgs, RBAC (Owner, Admin, Developer,
      Finance, Viewer). Frontend wired end-to-end (signup/login/dashboard).
      Unit-tested throughout — auth flow, session rotation, password
      hashing, 2FA (real TOTP round-trips, not mocked), token signing, email
      sending. Still needs a live-DB pass; this sandbox has never had a
      reachable Postgres to run one against.
- [x] **Escrow API.** Create (with optional milestones, time locks, or an
      ecommerce-style auto-release window), fund, release (full or
      per-milestone, auto-completing once every milestone is released),
      refund, dispute (requires an arbitrator wallet), and resolve. One
      category enum (freelance/ecommerce/rental/logistics) drives defaults;
      the endpoints are identical across all four. Authenticated with
      `X-Api-Key` — "apps just call the API" is the actual auth model here,
      not a JWT dashboard session.
- [x] **Soroban escrow contract**, deployed and verified against real
      Stellar testnet (not just unit-tested): create → fund → release moved
      real XLM buyer → contract → seller, confirmed via Horizon. The Backend
      verifies every fund/release/refund/dispute/resolve call against live
      on-chain state before trusting a client-supplied transaction hash,
      for any escrow with an arbitrator and a resolvable asset — DB-only
      escrows (no arbitrator) still work exactly as before. Not yet
      supported on-chain: per-milestone release (the contract only knows
      whole-escrow state) and `autoReleaseAt` (stored, nothing executes it
      yet — no background scheduler exists).
- [x] **`@stellar-escrow/sdk`** — the official TypeScript/JavaScript API
      client (`sdks/typescript`), covering every escrow endpoint including
      the on-chain state read. Zero dependencies beyond `fetch`.
- [x] **Developer docs** (`/docs` on the marketing site) — quickstart,
      full endpoint reference, auth model, and the Stripe-style error
      envelope, generated from the real API surface.
- [ ] Escrow dashboard (view deals, milestones, disputes) — the dashboard
      currently only manages API keys; browsing escrows themselves needs a
      session-authenticated read path, since the Escrows API is API-key
      only by design (see above).
- [ ] Webhooks (escrow.created/funded/released/disputed, retries, signing)
- [ ] Per-milestone release on the Soroban contract
- [ ] Security hardening pass beyond what's landed so far (rate limiting
      and on-chain tx verification exist; still want CSRF defenses, secret
      encryption at rest, audit logging)
- [ ] End-to-end test suite (Playwright) — unit and integration tests exist
      throughout the Backend, Frontend, Blockchain SDK, and public SDK; nothing
      yet drives the full stack through a browser automatically
- [ ] Production deployment: `Infra/terraform` provisions AWS (VPC, ECS
      Fargate with autoscaling, RDS, ElastiCache, ALB, ECR) and CI pushes
      images to ECR on every merge to `main` — `terraform apply` and wiring
      a new image into the running ECS services is still a manual, gated step

> **Note:** this project pivoted from a broad Stripe-style commerce platform
> (checkout/subscriptions/invoicing/treasury) to a focused escrow protocol.
> The Module 2 database schema still contains those broader models — they're
> unused by the current product direction and will be trimmed as the escrow
> API solidifies, rather than rewritten under time pressure right now.

## License

Proprietary — all rights reserved. No license is granted to use, copy, modify,
or distribute this code without explicit permission.
