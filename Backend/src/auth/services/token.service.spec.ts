import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import type { ConfigService } from '@nestjs/config';

const ENV: Record<string, string> = {
  JWT_ACCESS_SECRET: 'access-secret-at-least-32-characters-long',
  JWT_REFRESH_SECRET: 'refresh-secret-at-least-32-characters-long',
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '30d',
};

function createConfigMock() {
  return {
    get: jest.fn((key: string) => ENV[key]),
  } as unknown as ConfigService & { get: jest.Mock };
}

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    // A real JwtService (backed by the real `jsonwebtoken` library) — this
    // is thin enough, and important enough to get right, that mocking it
    // would just be re-describing the implementation instead of verifying it.
    service = new TokenService(new JwtService(), createConfigMock());
  });

  describe('access tokens', () => {
    it('round-trips: a signed token verifies back to the same payload', () => {
      const { token } = service.signAccessToken('user_1');
      const payload = service.verifyAccessToken(token);
      expect(payload.sub).toBe('user_1');
      expect(payload.jti).toBeTruthy();
    });

    it('gives each token a unique jti, even for the same user', () => {
      const a = service.signAccessToken('user_1');
      const b = service.signAccessToken('user_1');
      const payloadA = service.verifyAccessToken(a.token);
      const payloadB = service.verifyAccessToken(b.token);
      expect(payloadA.jti).not.toBe(payloadB.jti);
    });

    it('rejects a token signed with the refresh secret', () => {
      const { token } = service.signRefreshToken('user_1', 'sess_1');
      expect(() => service.verifyAccessToken(token)).toThrow();
    });

    it('rejects a tampered token', () => {
      const { token } = service.signAccessToken('user_1');
      const tampered = token.slice(0, -4) + 'xxxx';
      expect(() => service.verifyAccessToken(tampered)).toThrow();
    });
  });

  describe('refresh tokens', () => {
    it('round-trips: a signed token verifies back to the same sub + sid', () => {
      const { token } = service.signRefreshToken('user_1', 'sess_1');
      const payload = service.verifyRefreshToken(token);
      expect(payload).toMatchObject({ sub: 'user_1', sid: 'sess_1' });
    });

    it('rejects a token signed with the access secret', () => {
      const { token } = service.signAccessToken('user_1');
      expect(() => service.verifyRefreshToken(token)).toThrow();
    });

    it('carries the session id through so rotation can look up the right session', () => {
      const { token } = service.signRefreshToken('user_1', 'sess_specific_id');
      const payload = service.verifyRefreshToken(token);
      expect(payload.sid).toBe('sess_specific_id');
    });
  });

  it('rejects an already-expired token', () => {
    const shortLivedConfig = createConfigMock();
    shortLivedConfig.get.mockImplementation((key: string) =>
      key === 'JWT_ACCESS_TTL' ? '0s' : ENV[key],
    );
    const shortLivedService = new TokenService(new JwtService(), shortLivedConfig);

    const { token } = shortLivedService.signAccessToken('user_1');

    // A 0s expiry means it's already expired the instant it's checked.
    expect(() => shortLivedService.verifyAccessToken(token)).toThrow(/expired/i);
  });
});
