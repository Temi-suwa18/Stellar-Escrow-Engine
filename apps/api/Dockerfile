# syntax=docker/dockerfile:1.7

# --- Base ---
FROM node:20.11.0-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# --- Prune: extract only what apps/api needs from the monorepo ---
FROM base AS pruner
COPY . .
RUN pnpm add -g turbo@2.3.3
RUN turbo prune @stellar-commerce/api --docker

# --- Install dependencies for the pruned subset ---
FROM base AS installer
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# --- Build ---
FROM base AS builder
COPY --from=installer /app .
COPY --from=pruner /app/out/full/ .
RUN pnpm add -g turbo@2.3.3
RUN turbo build --filter=@stellar-commerce/api...

# --- Runtime ---
FROM node:20.11.0-bookworm-slim AS runner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nestjs
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder --chown=nestjs:nodejs /app .

USER nestjs
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:4000/health/live', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "apps/api/dist/main.js"]
