/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment --
   same rationale as escrows.service.spec.ts. */
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { PrismaService } from '../database/prisma.service';
import type { PasswordService } from './services/password.service';
import type { SessionService } from './services/session.service';
import type { TwoFactorService } from './services/two-factor.service';
import type { EmailService } from '../email/email.service';
import type { ConfigService } from '@nestjs/config';

function createPrismaMock() {
  return {
    client: {
      user: { findUnique: jest.fn(), create: jest.fn() },
      organization: { findUnique: jest.fn() },
      oAuthAccount: { findUnique: jest.fn(), create: jest.fn() },
      magicLinkToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    },
  } as unknown as PrismaService & {
    client: {
      user: { findUnique: jest.Mock; create: jest.Mock };
      organization: { findUnique: jest.Mock };
      oAuthAccount: { findUnique: jest.Mock; create: jest.Mock };
      magicLinkToken: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    };
  };
}

function createPasswordMock() {
  return { hash: jest.fn(), verify: jest.fn() } as unknown as PasswordService & {
    hash: jest.Mock;
    verify: jest.Mock;
  };
}

function createSessionsMock() {
  return {
    createSession: jest.fn(),
    rotateSession: jest.fn(),
    revokeByRefreshToken: jest.fn(),
  } as unknown as SessionService & {
    createSession: jest.Mock;
    rotateSession: jest.Mock;
    revokeByRefreshToken: jest.Mock;
  };
}

function createTwoFactorMock() {
  return {
    verifyToken: jest.fn(),
    consumeRecoveryCode: jest.fn(),
  } as unknown as TwoFactorService & { verifyToken: jest.Mock; consumeRecoveryCode: jest.Mock };
}

function createEmailMock() {
  return {
    sendMagicLink: jest.fn(),
    sendOrganizationInvitation: jest.fn(),
  } as unknown as EmailService & { sendMagicLink: jest.Mock };
}

function createConfigMock() {
  return {
    get: jest.fn((key: string) => {
      if (key === 'MAGIC_LINK_TTL_MINUTES') return 15;
      if (key === 'APP_URL') return 'http://localhost:3000';
      return undefined;
    }),
  } as unknown as ConfigService & { get: jest.Mock };
}

const META = { ipAddress: '127.0.0.1', userAgent: 'jest' };

