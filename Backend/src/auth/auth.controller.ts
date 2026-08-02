import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { EnvConfig } from '../config/env.validation';
import { AuthService } from './auth.service';
import { PasswordService } from './services/password.service';
import { TwoFactorService } from './services/two-factor.service';
import { PrismaService } from '../database/prisma.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { GoogleAuthGuard, GithubAuthGuard } from './guards/oauth.guards';
import type { AuthRequest, AuthenticatedUser } from './types/auth-request';
import type { OAuthProfile } from './types/oauth-profile';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestMagicLinkDto, VerifyMagicLinkDto } from './dto/magic-link.dto';
import { ConfirmTwoFactorDto, DisableTwoFactorDto } from './dto/two-factor.dto';

function requestMeta(req: AuthRequest) {
  return { userAgent: req.headers['user-agent'], ipAddress: req.ip };
}

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly password: PasswordService,
    private readonly twoFactor: TwoFactorService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  // Stricter than the global default (120/min, see ThrottlerModule.forRoot
  // in app.module.ts) — these are unauthenticated, credential-guessing-
  // shaped endpoints where the global limit is far too permissive
  // (120 login attempts/min per IP is a functioning brute-force budget).
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: AuthRequest) {
    return this.auth.register(dto, requestMeta(req));
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: AuthRequest) {
    return this.auth.login(dto, requestMeta(req));
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: AuthRequest) {
    return this.auth.refresh(dto.refreshToken, requestMeta(req));
  }

  @Public()
  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto) {
    await this.auth.logout(dto.refreshToken);
    return { success: true };
  }

  // Tighter still — each call sends an email; without this an attacker
  // could use the endpoint to spam/email-bomb an arbitrary inbox for free.
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('magic-link')
  async requestMagicLink(@Body() dto: RequestMagicLinkDto) {
    await this.auth.requestMagicLink(dto.email);
    return { success: true };
  }

  @Public()
  @Post('magic-link/verify')
  async verifyMagicLink(@Body() dto: VerifyMagicLinkDto, @Req() req: AuthRequest) {
    return this.auth.verifyMagicLink(dto.token, requestMeta(req));
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const memberships = await this.prisma.client.organizationMember.findMany({
      where: { userId: user.id },
      include: { organization: { select: { id: true, name: true, slug: true } } },
    });
    const full = await this.prisma.client.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { id: true, email: true, name: true, avatarUrl: true, twoFactorEnabled: true },
    });
    return {
      ...full,
      organizations: memberships.map((m) => ({ ...m.organization, role: m.role })),
    };
  }

  @Post('2fa/setup')
  async setupTwoFactor(@CurrentUser() user: AuthenticatedUser) {
    return this.twoFactor.generateSetup(user.email);
  }

  @Post('2fa/confirm')
  async confirmTwoFactor(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConfirmTwoFactorDto) {
    if (!this.twoFactor.verifyToken(dto.secret, dto.token)) {
      throw new BadRequestException('Invalid authenticator code');
    }
    const recoveryCodes = await this.twoFactor.enable(user.id, dto.secret);
    return { recoveryCodes };
  }

  @Post('2fa/disable')
  async disableTwoFactor(@CurrentUser() user: AuthenticatedUser, @Body() dto: DisableTwoFactorDto) {
    const record = await this.prisma.client.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!record.passwordHash || !(await this.password.verify(dto.password, record.passwordHash))) {
      throw new BadRequestException('Incorrect password');
    }
    await this.twoFactor.disable(user.id);
    return { success: true };
  }

  // --- OAuth ---------------------------------------------------------------

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // Guard redirects to Google; nothing to do here.
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: AuthRequest, @Res() res: Response) {
    return this.oauthCallback(req, res);
  }

  @Public()
  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubLogin() {
    // Guard redirects to GitHub; nothing to do here.
  }

  @Public()
  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubCallback(@Req() req: AuthRequest, @Res() res: Response) {
    return this.oauthCallback(req, res);
  }

  private async oauthCallback(req: AuthRequest, res: Response) {
    const profile = req.user as unknown as OAuthProfile;
    const session = await this.auth.loginWithOAuth(profile, requestMeta(req));
    const appUrl = this.config.get('APP_URL', { infer: true });
    const redirectUrl = new URL('/auth/callback', appUrl);
    redirectUrl.searchParams.set('accessToken', session.accessToken);
    redirectUrl.searchParams.set('refreshToken', session.refreshToken);
    res.redirect(redirectUrl.toString());
  }

  @Public()
  @Get('oauth/status')
  oauthStatus() {
    return {
      google: Boolean(this.config.get('GOOGLE_OAUTH_CLIENT_ID', { infer: true })),
      github: Boolean(this.config.get('GITHUB_OAUTH_CLIENT_ID', { infer: true })),
    };
  }
}
