/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment --
   same rationale as escrows.service.spec.ts. */
import { InvalidSessionError, SessionService } from './session.service';
import type { PrismaService } from '../../database/prisma.service';
import type { TokenService } from './token.service';
import type { ConfigService } from '@nestjs/config';

function createPrismaMock() {
  return {
    client: {
      session: {
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn(),
      },
    },
  } as unknown as PrismaService & {
    client: {
      session: {
        create: jest.Mock;
        update: jest.Mock;
        updateMany: jest.Mock;
        findUnique: jest.Mock;
      };
    };
  };
}

function createTokensMock() {
  return {
    signAccessToken: jest.fn().mockReturnValue({ token: 'access_tok', expiresIn: '15m' }),
    signRefreshToken: jest.fn().mockReturnValue({ token: 'refresh_tok', expiresIn: '30d' }),
    verifyRefreshToken: jest.fn(),
  } as unknown as TokenService & {
    signAccessToken: jest.Mock;
    signRefreshToken: jest.Mock;
    verifyRefreshToken: jest.Mock;
  };
}

function createConfigMock(refreshTtl = '30d') {
  return {
    get: jest.fn().mockReturnValue(refreshTtl),
  } as unknown as ConfigService & { get: jest.Mock };
}

const META = { ipAddress: '127.0.0.1', userAgent: 'jest' };

describe('SessionService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let tokens: ReturnType<typeof createTokensMock>;
  let config: ReturnType<typeof createConfigMock>;
  let service: SessionService;

  beforeEach(() => {
    prisma = createPrismaMock();
    tokens = createTokensMock();
    config = createConfigMock();
    service = new SessionService(prisma, tokens, config);
  });

  describe('createSession', () => {
    it('creates a session row, signs both tokens, and stores a hash of the real refresh token', async () => {
      prisma.client.session.create.mockResolvedValue({ id: 'sess_1' });

      const result = await service.createSession('user_1', META);

      expect(prisma.client.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user_1',
            userAgent: META.userAgent,
            ipAddress: META.ipAddress,
          }),
        }),
      );
      expect(tokens.signRefreshToken).toHaveBeenCalledWith('user_1', 'sess_1');
      // The session row is updated with a hash of the *real* signed refresh
      // token, not the throwaway placeholder it was created with.
      expect(prisma.client.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sess_1' },
          data: expect.objectContaining({ tokenHash: expect.any(String) }),
        }),
      );
      const placeholderHash = (prisma.client.session.create.mock.calls[0] as [{ data: { tokenHash: string } }])[0]
        .data.tokenHash;
      const finalHash = (prisma.client.session.update.mock.calls[0] as [{ data: { tokenHash: string } }])[0].data
        .tokenHash;
      expect(finalHash).not.toBe(placeholderHash);

      expect(result).toEqual({
        accessToken: 'access_tok',
        refreshToken: 'refresh_tok',
        refreshTokenExpiresAt: expect.any(Date),
      });
    });

    it('sets refreshTokenExpiresAt according to JWT_REFRESH_TTL', async () => {
      config.get.mockReturnValue('7d');
      prisma.client.session.create.mockResolvedValue({ id: 'sess_1' });

      const before = Date.now();
      const result = await service.createSession('user_1', META);
      const expectedMs = 7 * 24 * 60 * 60 * 1000;

      expect(result.refreshTokenExpiresAt.getTime()).toBeGreaterThanOrEqual(before + expectedMs - 1000);
      expect(result.refreshTokenExpiresAt.getTime()).toBeLessThanOrEqual(before + expectedMs + 5000);
    });
  });

  describe('rotateSession', () => {
    const validPayload = { sub: 'user_1', sid: 'sess_1' };

    it('rejects when the session record does not exist', async () => {
      tokens.verifyRefreshToken.mockReturnValue(validPayload);
      prisma.client.session.findUnique.mockResolvedValue(null);

      await expect(service.rotateSession('rt')).rejects.toThrow(InvalidSessionError);
    });

    it('rejects a revoked session (reuse of an already-rotated token)', async () => {
      tokens.verifyRefreshToken.mockReturnValue(validPayload);
      prisma.client.session.findUnique.mockResolvedValue({
        id: 'sess_1',
        userId: 'user_1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 1_000_000),
        tokenHash: 'irrelevant',
      });

      await expect(service.rotateSession('rt')).rejects.toThrow(InvalidSessionError);
    });

    it('rejects an expired session', async () => {
      tokens.verifyRefreshToken.mockReturnValue(validPayload);
      prisma.client.session.findUnique.mockResolvedValue({
        id: 'sess_1',
        userId: 'user_1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1_000),
        tokenHash: 'irrelevant',
      });

      await expect(service.rotateSession('rt')).rejects.toThrow(InvalidSessionError);
    });

    it("rejects when the token hash doesn't match the stored session (tampered/mismatched token)", async () => {
      tokens.verifyRefreshToken.mockReturnValue(validPayload);
      prisma.client.session.findUnique.mockResolvedValue({
        id: 'sess_1',
        userId: 'user_1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 1_000_000),
        tokenHash: 'some-other-hash-entirely',
      });

      await expect(service.rotateSession('rt')).rejects.toThrow(InvalidSessionError);
    });

    it('revokes the old session and issues a fresh pair for a genuinely valid token', async () => {
      const { hashToken } = jest.requireActual<typeof import('../../common/crypto.util')>(
        '../../common/crypto.util',
      );
      tokens.verifyRefreshToken.mockReturnValue(validPayload);
      prisma.client.session.findUnique.mockResolvedValue({
        id: 'sess_1',
        userId: 'user_1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 1_000_000),
        tokenHash: hashToken('rt'),
      });
      prisma.client.session.create.mockResolvedValue({ id: 'sess_2' });

      const result = await service.rotateSession('rt', META);

      expect(prisma.client.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sess_1' },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
      // A brand new session was created for the rotation, not a reuse of the old one.
      expect(prisma.client.session.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'user_1' }) }),
      );
      expect(result.accessToken).toBe('access_tok');
    });
  });

  describe('revokeByRefreshToken', () => {
    it('revokes the matching session for a valid token', async () => {
      tokens.verifyRefreshToken.mockReturnValue({ sub: 'user_1', sid: 'sess_1' });

      await service.revokeByRefreshToken('rt');

      expect(prisma.client.session.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sess_1', revokedAt: null },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });

    it('silently does nothing for an already-invalid token (logout should never error)', async () => {
      tokens.verifyRefreshToken.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.revokeByRefreshToken('expired-token')).resolves.toBeUndefined();
      expect(prisma.client.session.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('revokeAllSessionsForUser', () => {
    it('revokes every non-revoked session for the user', async () => {
      await service.revokeAllSessionsForUser('user_1');

      expect(prisma.client.session.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user_1', revokedAt: null },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });
  });
});
