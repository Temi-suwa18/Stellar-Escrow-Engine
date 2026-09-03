import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { hashToken, generateOpaqueToken } from '../../common/crypto.util';
import { TokenService } from './token.service';
import type { EnvConfig } from '../../config/env.validation';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface CreatedSession {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  /**
   * Creates a new session row, then signs an access+refresh token pair bound
   * to it. The session row is created with a random placeholder hash first
   * (so it has an id to embed in the refresh JWT's `sid` claim), then
   * updated in place with the real token hash once signed.
   */
  async createSession(userId: string, meta: RequestMeta = {}): Promise<CreatedSession> {
    const refreshTokenExpiresAt = new Date(
      Date.now() + parseTtlToMs(this.config.get('JWT_REFRESH_TTL', { infer: true })),
    );

    const session = await this.prisma.client.session.create({
      data: {
        userId,
        tokenHash: hashToken(generateOpaqueToken()),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    const refresh = this.tokens.signRefreshToken(userId, session.id);
    await this.prisma.client.session.update({
      where: { id: session.id },
      data: { tokenHash: hashToken(refresh.token) },
    });

    const access = this.tokens.signAccessToken(userId);

    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      refreshTokenExpiresAt,
    };
  }

  /**
   * Verifies a refresh token's signature, confirms the backing session is
   * still valid (not revoked, not expired, hash matches — catching reuse of
   * a token from a session that was already rotated), then rotates it:
   * revokes the old session and issues a brand new access+refresh pair.
   */
  async rotateSession(refreshToken: string, meta: RequestMeta = {}): Promise<CreatedSession> {
    const payload = this.tokens.verifyRefreshToken(refreshToken);

    const session = await this.prisma.client.session.findUnique({
      where: { id: payload.sid },
    });

    const isValid =
      session &&
      session.userId === payload.sub &&
      session.revokedAt === null &&
      session.expiresAt > new Date() &&
      session.tokenHash === hashToken(refreshToken);

    if (!isValid) {
      throw new InvalidSessionError();
    }

    await this.prisma.client.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.createSession(payload.sub, meta);
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.client.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Used by logout, which only has the refresh token, not a bare session id. */
  async revokeByRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = this.tokens.verifyRefreshToken(refreshToken);
      await this.revokeSession(payload.sid);
    } catch {
      // Already invalid/expired — nothing to revoke.
    }
  }

  async revokeAllSessionsForUser(userId: string): Promise<void> {
    await this.prisma.client.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export class InvalidSessionError extends Error {
  constructor() {
    super('Refresh token is invalid, expired, or has already been used');
  }
}

/** Parses jsonwebtoken-style TTL strings ("15m", "30d", "3600") to milliseconds. */
function parseTtlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])?$/.exec(ttl.trim());
  if (!match) return 30 * MS_PER_DAY;
  const value = Number(match[1]);
  const unit = match[2] ?? 's';
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: MS_PER_DAY }[unit] ?? 1000;
  return value * unitMs;
}
