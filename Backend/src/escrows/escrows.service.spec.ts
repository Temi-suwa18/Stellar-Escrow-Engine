/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment --
   jest.fn() mock references passed to expect(...).toHaveBeenCalledWith(...) trip the
   unbound-method heuristic even though they never rely on `this`; the mocked PrismaService
   shape is inherently loosely typed via the `as unknown as PrismaService` cast below. */
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EscrowCategory, EscrowStatus, MilestoneStatus } from '@stellar-escrow/database';
import { EscrowsService } from './escrows.service';
import { DisputeOutcome } from './dto/dispute-escrow.dto';
import type { PrismaService } from '../database/prisma.service';
import type { BlockchainService } from '../blockchain/blockchain.service';

const ORG_ID = 'org_1';

function createEscrowFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'esc_1',
    organizationId: ORG_ID,
    category: 'FREELANCE',
    contractAddress: null,
    chainEscrowId: 1,
    depositorWallet: 'G'.padEnd(56, 'A'),
    beneficiaryWallet: 'G'.padEnd(56, 'B'),
    arbitratorWallet: null,
    amount: 500,
    asset: 'USDC',
    status: EscrowStatus.PENDING,
    timeLockUntil: null,
    autoReleaseAt: null,
    fundedTxHash: null,
    disputeReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    milestones: [],
    ...overrides,
  };
}

/** Defaults to "not configured" — the same DB-only, trust-the-caller behavior the pre-blockchain tests assumed. */
function createBlockchainMock(overrides: Record<string, unknown> = {}) {
  return {
    isConfigured: jest.fn().mockReturnValue(false),
    resolveAssetContract: jest.fn().mockReturnValue(null),
    buildCreateEscrowTransaction: jest.fn(),
    getOnChainEscrow: jest.fn(),
    verifyTransactionSucceeded: jest.fn(),
    ...overrides,
  } as unknown as BlockchainService & {
    isConfigured: jest.Mock;
    resolveAssetContract: jest.Mock;
    buildCreateEscrowTransaction: jest.Mock;
    getOnChainEscrow: jest.Mock;
    verifyTransactionSucceeded: jest.Mock;
  };
}

function createPrismaMock() {
  return {
    client: {
      escrow: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      milestone: {
        update: jest.fn(),
        count: jest.fn(),
      },
    },
  } as unknown as PrismaService & {
    client: {
      escrow: {
        create: jest.Mock;
        findFirst: jest.Mock;
        findMany: jest.Mock;
        count: jest.Mock;
        update: jest.Mock;
      };
      milestone: { update: jest.Mock; count: jest.Mock };
    };
  };
}

