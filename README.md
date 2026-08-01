# Stellar Escrow Engine

A universal escrow protocol on Stellar — freelance work, ecommerce orders,
rental/vehicle deposits, and logistics shipments, all through one API with
milestone releases, disputes, and multi-sig approval built in. Apps just call
the API.

> **Status:** actively under construction, built module by module. See
> [Build Progress](#build-progress) below for what's implemented today versus
> what's planned.

## Monorepo layout

```
apps/
  api/            NestJS backend — REST API, background jobs, webhooks
  web/            Next.js merchant dashboard (App Router)
packages/
  database/       Prisma schema + generated client (shared by api and jobs)
  types/          Shared TypeScript types/DTOs between api and web
  config/         Shared tsconfig presets
sdks/
  typescript/     Official TypeScript/JavaScript SDK
contracts/        Soroban smart contracts (escrow, milestones, split payments, treasury, subscriptions)
infra/
  docker/         Supporting Docker assets
  terraform/      Terraform-ready infrastructure-as-code
docs/             Architecture and API documentation
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
docker compose up -d postgres redis
pnpm dev                      # runs api (http://localhost:4000) and web (http://localhost:3000)
```

The API's interactive Swagger docs are served at `http://localhost:4000/docs`
outside production. Health probes: `GET /health/live` (liveness) and
`GET /health/ready` (readiness — checks Redis and disk).

### Full stack via Docker Compose

```bash
docker compose up --build
```

### Common scripts

| Command                        | Description                                            |
| ------------------------------ | ------------------------------------------------------ |
| `pnpm dev`                     | Run all apps in watch mode                             |
| `pnpm build`                   | Build every workspace via Turborepo                    |
| `pnpm lint` / `pnpm typecheck` | Static checks across the monorepo                      |
| `pnpm test` / `pnpm test:e2e`  | Unit and end-to-end tests                              |
| `pnpm db:migrate`              | Run Prisma migrations (once `packages/database` lands) |
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
      7-decimal precision (not 2-decimal cents). `@stellar-commerce/database`
      wired into the API with a Prisma-backed `/health/ready` check.
      Schema validated via `prisma generate` + a real generated migration
      (`prisma migrate diff`); live `migrate dev` against Postgres still
      needs to be run in an environment with a database available.
- [~] **Module 3 — Authentication & authorization.** Email/password, Google
      OAuth, GitHub OAuth, magic link, 2FA, session management, API keys,
      organization invitations, multi-tenant orgs, RBAC (Owner, Admin,
      Developer, Finance, Viewer). Backend implemented; needs a live-DB test
      pass and frontend wiring.
- [ ] Escrow API (create/fund/release/refund/dispute, milestones) — the core
      product surface for freelance, ecommerce, rental, and logistics
- [ ] Escrow dashboard (view deals, milestones, disputes)
- [ ] Webhooks (escrow.created/funded/released/disputed, retries, signing)
- [ ] Soroban escrow + milestone contracts
- [ ] Developer portal & SDKs (TypeScript first, others after)
- [ ] Security hardening pass (rate limiting, CSRF/XSS/SQLi defenses, secret encryption, audit logging)
- [ ] End-to-end test suite (Playwright) + smart contract tests
- [ ] Production deployment (Kubernetes-ready manifests, Terraform)

> **Note:** this project pivoted from a broad Stripe-style commerce platform
> (checkout/subscriptions/invoicing/treasury) to a focused escrow protocol.
> The Module 2 database schema still contains those broader models — they're
> unused by the current product direction and will be trimmed as the escrow
> API solidifies, rather than rewritten under time pressure right now.

## License

Proprietary — all rights reserved. No license is granted to use, copy, modify,
or distribute this code without explicit permission.
