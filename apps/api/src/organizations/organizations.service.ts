import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MemberRole } from '@stellar-commerce/database';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { generateOpaqueToken, hashToken } from '../common/crypto.util';
import slugify from '../common/slugify';
import type { EnvConfig } from '../config/env.validation';

const INVITATION_TTL_DAYS = 7;

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async listForUser(userId: string) {
    const memberships = await this.prisma.client.organizationMember.findMany({
      where: { userId },
      include: { organization: true },
    });
    return memberships.map((m) => ({ ...m.organization, role: m.role }));
  }

  async create(userId: string, name: string) {
    const slug = await this.uniqueSlug(name);
    return this.prisma.client.organization.create({
      data: {
        name,
        slug,
        settings: { create: {} },
        members: { create: { userId, role: 'OWNER' } },
      },
    });
  }

  async listMembers(organizationId: string) {
    return this.prisma.client.organizationMember.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    });
  }

  async invite(organizationId: string, invitedByUserId: string, email: string, role: MemberRole) {
    const organization = await this.prisma.client.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    const existingMember = await this.prisma.client.organizationMember.findFirst({
      where: { organizationId, user: { email } },
    });
    if (existingMember) {
      throw new ConflictException('This person is already a member of the organization');
    }

    const rawToken = generateOpaqueToken();
    const invitation = await this.prisma.client.organizationInvitation.upsert({
      where: { organizationId_email_status: { organizationId, email, status: 'PENDING' } },
      update: {
        tokenHash: hashToken(rawToken),
        role,
        expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 86_400_000),
      },
      create: {
        organizationId,
        email,
        role,
        invitedByUserId,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 86_400_000),
      },
    });

    const appUrl = this.config.get('APP_URL', { infer: true });
    await this.email.sendOrganizationInvitation(
      email,
      organization.name,
      `${appUrl}/invitations/accept?token=${rawToken}`,
    );

    return invitation;
  }

  async acceptInvitation(userId: string, userEmail: string, rawToken: string) {
    const invitation = await this.prisma.client.organizationInvitation.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });

    if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      throw new BadRequestException('This invitation is invalid or has expired');
    }
    if (invitation.email !== userEmail) {
      throw new ForbiddenException('This invitation was sent to a different email address');
    }

    await this.prisma.client.$transaction([
      this.prisma.client.organizationMember.create({
        data: { organizationId: invitation.organizationId, userId, role: invitation.role },
      }),
      this.prisma.client.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      }),
    ]);

    return this.prisma.client.organization.findUniqueOrThrow({
      where: { id: invitation.organizationId },
    });
  }

  async updateMemberRole(organizationId: string, memberId: string, role: MemberRole) {
    const member = await this.prisma.client.organizationMember.findFirst({
      where: { id: memberId, organizationId },
    });
    if (!member) throw new NotFoundException('Member not found');

    if (member.role === 'OWNER' && role !== 'OWNER') {
      const ownerCount = await this.prisma.client.organizationMember.count({
        where: { organizationId, role: 'OWNER' },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('An organization must have at least one owner');
      }
    }

    return this.prisma.client.organizationMember.update({
      where: { id: memberId },
      data: { role },
    });
  }

  async removeMember(organizationId: string, memberId: string) {
    const member = await this.prisma.client.organizationMember.findFirst({
      where: { id: memberId, organizationId },
    });
    if (!member) throw new NotFoundException('Member not found');

    if (member.role === 'OWNER') {
      const ownerCount = await this.prisma.client.organizationMember.count({
        where: { organizationId, role: 'OWNER' },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('An organization must have at least one owner');
      }
    }

    await this.prisma.client.organizationMember.delete({ where: { id: memberId } });
  }

  private async uniqueSlug(name: string): Promise<string> {
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
