import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import slugify from '../common/slugify';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { generateOpaqueToken, hashToken } from '../common/crypto.util';
import type { EnvConfig } from '../config/env.validation';
import { PasswordService } from './services/password.service';
import { SessionService, type CreatedSession, type RequestMeta } from './services/session.service';
import { TwoFactorService } from './services/two-factor.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { OAuthProfile } from './types/oauth-profile';

export interface LoginResult {
  requiresTwoFactor: false;
  session: CreatedSession;
}

export interface TwoFactorRequiredResult {
  requiresTwoFactor: true;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly sessions: SessionService,
    private readonly twoFactor: TwoFactorService,
    private readonly email: EmailService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async register(dto: RegisterDto, meta: RequestMeta): Promise<CreatedSession> {
    const existing = await this.prisma.client.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.password.hash(dto.password);
    const slug = await this.uniqueOrganizationSlug(dto.organizationName);

    const user = await this.prisma.client.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        organizationMembers: {
          create: {
            role: 'OWNER',
            organization: {
              create: {
                name: dto.organizationName,
                slug,
                settings: { create: {} },
              },
            },
          },
        },
      },
    });

    return this.sessions.createSession(user.id, meta);
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<LoginResult | TwoFactorRequiredResult> {
    const user = await this.prisma.client.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordHash || !(await this.password.verify(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.twoFactorEnabled) {
      if (!dto.twoFactorToken) {
        return { requiresTwoFactor: true };
      }
      const validTotp = user.twoFactorSecret
        ? this.twoFactor.verifyToken(user.twoFactorSecret, dto.twoFactorToken)
        : false;
      const validRecovery =
        !validTotp && (await this.twoFactor.consumeRecoveryCode(user.id, dto.twoFactorToken));
      if (!validTotp && !validRecovery) {
        throw new UnauthorizedException('Invalid two-factor code');
      }
    }

    const session = await this.sessions.createSession(user.id, meta);
    return { requiresTwoFactor: false, session };
  }

  async loginWithOAuth(profile: OAuthProfile, meta: RequestMeta): Promise<CreatedSession> {
    const existingAccount = await this.prisma.client.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: profile.provider.toUpperCase() as 'GOOGLE' | 'GITHUB',
          providerAccountId: profile.providerAccountId,
        },
      },
    });

    if (existingAccount) {
      return this.sessions.createSession(existingAccount.userId, meta);
    }

    // First sign-in with this provider: link to an existing account by
    // email if one exists, otherwise create a brand new user + org.
    const existingUser = await this.prisma.client.user.findUnique({
      where: { email: profile.email },
    });

    const providerEnum = profile.provider.toUpperCase() as 'GOOGLE' | 'GITHUB';
    const userId = existingUser
      ? existingUser.id
      : await this.createUserFromOAuth(profile);

    await this.prisma.client.oAuthAccount.create({
      data: {
        userId,
        provider: providerEnum,
        providerAccountId: profile.providerAccountId,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
      },
    });

    return this.sessions.createSession(userId, meta);
  }

  private async createUserFromOAuth(profile: OAuthProfile): Promise<string> {
    const organizationName = profile.name ? `${profile.name}'s Organization` : 'My Organization';
    const slug = await this.uniqueOrganizationSlug(organizationName);
    const user = await this.prisma.client.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        emailVerifiedAt: new Date(),
        organizationMembers: {
          create: {
            role: 'OWNER',
            organization: { create: { name: organizationName, slug, settings: { create: {} } } },
          },
        },
      },
    });
    return user.id;
  }

  async refresh(refreshToken: string, meta: RequestMeta): Promise<CreatedSession> {
    return this.sessions.rotateSession(refreshToken, meta);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessions.revokeByRefreshToken(refreshToken);
  }

  async requestMagicLink(email: string): Promise<void> {
    const user = await this.prisma.client.user.findUnique({ where: { email } });
    // Always behave the same whether or not the account exists, so this
    // endpoint can't be used to enumerate registered emails.
    if (!user) return;

    const rawToken = generateOpaqueToken();
    const ttlMinutes = this.config.get('MAGIC_LINK_TTL_MINUTES', { infer: true });
    await this.prisma.client.magicLinkToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
      },
    });

    const appUrl = this.config.get('APP_URL', { infer: true });
    await this.email.sendMagicLink(email, `${appUrl}/login/magic?token=${rawToken}`);
  }

  async verifyMagicLink(rawToken: string, meta: RequestMeta): Promise<CreatedSession> {
    const record = await this.prisma.client.magicLinkToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('This sign-in link is invalid or has expired');
    }

    await this.prisma.client.magicLinkToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    return this.sessions.createSession(record.userId, meta);
  }

  private async uniqueOrganizationSlug(name: string): Promise<string> {
    const base = slugify(name);
    let candidate = base;
    let suffix = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await this.prisma.client.organization.findUnique({
        where: { slug: candidate },
      });
      if (!existing) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }
}
