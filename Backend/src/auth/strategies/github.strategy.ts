import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
// passport-github2 ships its own types but with a slightly different shape than @types/passport-github2 expects at the callback level.
import { Strategy } from 'passport-github2';
import type { EnvConfig } from '../../config/env.validation';
import type { OAuthProfile } from '../types/oauth-profile';

interface GithubProfile {
  id: string;
  displayName?: string;
  username?: string;
  photos?: Array<{ value: string }>;
  emails?: Array<{ value: string }>;
  _json?: { email?: string };
}

type GithubDoneCallback = (error: unknown, user?: OAuthProfile | false) => void;

/** Same config-gated pattern as GoogleStrategy — see that file's comment. */
@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService<EnvConfig, true>) {
    super({
      clientID: config.get('GITHUB_OAUTH_CLIENT_ID', { infer: true }) || 'not-configured',
      clientSecret: config.get('GITHUB_OAUTH_CLIENT_SECRET', { infer: true }) || 'not-configured',
      callbackURL:
        config.get('GITHUB_OAUTH_CALLBACK_URL', { infer: true }) ||
        'http://localhost:4000/api/v1/auth/github/callback',
      scope: ['user:email'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: GithubProfile,
    done: GithubDoneCallback,
  ): void {
    const email = profile.emails?.[0]?.value ?? profile._json?.email;
    if (!email) {
      done(new Error('GitHub account has no public/verified email'));
      return;
    }
    done(null, {
      provider: 'github',
      providerAccountId: profile.id,
      email,
      name: profile.displayName ?? profile.username,
      avatarUrl: profile.photos?.[0]?.value,
      accessToken,
      refreshToken,
    });
  }
}
