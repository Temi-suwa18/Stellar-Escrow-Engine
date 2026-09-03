import { describe, expect, it } from 'vitest';
import { prisma } from '../src/index.js';

// Smoke tests that don't require a live database connection — they only
// check that the generated Prisma client's shape matches schema.prisma
// (catches typos in model names or a stale/missing `prisma generate`
// without needing Postgres available in every environment this runs in).
describe('prisma client shape', () => {
  const expectedModels = [
    'user',
    'oAuthAccount',
    'session',
    'magicLinkToken',
    'twoFactorRecoveryCode',
    'organization',
    'organizationMember',
    'organizationInvitation',
    'apiKey',
    'wallet',
    'customer',
    'product',
    'price',
    'payment',
    'transaction',
    'refund',
    'invoice',
    'invoiceItem',
    'subscription',
    'usageRecord',
    'escrow',
    'milestone',
    'splitPayment',
    'splitRecipient',
    'treasuryTransfer',
    'treasuryApproval',
    'webhookEndpoint',
    'webhookEvent',
    'auditLog',
    'notification',
    'dailyOrgMetrics',
    'organizationSettings',
  ] as const;

  it.each(expectedModels)('exposes a %s model delegate with CRUD methods', (model) => {
    const delegate = prisma[model] as unknown as Record<string, unknown>;
    expect(delegate).toBeDefined();
    expect(typeof delegate.findMany).toBe('function');
    expect(typeof delegate.create).toBe('function');
  });

  it('exposes exactly the models defined in schema.prisma (no drift)', () => {
    const actualModels = Object.keys(prisma).filter(
      (key) => !key.startsWith('_') && !key.startsWith('$'),
    );
    expect(new Set(actualModels)).toEqual(new Set(expectedModels));
  });
});
