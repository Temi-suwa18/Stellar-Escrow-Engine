import { Injectable, NotFoundException } from '@nestjs/common';
import type { ApiKeyMode } from '@stellar-escrow/database';
import { PrismaService } from '../database/prisma.service';
import { generateOpaqueToken, hashToken } from '../common/crypto.util';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string) {
    return this.prisma.client.apiKey.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        mode: true,
        scopes: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Returns the raw key exactly once — only `keyPrefix` is ever retrievable afterward. */
  async create(organizationId: string, createdByUserId: string, name: string, mode: ApiKeyMode) {
    const rawKey = `sk_${mode.toLowerCase()}_${generateOpaqueToken(24)}`;
    const apiKey = await this.prisma.client.apiKey.create({
      data: {
        organizationId,
        name,
        mode,
        createdByUserId,
        keyPrefix: rawKey.slice(0, 12),
        hashedKey: hashToken(rawKey),
        scopes: ['*'],
      },
    });
    return { ...apiKey, rawKey };
  }

  async revoke(organizationId: string, apiKeyId: string) {
    const apiKey = await this.prisma.client.apiKey.findFirst({
      where: { id: apiKeyId, organizationId },
    });
    if (!apiKey) throw new NotFoundException('API key not found');

    await this.prisma.client.apiKey.update({
      where: { id: apiKeyId },
      data: { revokedAt: new Date() },
    });
  }
}
