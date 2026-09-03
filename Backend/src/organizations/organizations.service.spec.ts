/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment --
   same rationale as escrows.service.spec.ts. */
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import type { PrismaService } from '../database/prisma.service';
import type { EmailService } from '../email/email.service';
import type { ConfigService } from '@nestjs/config';

const ORG_ID = 'org_1';

function createPrismaMock() {
  return {
    client: {
      organization: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      organizationMember: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      organizationInvitation: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (ops: unknown[]) => Promise.all(ops)),
    },
  } as unknown as PrismaService & {
    client: {
      organization: { create: jest.Mock; findUnique: jest.Mock; findUniqueOrThrow: jest.Mock };
      organizationMember: {
        findMany: jest.Mock;
        findFirst: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
        count: jest.Mock;
      };
      organizationInvitation: { upsert: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
      $transaction: jest.Mock;
    };
  };
}

function createEmailMock() {
  return { sendOrganizationInvitation: jest.fn() } as unknown as EmailService & {
    sendOrganizationInvitation: jest.Mock;
  };
}

function createConfigMock() {
  return { get: jest.fn().mockReturnValue('http://localhost:3000') } as unknown as ConfigService & {
    get: jest.Mock;
  };
}

describe('OrganizationsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let email: ReturnType<typeof createEmailMock>;
  let config: ReturnType<typeof createConfigMock>;
  let service: OrganizationsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    email = createEmailMock();
    config = createConfigMock();
    service = new OrganizationsService(prisma, email, config);
  });

  describe('create', () => {
    it('slugifies the name and makes the creator an OWNER', async () => {
      prisma.client.organization.findUnique.mockResolvedValue(null);
      prisma.client.organization.create.mockResolvedValue({ id: ORG_ID, name: 'Acme Inc', slug: 'acme-inc' });

      await service.create('user_1', 'Acme Inc');

      expect(prisma.client.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Acme Inc',
            slug: 'acme-inc',
            members: { create: { userId: 'user_1', role: 'OWNER' } },
          }),
        }),
      );
    });

    it('appends a numeric suffix when the slug is already taken', async () => {
      prisma.client.organization.findUnique
        .mockResolvedValueOnce({ id: 'existing', slug: 'acme-inc' })
        .mockResolvedValueOnce(null);
      prisma.client.organization.create.mockResolvedValue({ id: ORG_ID });

      await service.create('user_1', 'Acme Inc');

      expect(prisma.client.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: 'acme-inc-1' }) }),
      );
    });
  });

  describe('invite', () => {
    it('rejects inviting someone who is already a member', async () => {
      prisma.client.organization.findUniqueOrThrow.mockResolvedValue({ id: ORG_ID, name: 'Acme' });
      prisma.client.organizationMember.findFirst.mockResolvedValue({ id: 'member_1' });

      await expect(service.invite(ORG_ID, 'user_1', 'existing@acme.com', 'VIEWER')).rejects.toThrow(
        ConflictException,
      );
      expect(email.sendOrganizationInvitation).not.toHaveBeenCalled();
    });

    it('sends an invitation email with the accept link for a new invitee', async () => {
      prisma.client.organization.findUniqueOrThrow.mockResolvedValue({ id: ORG_ID, name: 'Acme' });
      prisma.client.organizationMember.findFirst.mockResolvedValue(null);
      prisma.client.organizationInvitation.upsert.mockResolvedValue({ id: 'inv_1' });

      await service.invite(ORG_ID, 'user_1', 'new@acme.com', 'VIEWER');

      expect(email.sendOrganizationInvitation).toHaveBeenCalledWith(
        'new@acme.com',
        'Acme',
        expect.stringContaining('/invitations/accept?token='),
      );
    });
  });

  describe('acceptInvitation', () => {
    it('rejects an unknown token', async () => {
      prisma.client.organizationInvitation.findUnique.mockResolvedValue(null);

      await expect(service.acceptInvitation('user_1', 'a@b.com', 'bad-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an expired invitation', async () => {
      prisma.client.organizationInvitation.findUnique.mockResolvedValue({
        status: 'PENDING',
        email: 'a@b.com',
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.acceptInvitation('user_1', 'a@b.com', 'token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an invitation sent to a different email', async () => {
      prisma.client.organizationInvitation.findUnique.mockResolvedValue({
        status: 'PENDING',
        email: 'someone-else@b.com',
        expiresAt: new Date(Date.now() + 1_000_000),
      });

      await expect(service.acceptInvitation('user_1', 'a@b.com', 'token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('creates a membership and marks the invitation accepted for a valid token', async () => {
      prisma.client.organizationInvitation.findUnique.mockResolvedValue({
        id: 'inv_1',
        organizationId: ORG_ID,
        status: 'PENDING',
        email: 'a@b.com',
        role: 'VIEWER',
        expiresAt: new Date(Date.now() + 1_000_000),
      });
      prisma.client.organization.findUniqueOrThrow.mockResolvedValue({ id: ORG_ID });

      await service.acceptInvitation('user_1', 'a@b.com', 'token');

      expect(prisma.client.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.client.organizationMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { organizationId: ORG_ID, userId: 'user_1', role: 'VIEWER' },
        }),
      );
      expect(prisma.client.organizationInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv_1' },
          data: expect.objectContaining({ status: 'ACCEPTED' }),
        }),
      );
    });
  });

  describe('updateMemberRole', () => {
    it('throws NotFoundException for a member outside the organization', async () => {
      prisma.client.organizationMember.findFirst.mockResolvedValue(null);

      await expect(service.updateMemberRole(ORG_ID, 'member_1', 'ADMIN')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('blocks demoting the sole remaining owner', async () => {
      prisma.client.organizationMember.findFirst.mockResolvedValue({ id: 'member_1', role: 'OWNER' });
      prisma.client.organizationMember.count.mockResolvedValue(1);

      await expect(service.updateMemberRole(ORG_ID, 'member_1', 'ADMIN')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.client.organizationMember.update).not.toHaveBeenCalled();
    });

    it('allows demoting an owner when another owner remains', async () => {
      prisma.client.organizationMember.findFirst.mockResolvedValue({ id: 'member_1', role: 'OWNER' });
      prisma.client.organizationMember.count.mockResolvedValue(2);
      prisma.client.organizationMember.update.mockResolvedValue({ id: 'member_1', role: 'ADMIN' });

      await service.updateMemberRole(ORG_ID, 'member_1', 'ADMIN');

      expect(prisma.client.organizationMember.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'member_1' }, data: { role: 'ADMIN' } }),
      );
    });
  });

  describe('removeMember', () => {
    it('blocks removing the sole remaining owner', async () => {
      prisma.client.organizationMember.findFirst.mockResolvedValue({ id: 'member_1', role: 'OWNER' });
      prisma.client.organizationMember.count.mockResolvedValue(1);

      await expect(service.removeMember(ORG_ID, 'member_1')).rejects.toThrow(BadRequestException);
      expect(prisma.client.organizationMember.delete).not.toHaveBeenCalled();
    });

    it('removes a non-owner member freely', async () => {
      prisma.client.organizationMember.findFirst.mockResolvedValue({ id: 'member_1', role: 'VIEWER' });

      await service.removeMember(ORG_ID, 'member_1');

      expect(prisma.client.organizationMember.delete).toHaveBeenCalledWith({ where: { id: 'member_1' } });
    });
  });
});
