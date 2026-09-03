import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { hashToken } from '../../common/crypto.util';
import type { AuthRequest } from '../types/auth-request';

/**
 * Authenticates a request via `X-Api-Key` instead of a bearer JWT — the
 * path merchants' backends use to call the Payment API directly. Attaches
 * `request.apiKey` (organization + mode + scopes) rather than `request.user`.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const rawKey = request.headers['x-api-key'];

    if (typeof rawKey !== 'string' || rawKey.length === 0) {
      throw new UnauthorizedException('Missing X-Api-Key header');
    }

    const apiKey = await this.prisma.client.apiKey.findUnique({
      where: { hashedKey: hashToken(rawKey) },
    });

    if (!apiKey || apiKey.revokedAt) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    await this.prisma.client.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    request.apiKey = {
      id: apiKey.id,
      organizationId: apiKey.organizationId,
      mode: apiKey.mode,
      scopes: apiKey.scopes,
    };
    return true;
  }
}
