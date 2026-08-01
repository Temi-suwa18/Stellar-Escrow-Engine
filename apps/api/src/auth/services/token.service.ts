import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../config/env.validation';
import { generateOpaqueToken } from '../../common/crypto.util';

export interface AccessTokenPayload {
  sub: string;
  jti: string;
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  signAccessToken(userId: string): { token: string; expiresIn: string } {
    const expiresIn = this.config.get('JWT_ACCESS_TTL', { infer: true });
    const token = this.jwt.sign(
      { sub: userId, jti: generateOpaqueToken(8) } satisfies AccessTokenPayload,
      { secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }), expiresIn },
    );
    return { token, expiresIn };
  }

  signRefreshToken(userId: string, sessionId: string): { token: string; expiresIn: string } {
    const expiresIn = this.config.get('JWT_REFRESH_TTL', { infer: true });
    const token = this.jwt.sign(
      { sub: userId, sid: sessionId } satisfies RefreshTokenPayload,
      { secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }), expiresIn },
    );
    return { token, expiresIn };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return this.jwt.verify<AccessTokenPayload>(token, {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return this.jwt.verify<RefreshTokenPayload>(token, {
      secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
    });
  }
}
