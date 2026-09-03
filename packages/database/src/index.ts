import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient across hot reloads in development — each
// module reload would otherwise open a fresh pool of Postgres connections
// until the process runs out of them.
declare global {
  var __stellarCommercePrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__stellarCommercePrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__stellarCommercePrisma = prisma;
}

export * from '@prisma/client';
