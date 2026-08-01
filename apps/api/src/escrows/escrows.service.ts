import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EscrowStatus,
  MilestoneStatus,
  type Escrow,
  type Milestone,
} from '@stellar-escrow/database';
import { PrismaService } from '../database/prisma.service';
import { CreateEscrowDto } from './dto/create-escrow.dto';
import { FundEscrowDto } from './dto/fund-escrow.dto';
import { DisputeEscrowDto, DisputeOutcome, ResolveDisputeDto } from './dto/dispute-escrow.dto';
import { ListEscrowsDto } from './dto/list-escrows.dto';

const AMOUNT_EPSILON = 1e-7;

type EscrowWithMilestones = Escrow & { milestones: Milestone[] };

@Injectable()
export class EscrowsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateEscrowDto): Promise<EscrowWithMilestones> {
    if (dto.milestones?.length) {
      const total = dto.milestones.reduce((sum, m) => sum + m.amount, 0);
      if (Math.abs(total - dto.amount) > AMOUNT_EPSILON) {
        throw new BadRequestException('Milestone amounts must sum to the total escrow amount');
      }
    }

    return this.prisma.client.escrow.create({
      data: {
        organizationId,
        category: dto.category,
        amount: dto.amount,
        asset: dto.asset,
        depositorWallet: dto.depositorWallet,
        beneficiaryWallet: dto.beneficiaryWallet,
        arbitratorWallet: dto.arbitratorWallet,
        timeLockUntil: dto.timeLockUntil ? new Date(dto.timeLockUntil) : undefined,
        autoReleaseAt: dto.autoReleaseAfterDays
          ? new Date(Date.now() + dto.autoReleaseAfterDays * 86_400_000)
          : undefined,
        milestones: dto.milestones
          ? {
              create: dto.milestones.map((m, index) => ({
                description: m.description,
                amount: m.amount,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: { milestones: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async list(organizationId: string, query: ListEscrowsDto) {
    const where = {
      organizationId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.client.escrow.findMany({
        where,
        include: { milestones: { orderBy: { sortOrder: 'asc' as const } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.client.escrow.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async get(organizationId: string, id: string): Promise<EscrowWithMilestones> {
    const escrow = await this.prisma.client.escrow.findFirst({
      where: { id, organizationId },
      include: { milestones: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!escrow) throw new NotFoundException('Escrow not found');
    return escrow;
  }

  async fund(
    organizationId: string,
    id: string,
    dto: FundEscrowDto,
  ): Promise<EscrowWithMilestones> {
    const escrow = await this.get(organizationId, id);
    this.assertStatus(escrow, [EscrowStatus.PENDING], 'fund');

    return this.prisma.client.escrow.update({
      where: { id },
      data: {
        status: EscrowStatus.FUNDED,
        fundedTxHash: dto.stellarTxHash,
        contractAddress: dto.contractAddress ?? escrow.contractAddress,
      },
      include: { milestones: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  /** Full release — only valid when there are no milestones, or every milestone is already released. */
  async release(organizationId: string, id: string): Promise<EscrowWithMilestones> {
    const escrow = await this.get(organizationId, id);
    this.assertStatus(escrow, [EscrowStatus.FUNDED], 'release');

    if (escrow.milestones.some((m) => m.status === MilestoneStatus.PENDING)) {
      throw new BadRequestException(
        'This escrow has unreleased milestones — release them individually via /milestones/:milestoneId/release',
      );
    }

    return this.prisma.client.escrow.update({
      where: { id },
      data: { status: EscrowStatus.RELEASED },
      include: { milestones: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  /** Releases one milestone; auto-completes the escrow once every milestone has been released. */
  async releaseMilestone(
    organizationId: string,
    id: string,
    milestoneId: string,
  ): Promise<EscrowWithMilestones> {
    const escrow = await this.get(organizationId, id);
    this.assertStatus(escrow, [EscrowStatus.FUNDED], 'release a milestone on');

    const milestone = escrow.milestones.find((m) => m.id === milestoneId);
    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.status !== MilestoneStatus.PENDING) {
      throw new ConflictException('This milestone has already been released');
    }

    await this.prisma.client.milestone.update({
      where: { id: milestoneId },
      data: { status: MilestoneStatus.RELEASED, releasedAt: new Date() },
    });

    const remaining = await this.prisma.client.milestone.count({
      where: { escrowId: id, status: MilestoneStatus.PENDING },
    });
    if (remaining === 0) {
      await this.prisma.client.escrow.update({
        where: { id },
        data: { status: EscrowStatus.RELEASED },
      });
    }

    return this.get(organizationId, id);
  }

  async refund(organizationId: string, id: string): Promise<EscrowWithMilestones> {
    const escrow = await this.get(organizationId, id);
    this.assertStatus(escrow, [EscrowStatus.FUNDED], 'refund');

    return this.prisma.client.escrow.update({
      where: { id },
      data: { status: EscrowStatus.REFUNDED },
      include: { milestones: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async dispute(
    organizationId: string,
    id: string,
    dto: DisputeEscrowDto,
  ): Promise<EscrowWithMilestones> {
    const escrow = await this.get(organizationId, id);
    this.assertStatus(escrow, [EscrowStatus.FUNDED], 'dispute');

    if (!escrow.arbitratorWallet) {
      throw new BadRequestException('This escrow has no arbitrator configured');
    }

    return this.prisma.client.escrow.update({
      where: { id },
      data: { status: EscrowStatus.DISPUTED, disputeReason: dto.reason },
      include: { milestones: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async resolve(
    organizationId: string,
    id: string,
    dto: ResolveDisputeDto,
  ): Promise<EscrowWithMilestones> {
    const escrow = await this.get(organizationId, id);
    this.assertStatus(escrow, [EscrowStatus.DISPUTED], 'resolve');

    const status =
      dto.outcome === DisputeOutcome.RELEASE ? EscrowStatus.RELEASED : EscrowStatus.REFUNDED;
    const disputeReason = dto.note
      ? `${escrow.disputeReason ?? ''}\n\nResolution: ${dto.note}`.trim()
      : escrow.disputeReason;

    return this.prisma.client.escrow.update({
      where: { id },
      data: { status, disputeReason },
      include: { milestones: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  private assertStatus(
    escrow: { status: EscrowStatus },
    allowed: EscrowStatus[],
    action: string,
  ): void {
    if (!allowed.includes(escrow.status)) {
      throw new ConflictException(`Cannot ${action} an escrow in ${escrow.status} status`);
    }
  }
}
