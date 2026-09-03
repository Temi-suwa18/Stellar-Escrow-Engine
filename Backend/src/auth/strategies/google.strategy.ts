import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';
import type { EnvConfig } from '../../config/env.validation';
import type { OAuthProfile } from '../types/oauth-profile';

/**
 * Constructed unconditionally so Nest's DI graph is stable regardless of
 * deployment config, using placeholder credentials when unset. Routes that
 * would trigger this strategy check `GOOGLE_OAUTH_CLIENT_ID` up front (see
 * AuthController) and return a clear "not configured" error rather than
 * ever letting Passport attempt a real handshake with placeholder creds.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService<EnvConfig, true>) {
    super({
      clientID: config.get('GOOGLE_OAUTH_CLIENT_ID', { infer: true }) || 'not-configured',
      clientSecret: config.get('GOOGLE_OAUTH_CLIENT_SECRET', { infer: true }) || 'not-configured',
      callbackURL:
        config.get('GOOGLE_OAUTH_CALLBACK_URL', { infer: true }) ||
        'http://localhost:4000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('Google account has no email'), undefined);
      return;
    }
    const oauthProfile: OAuthProfile = {
      provider: 'google',
      providerAccountId: profile.id,
      email,
      name: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
      accessToken,
      refreshToken,
    };
    done(null, oauthProfile);
  }
}