describe('EscrowsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let blockchain: ReturnType<typeof createBlockchainMock>;
  let service: EscrowsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    blockchain = createBlockchainMock();
    service = new EscrowsService(prisma, blockchain);
  });

  describe('create', () => {
    it('rejects milestone amounts that do not sum to the total', async () => {
      await expect(
        service.create(ORG_ID, {
          category: EscrowCategory.FREELANCE,
          amount: 500,
          asset: 'USDC',
          depositorWallet: 'G'.padEnd(56, 'A'),
          beneficiaryWallet: 'G'.padEnd(56, 'B'),
          milestones: [
            { description: 'A', amount: 100 },
            { description: 'B', amount: 100 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.client.escrow.create).not.toHaveBeenCalled();
    });

    it('creates an escrow when milestone amounts sum correctly', async () => {
      prisma.client.escrow.create.mockResolvedValue(createEscrowFixture());

      await service.create(ORG_ID, {
        category: EscrowCategory.FREELANCE,
        amount: 500,
        asset: 'USDC',
        depositorWallet: 'G'.padEnd(56, 'A'),
        beneficiaryWallet: 'G'.padEnd(56, 'B'),
        milestones: [
          { description: 'A', amount: 200 },
          { description: 'B', amount: 300 },
        ],
      });

      expect(prisma.client.escrow.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('fund', () => {
    it('transitions PENDING -> FUNDED', async () => {
      prisma.client.escrow.findFirst.mockResolvedValue(createEscrowFixture());
      prisma.client.escrow.update.mockResolvedValue(
        createEscrowFixture({ status: EscrowStatus.FUNDED }),
      );

      await service.fund(ORG_ID, 'esc_1', { stellarTxHash: 'tx123' });

      expect(prisma.client.escrow.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: EscrowStatus.FUNDED, fundedTxHash: 'tx123' }),
        }),
      );
    });

    it('rejects funding an already-funded escrow', async () => {
      prisma.client.escrow.findFirst.mockResolvedValue(
        createEscrowFixture({ status: EscrowStatus.FUNDED }),
      );

      await expect(service.fund(ORG_ID, 'esc_1', { stellarTxHash: 'tx123' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws NotFoundException for an escrow outside the caller organization', async () => {
      prisma.client.escrow.findFirst.mockResolvedValue(null);

      await expect(service.fund(ORG_ID, 'esc_1', { stellarTxHash: 'tx123' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('release', () => {
    it('releases a lump-sum escrow with no milestones', async () => {
      prisma.client.escrow.findFirst.mockResolvedValue(
        createEscrowFixture({ status: EscrowStatus.FUNDED }),
      );
      prisma.client.escrow.update.mockResolvedValue(
        createEscrowFixture({ status: EscrowStatus.RELEASED }),
      );

      const result = await service.release(ORG_ID, 'esc_1', {});
      expect(result.status).toBe(EscrowStatus.RELEASED);
    });

    it('blocks a full release while milestones are still pending', async () => {
      prisma.client.escrow.findFirst.mockResolvedValue(
        createEscrowFixture({
          status: EscrowStatus.FUNDED,
          milestones: [{ id: 'm1', status: MilestoneStatus.PENDING }],
        }),
      );

      await expect(service.release(ORG_ID, 'esc_1', {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('releaseMilestone', () => {
    it('auto-completes the escrow once the last milestone is released', async () => {
      // First findFirst call loads the pre-release state; the second is the
      // re-fetch at the end of releaseMilestone, after the update landed.
      prisma.client.escrow.findFirst
        .mockResolvedValueOnce(
          createEscrowFixture({
            status: EscrowStatus.FUNDED,
            milestones: [{ id: 'm1', status: MilestoneStatus.PENDING }],
          }),
        )
        .mockResolvedValueOnce(
          createEscrowFixture({
            status: EscrowStatus.RELEASED,
            milestones: [{ id: 'm1', status: MilestoneStatus.RELEASED }],
          }),
        );
      prisma.client.milestone.count.mockResolvedValue(0);

      const result = await service.releaseMilestone(ORG_ID, 'esc_1', 'm1');

      expect(prisma.client.milestone.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'm1' },
          data: expect.objectContaining({ status: MilestoneStatus.RELEASED }),
        }),
      );
      expect(prisma.client.escrow.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: EscrowStatus.RELEASED } }),
      );
      expect(result.status).toBe(EscrowStatus.RELEASED);
    });

    it('does not complete the escrow while other milestones remain pending', async () => {
      prisma.client.escrow.findFirst.mockResolvedValue(
        createEscrowFixture({
          status: EscrowStatus.FUNDED,
          milestones: [
            { id: 'm1', status: MilestoneStatus.PENDING },
            { id: 'm2', status: MilestoneStatus.PENDING },
          ],
        }),
      );
      prisma.client.milestone.count.mockResolvedValue(1);

      await service.releaseMilestone(ORG_ID, 'esc_1', 'm1');

      expect(prisma.client.escrow.update).not.toHaveBeenCalled();
    });

    it('rejects releasing an already-released milestone', async () => {
      prisma.client.escrow.findFirst.mockResolvedValue(
        createEscrowFixture({
          status: EscrowStatus.FUNDED,
          milestones: [{ id: 'm1', status: MilestoneStatus.RELEASED }],
        }),
      );

      await expect(service.releaseMilestone(ORG_ID, 'esc_1', 'm1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('dispute', () => {
    it('rejects opening a dispute with no arbitrator configured', async () => {
      prisma.client.escrow.findFirst.mockResolvedValue(
        createEscrowFixture({ status: EscrowStatus.FUNDED, arbitratorWallet: null }),
      );

      await expect(service.dispute(ORG_ID, 'esc_1', { reason: 'bad delivery' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('opens a dispute when an arbitrator is configured', async () => {
      prisma.client.escrow.findFirst.mockResolvedValue(
        createEscrowFixture({ status: EscrowStatus.FUNDED, arbitratorWallet: 'G'.padEnd(56, 'C') }),
      );
      prisma.client.escrow.update.mockResolvedValue(
        createEscrowFixture({ status: EscrowStatus.DISPUTED }),
      );

      const result = await service.dispute(ORG_ID, 'esc_1', { reason: 'bad delivery' });
      expect(result.status).toBe(EscrowStatus.DISPUTED);
    });

    it('requires and verifies a stellarTxHash for chain-eligible escrows', async () => {
      blockchain.isConfigured.mockReturnValue(true);
      blockchain.resolveAssetContract.mockReturnValue('CTOKEN...');
      const chainEligibleEscrow = createEscrowFixture({
        status: EscrowStatus.FUNDED,
        arbitratorWallet: 'G'.padEnd(56, 'C'),
      });
      prisma.client.escrow.findFirst.mockResolvedValue(chainEligibleEscrow);

      // No stellarTxHash at all — should be rejected before touching the chain.
      await expect(service.dispute(ORG_ID, 'esc_1', { reason: 'bad delivery' })).rejects.toThrow(
        BadRequestException,
      );
      expect(blockchain.verifyTransactionSucceeded).not.toHaveBeenCalled();

      // A hash that doesn't verify on-chain — also rejected.
      blockchain.verifyTransactionSucceeded.mockResolvedValue(false);
      await expect(
        service.dispute(ORG_ID, 'esc_1', { reason: 'bad delivery', stellarTxHash: 'bad_tx' }),
      ).rejects.toThrow(BadRequestException);

      // A hash that verifies, and matching on-chain status — succeeds.
      blockchain.verifyTransactionSucceeded.mockResolvedValue(true);
      blockchain.getOnChainEscrow.mockResolvedValue({ status: 'Disputed' });
      prisma.client.escrow.update.mockResolvedValue(
        createEscrowFixture({ status: EscrowStatus.DISPUTED }),
      );

      const result = await service.dispute(ORG_ID, 'esc_1', {
        reason: 'bad delivery',
        stellarTxHash: 'good_tx',
      });
      expect(result.status).toBe(EscrowStatus.DISPUTED);
    });
  });

  describe('resolve', () => {
    it('releases funds when the arbitrator rules for the beneficiary', async () => {
      prisma.client.escrow.findFirst.mockResolvedValue(
        createEscrowFixture({ status: EscrowStatus.DISPUTED, disputeReason: 'bad delivery' }),
      );
      prisma.client.escrow.update.mockResolvedValue(
        createEscrowFixture({ status: EscrowStatus.RELEASED }),
      );

      const result = await service.resolve(ORG_ID, 'esc_1', { outcome: DisputeOutcome.RELEASE });
      expect(result.status).toBe(EscrowStatus.RELEASED);
    });

    it('refunds the depositor when the arbitrator rules for them', async () => {
      prisma.client.escrow.findFirst.mockResolvedValue(
        createEscrowFixture({ status: EscrowStatus.DISPUTED }),
      );
      prisma.client.escrow.update.mockResolvedValue(
        createEscrowFixture({ status: EscrowStatus.REFUNDED }),
      );

      const result = await service.resolve(ORG_ID, 'esc_1', { outcome: DisputeOutcome.REFUND });
      expect(result.status).toBe(EscrowStatus.REFUNDED);
    });

    it('rejects resolving an escrow that is not disputed', async () => {
      prisma.client.escrow.findFirst.mockResolvedValue(
        createEscrowFixture({ status: EscrowStatus.FUNDED }),
      );

      await expect(
        service.resolve(ORG_ID, 'esc_1', { outcome: DisputeOutcome.RELEASE }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getOnChainState', () => {
    it('is not chain-eligible without an arbitrator, even with blockchain configured', async () => {
      blockchain.isConfigured.mockReturnValue(true);
      blockchain.resolveAssetContract.mockReturnValue('CTOKEN...');
      prisma.client.escrow.findFirst.mockResolvedValue(
        createEscrowFixture({ arbitratorWallet: null }),
      );

      const result = await service.getOnChainState(ORG_ID, 'esc_1');

      expect(result).toEqual({ chainEscrowId: 1, eligible: false, state: null });
      expect(blockchain.getOnChainEscrow).not.toHaveBeenCalled();
    });

    it('stringifies the on-chain amount instead of returning a raw bigint', async () => {
      // A raw bigint here would make JSON.stringify throw once this response
      // actually reaches the HTTP layer — this is what surfaced that bug.
      blockchain.isConfigured.mockReturnValue(true);
      blockchain.resolveAssetContract.mockReturnValue('CTOKEN...');
      blockchain.getOnChainEscrow.mockResolvedValue({
        buyer: 'GBUYER',
        seller: 'GSELLER',
        arbiter: 'GARBITER',
        token: 'CTOKEN',
        amount: 500_000_000n,
        status: 'Funded',
      });
      prisma.client.escrow.findFirst.mockResolvedValue(
        createEscrowFixture({ arbitratorWallet: 'G'.padEnd(56, 'C') }),
      );

      const result = await service.getOnChainState(ORG_ID, 'esc_1');

      expect(result.eligible).toBe(true);
      expect(result.state?.amount).toBe('500000000');
      expect(typeof result.state?.amount).toBe('string');
      expect(() => JSON.stringify(result)).not.toThrow();
    });
  });
});
