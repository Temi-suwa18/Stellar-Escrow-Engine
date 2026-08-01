import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { hashToken } from '../../common/crypto.util';

const ISSUER = 'Stellar Commerce';
const RECOVERY_CODE_COUNT = 10;

@Injectable()
export class TwoFactorService {
  constructor(private readonly prisma: PrismaService) {}

  /** Generates a fresh TOTP secret + a scannable QR code data URL. Not persisted until confirmed. */
  async generateSetup(email: string): Promise<{ secret: string; qrCodeDataUrl: string }> {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, ISSUER, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return { secret, qrCodeDataUrl };
  }

  verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch {
      return false;
    }
  }

  /** Confirms setup: persists the secret, enables 2FA, and issues one-time recovery codes. */
  async enable(userId: string, secret: string): Promise<string[]> {
    const recoveryCodes = Array.from({ length: RECOVERY_CODE_COUNT }, () => generateRecoveryCode());

    await this.prisma.client.$transaction([
      this.prisma.client.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true, twoFactorSecret: secret },
      }),
      this.prisma.client.twoFactorRecoveryCode.deleteMany({ where: { userId } }),
      this.prisma.client.twoFactorRecoveryCode.createMany({
        data: recoveryCodes.map((code) => ({ userId, codeHash: hashToken(code) })),
      }),
    ]);

    return recoveryCodes;
  }

  async disable(userId: string): Promise<void> {
    await this.prisma.client.$transaction([
      this.prisma.client.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
      }),
      this.prisma.client.twoFactorRecoveryCode.deleteMany({ where: { userId } }),
    ]);
  }

  /** Consumes a recovery code (single use) as a fallback when the authenticator app is unavailable. */
  async consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
    const codeHash = hashToken(code.trim().toUpperCase());
    const record = await this.prisma.client.twoFactorRecoveryCode.findFirst({
      where: { userId, codeHash, usedAt: null },
    });
    if (!record) return false;

    await this.prisma.client.twoFactorRecoveryCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return true;
  }
}

function generateRecoveryCode(): string {
  return randomBytes(5).toString('hex').toUpperCase().match(/.{1,5}/g)!.join('-');
}
