/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment --
   same rationale as escrows.service.spec.ts: jest.fn() mock references and the loosely-typed
   mocked PrismaService shape trip these rules without actually being unsafe. */
import { NotFoundException } from '@nestjs/common';
import { ApiKeyMode } from '@stellar-escrow/database';
import { ApiKeysService } from './api-keys.service';
import type { PrismaService } from '../database/prisma.service';

const ORG_ID = 'org_1';
const USER_ID = 'user_1';

function createPrismaMock() {
  return {
    client: {
      apiKey: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    },
  } as unknown as PrismaService & {
    client: {
      apiKey: {
        findMany: jest.Mock;
        findFirst: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
      };
    };
  };
}

describe('ApiKeysService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: ApiKeysService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new ApiKeysService(prisma);
  });

  describe('list', () => {
    it('scopes the query to the organization and never selects hashedKey', async () => {
      prisma.client.apiKey.findMany.mockResolvedValue([]);

      await service.list(ORG_ID);

      expect(prisma.client.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: ORG_ID },
          orderBy: { createdAt: 'desc' },
        }),
      );
      const select = (prisma.client.apiKey.findMany.mock.calls[0] as [{ select: Record<string, boolean> }])[0]
        .select;
      expect(select.hashedKey).toBeUndefined();
      expect(select.keyPrefix).toBe(true);
    });
  });

  describe('create', () => {
    it('generates a prefixed raw key, hashes it for storage, and returns the raw key exactly once', async () => {
      prisma.client.apiKey.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: 'key_1', ...data }),
      );

      const result = await service.create(ORG_ID, USER_ID, 'Backend server key', ApiKeyMode.TEST);

      expect(result.rawKey).toMatch(/^sk_test_/);
      // The stored record must never contain the raw key material — only a hash + a
      // short prefix used for display ("sk_test_ab12...").
      expect(prisma.client.apiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: ORG_ID,
            createdByUserId: USER_ID,
            name: 'Backend server key',
            mode: ApiKeyMode.TEST,
            keyPrefix: result.rawKey.slice(0, 12),
          }),
        }),
      );
      const storedData = (prisma.client.apiKey.create.mock.calls[0] as [{ data: { hashedKey: string } }])[0]
        .data;
      expect(storedData.hashedKey).not.toBe(result.rawKey);
      expect(storedData.hashedKey).toHaveLength(64); // sha256 hex digest
    });

    it('generates a live-prefixed key for LIVE mode', async () => {
      prisma.client.apiKey.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: 'key_2', ...data }),
      );

      const result = await service.create(ORG_ID, USER_ID, 'Prod key', ApiKeyMode.LIVE);

      expect(result.rawKey).toMatch(/^sk_live_/);
    });

    it('generates a different raw key on every call', async () => {
      prisma.client.apiKey.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: 'key', ...data }),
      );

      const first = await service.create(ORG_ID, USER_ID, 'Key A', ApiKeyMode.TEST);
      const second = await service.create(ORG_ID, USER_ID, 'Key B', ApiKeyMode.TEST);

      expect(first.rawKey).not.toBe(second.rawKey);
    });
  });

  describe('revoke', () => {
    it('sets revokedAt for a key that belongs to the organization', async () => {
      prisma.client.apiKey.findFirst.mockResolvedValue({ id: 'key_1', organizationId: ORG_ID });

      await service.revoke(ORG_ID, 'key_1');

      expect(prisma.client.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'key_1' },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });

    it('throws NotFoundException for a key outside the organization', async () => {
      prisma.client.apiKey.findFirst.mockResolvedValue(null);

      await expect(service.revoke(ORG_ID, 'key_1')).rejects.toThrow(NotFoundException);
      expect(prisma.client.apiKey.update).not.toHaveBeenCalled();
    });
  });
});