describe('AuthService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let password: ReturnType<typeof createPasswordMock>;
  let sessions: ReturnType<typeof createSessionsMock>;
  let twoFactor: ReturnType<typeof createTwoFactorMock>;
  let email: ReturnType<typeof createEmailMock>;
  let config: ReturnType<typeof createConfigMock>;
  let service: AuthService;

  beforeEach(() => {
    prisma = createPrismaMock();
    password = createPasswordMock();
    sessions = createSessionsMock();
    twoFactor = createTwoFactorMock();
    email = createEmailMock();
    config = createConfigMock();
    service = new AuthService(prisma, password, sessions, twoFactor, email, config);
  });

  describe('register', () => {
    it('rejects an email that is already registered', async () => {
      prisma.client.user.findUnique.mockResolvedValue({ id: 'user_1' });

      await expect(
        service.register(
          { email: 'a@b.com', password: 'pw', name: 'A', organizationName: 'Acme' },
          META,
        ),
      ).rejects.toThrow(ConflictException);
      expect(prisma.client.user.create).not.toHaveBeenCalled();
    });

    it('hashes the password and creates a session for a new user', async () => {
      prisma.client.user.findUnique.mockResolvedValue(null);
      prisma.client.organization.findUnique.mockResolvedValue(null);
      password.hash.mockResolvedValue('hashed');
      prisma.client.user.create.mockResolvedValue({ id: 'user_1' });
      sessions.createSession.mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });

      const result = await service.register(
        { email: 'new@b.com', password: 'plaintext', name: 'New', organizationName: 'Acme' },
        META,
      );

      expect(password.hash).toHaveBeenCalledWith('plaintext');
      expect(prisma.client.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ email: 'new@b.com', passwordHash: 'hashed' }) }),
      );
      expect(sessions.createSession).toHaveBeenCalledWith('user_1', META);
      expect(result).toEqual({ accessToken: 'at', refreshToken: 'rt' });
    });
  });

  describe('login', () => {
    it('rejects an unknown email without revealing whether the account exists', async () => {
      prisma.client.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'nope@b.com', password: 'x' }, META)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects a wrong password', async () => {
      prisma.client.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash: 'hashed' });
      password.verify.mockResolvedValue(false);

      await expect(service.login({ email: 'a@b.com', password: 'wrong' }, META)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('logs in directly when 2FA is not enabled', async () => {
      prisma.client.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordHash: 'hashed',
        twoFactorEnabled: false,
      });
      password.verify.mockResolvedValue(true);
      sessions.createSession.mockResolvedValue({ accessToken: 'at' });

      const result = await service.login({ email: 'a@b.com', password: 'right' }, META);

      expect(result).toEqual({ requiresTwoFactor: false, session: { accessToken: 'at' } });
    });

    it('asks for a 2FA code instead of logging in when none was provided', async () => {
      prisma.client.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordHash: 'hashed',
        twoFactorEnabled: true,
        twoFactorSecret: 'secret',
      });
      password.verify.mockResolvedValue(true);

      const result = await service.login({ email: 'a@b.com', password: 'right' }, META);

      expect(result).toEqual({ requiresTwoFactor: true });
      expect(sessions.createSession).not.toHaveBeenCalled();
    });

    it('rejects an invalid 2FA token and invalid recovery code', async () => {
      prisma.client.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordHash: 'hashed',
        twoFactorEnabled: true,
        twoFactorSecret: 'secret',
      });
      password.verify.mockResolvedValue(true);
      twoFactor.verifyToken.mockReturnValue(false);
      twoFactor.consumeRecoveryCode.mockResolvedValue(false);

      await expect(
        service.login({ email: 'a@b.com', password: 'right', twoFactorToken: '000000' }, META),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('logs in with a valid TOTP code', async () => {
      prisma.client.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordHash: 'hashed',
        twoFactorEnabled: true,
        twoFactorSecret: 'secret',
      });
      password.verify.mockResolvedValue(true);
      twoFactor.verifyToken.mockReturnValue(true);
      sessions.createSession.mockResolvedValue({ accessToken: 'at' });

      const result = await service.login(
        { email: 'a@b.com', password: 'right', twoFactorToken: '123456' },
        META,
      );

      expect(result).toEqual({ requiresTwoFactor: false, session: { accessToken: 'at' } });
      expect(twoFactor.consumeRecoveryCode).not.toHaveBeenCalled();
    });

    it('falls back to a recovery code when the TOTP is invalid', async () => {
      prisma.client.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordHash: 'hashed',
        twoFactorEnabled: true,
        twoFactorSecret: 'secret',
      });
      password.verify.mockResolvedValue(true);
      twoFactor.verifyToken.mockReturnValue(false);
      twoFactor.consumeRecoveryCode.mockResolvedValue(true);
      sessions.createSession.mockResolvedValue({ accessToken: 'at' });

      const result = await service.login(
        { email: 'a@b.com', password: 'right', twoFactorToken: 'RECOVERY-CODE' },
        META,
      );

      expect(result).toEqual({ requiresTwoFactor: false, session: { accessToken: 'at' } });
    });
  });

  describe('loginWithOAuth', () => {
    it('signs in directly when the OAuth account is already linked', async () => {
      prisma.client.oAuthAccount.findUnique.mockResolvedValue({ userId: 'u1' });
      sessions.createSession.mockResolvedValue({ accessToken: 'at' });

      await service.loginWithOAuth(
        { provider: 'google', providerAccountId: 'g1', email: 'a@b.com', name: 'A', accessToken: 'tok' },
        META,
      );

      expect(sessions.createSession).toHaveBeenCalledWith('u1', META);
      expect(prisma.client.user.create).not.toHaveBeenCalled();
    });

    it('links to an existing user found by email on first OAuth sign-in', async () => {
      prisma.client.oAuthAccount.findUnique.mockResolvedValue(null);
      prisma.client.user.findUnique.mockResolvedValue({ id: 'existing_user' });
      prisma.client.oAuthAccount.create.mockResolvedValue({});
      sessions.createSession.mockResolvedValue({ accessToken: 'at' });

      await service.loginWithOAuth(
        { provider: 'github', providerAccountId: 'gh1', email: 'a@b.com', name: 'A', accessToken: 'tok' },
        META,
      );

      expect(prisma.client.oAuthAccount.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'existing_user' }) }),
      );
      expect(prisma.client.user.create).not.toHaveBeenCalled();
    });

    it('creates a brand new user when no account matches by provider or email', async () => {
      prisma.client.oAuthAccount.findUnique.mockResolvedValue(null);
      prisma.client.user.findUnique.mockResolvedValue(null);
      prisma.client.organization.findUnique.mockResolvedValue(null);
      prisma.client.user.create.mockResolvedValue({ id: 'brand_new' });
      prisma.client.oAuthAccount.create.mockResolvedValue({});
      sessions.createSession.mockResolvedValue({ accessToken: 'at' });

      await service.loginWithOAuth(
        { provider: 'google', providerAccountId: 'g2', email: 'new@b.com', name: 'New Person', accessToken: 'tok' },
        META,
      );

      expect(prisma.client.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'new@b.com', emailVerifiedAt: expect.any(Date) }),
        }),
      );
      expect(sessions.createSession).toHaveBeenCalledWith('brand_new', META);
    });
  });

  describe('requestMagicLink', () => {
    it('does nothing for an unknown email — no email sent, no error either', async () => {
      prisma.client.user.findUnique.mockResolvedValue(null);

      await service.requestMagicLink('nobody@b.com');

      expect(email.sendMagicLink).not.toHaveBeenCalled();
      expect(prisma.client.magicLinkToken.create).not.toHaveBeenCalled();
    });

    it('creates a hashed token and emails a link containing the raw token', async () => {
      prisma.client.user.findUnique.mockResolvedValue({ id: 'u1' });

      await service.requestMagicLink('a@b.com');

      expect(prisma.client.magicLinkToken.create).toHaveBeenCalledTimes(1);
      const storedHash = (
        prisma.client.magicLinkToken.create.mock.calls[0] as [{ data: { tokenHash: string } }]
      )[0].data.tokenHash;
      expect(email.sendMagicLink).toHaveBeenCalledWith(
        'a@b.com',
        expect.stringContaining('/login/magic?token='),
      );
      const [, link] = (email.sendMagicLink.mock.calls[0] as [string, string]);
      const sentToken = new URL(link).searchParams.get('token');
      expect(sentToken).toBeTruthy();
      // The link must carry the raw token, never the hash stored in the DB.
      expect(sentToken).not.toBe(storedHash);
    });
  });

  describe('verifyMagicLink', () => {
    it('rejects an unknown token', async () => {
      prisma.client.magicLinkToken.findUnique.mockResolvedValue(null);

      await expect(service.verifyMagicLink('bad', META)).rejects.toThrow(BadRequestException);
    });

    it('rejects an already-used token', async () => {
      prisma.client.magicLinkToken.findUnique.mockResolvedValue({
        id: 't1',
        userId: 'u1',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 1_000_000),
      });

      await expect(service.verifyMagicLink('used', META)).rejects.toThrow(BadRequestException);
    });

    it('rejects an expired token', async () => {
      prisma.client.magicLinkToken.findUnique.mockResolvedValue({
        id: 't1',
        userId: 'u1',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1_000),
      });

      await expect(service.verifyMagicLink('expired', META)).rejects.toThrow(BadRequestException);
    });

    it('marks a valid token used and creates a session', async () => {
      prisma.client.magicLinkToken.findUnique.mockResolvedValue({
        id: 't1',
        userId: 'u1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 1_000_000),
      });
      sessions.createSession.mockResolvedValue({ accessToken: 'at' });

      const result = await service.verifyMagicLink('good', META);

      expect(prisma.client.magicLinkToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 't1' }, data: expect.objectContaining({ usedAt: expect.any(Date) }) }),
      );
      expect(sessions.createSession).toHaveBeenCalledWith('u1', META);
      expect(result).toEqual({ accessToken: 'at' });
    });
  });
});
