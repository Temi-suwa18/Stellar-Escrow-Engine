/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment --
   same rationale as escrows.service.spec.ts: jest.fn() mock references trip the unbound-method
   heuristic, and destructuring typed tuples out of jest.Mock's loosely-typed `.mock.calls` trips
   no-unsafe-assignment even though the tuple type is explicit at each call site. */
import { authenticator } from 'otplib';
import { TwoFactorService } from './two-factor.service';
import type { PrismaService } from '../../database/prisma.service';

function createPrismaMock() {
  return {
    client: {
      $transaction: jest.fn(async (ops: unknown[]) => Promise.all(ops)),
      user: { update: jest.fn() },
      twoFactorRecoveryCode: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    },
  } as unknown as PrismaService & {
    client: {
      $transaction: jest.Mock;
      user: { update: jest.Mock };
      twoFactorRecoveryCode: {
        deleteMany: jest.Mock;
        createMany: jest.Mock;
        findFirst: jest.Mock;
        update: jest.Mock;
      };
    };
  };
}

describe('TwoFactorService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: TwoFactorService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new TwoFactorService(prisma);
  });

  describe('generateSetup', () => {
    it('generates a secret and a scannable QR code data URL', async () => {
      const setup = await service.generateSetup('ada@example.com');
      expect(setup.secret).toBeTruthy();
      expect(setup.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('verifyToken', () => {
    it('accepts a real, currently-valid TOTP code for the secret', async () => {
      const { secret } = await service.generateSetup('ada@example.com');
      const validToken = authenticator.generate(secret);

      expect(service.verifyToken(secret, validToken)).toBe(true);
    });

    it('rejects a wrong code', async () => {
      const { secret } = await service.generateSetup('ada@example.com');
      expect(service.verifyToken(secret, '000000')).toBe(false);
    });

    it('rejects instead of throwing for a malformed secret', () => {
      expect(service.verifyToken('not-a-valid-base32-secret!!', '123456')).toBe(false);
    });
  });

  describe('enable', () => {
    it('persists the secret, flips twoFactorEnabled, and returns 10 recovery codes', async () => {
      const codes = await service.enable('user_1', 'SECRET123');

      expect(codes).toHaveLength(10);
      // Each code must be unique and match the XXXXX-XXXXX display format.
      expect(new Set(codes).size).toBe(10);
      for (const code of codes) expect(code).toMatch(/^[0-9A-F]{5}-[0-9A-F]{5}$/);

      expect(prisma.client.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user_1' },
          data: { twoFactorEnabled: true, twoFactorSecret: 'SECRET123' },
        }),
      );
      expect(prisma.client.twoFactorRecoveryCode.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.arrayContaining([expect.objectContaining({ userId: 'user_1' })]) }),
      );
      // Only hashes should ever be persisted, never the plaintext recovery codes.
      const createManyData = (
        prisma.client.twoFactorRecoveryCode.createMany.mock.calls[0] as [
          { data: Array<{ codeHash: string }> },
        ]
      )[0].data;
      for (const { codeHash } of createManyData) {
        expect(codes).not.toContain(codeHash);
      }
    });
  });

  describe('disable', () => {
    it('clears the secret and deletes recovery codes in one transaction', async () => {
      await service.disable('user_1');

      expect(prisma.client.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.client.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user_1' },
          data: { twoFactorEnabled: false, twoFactorSecret: null },
        }),
      );
      expect(prisma.client.twoFactorRecoveryCode.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user_1' },
      });
    });
  });

  describe('consumeRecoveryCode', () => {
    it('returns false and consumes nothing for an unknown code', async () => {
      prisma.client.twoFactorRecoveryCode.findFirst.mockResolvedValue(null);

      const result = await service.consumeRecoveryCode('user_1', 'AAAAA-BBBBB');

      expect(result).toBe(false);
      expect(prisma.client.twoFactorRecoveryCode.update).not.toHaveBeenCalled();
    });

    it('normalizes case and whitespace before matching', async () => {
      prisma.client.twoFactorRecoveryCode.findFirst.mockResolvedValue({ id: 'rc_1' });

      await service.consumeRecoveryCode('user_1', '  aaaaa-bbbbb  ');

      expect(prisma.client.twoFactorRecoveryCode.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user_1', usedAt: null }),
        }),
      );
    });

    it('marks a matched code used and returns true', async () => {
      prisma.client.twoFactorRecoveryCode.findFirst.mockResolvedValue({ id: 'rc_1' });

      const result = await service.consumeRecoveryCode('user_1', 'AAAAA-BBBBB');

      expect(result).toBe(true);
      expect(prisma.client.twoFactorRecoveryCode.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rc_1' }, data: expect.objectContaining({ usedAt: expect.any(Date) }) }),
      );
    });
  });
});
