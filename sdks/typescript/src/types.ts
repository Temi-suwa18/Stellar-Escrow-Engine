export type EscrowCategory = 'FREELANCE' | 'ECOMMERCE' | 'RENTAL' | 'LOGISTICS';

export type EscrowStatus = 'PENDING' | 'FUNDED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED' | 'RESOLVED';

export type MilestoneStatus = 'PENDING' | 'RELEASED' | 'DISPUTED';

export interface Milestone {
  id: string;
  escrowId: string;
  description: string;
  /** Decimal amount serialized as a string by the API — parse with `Number(...)` if you need arithmetic. */
  amount: string;
  status: MilestoneStatus;
  sortOrder: number;
  releasedAt: string | null;
  createdAt: string;
}

export interface Escrow {
  id: string;
  organizationId: string;
  category: EscrowCategory;
  contractAddress: string | null;
  chainEscrowId: number;
  depositorWallet: string;
  beneficiaryWallet: string;
  arbitratorWallet: string | null;
  /** Decimal amount serialized as a string by the API — parse with `Number(...)` if you need arithmetic. */
  amount: string;
  asset: string;
  status: EscrowStatus;
  timeLockUntil: string | null;
  autoReleaseAt: string | null;
  fundedTxHash: string | null;
  disputeReason: string | null;
  createdAt: string;
  updatedAt: string;
  milestones: Milestone[];
  /** Present on the response to `create()` only when the deal is chain-eligible. */
  unsignedCreateTransactionXdr?: string;
}

export interface CreateMilestoneInput {
  description: string;
  amount: number;
}

export interface CreateEscrowInput {
  category: EscrowCategory;
  amount: number;
  asset: string;
  depositorWallet: string;
  beneficiaryWallet: string;
  arbitratorWallet?: string;
  milestones?: CreateMilestoneInput[];
  timeLockUntil?: string;
  autoReleaseAfterDays?: number;
}

export interface ListEscrowsQuery {
  status?: EscrowStatus;
  category?: EscrowCategory;
  page?: number;
  limit?: number;
}

export interface ListEscrowsResult {
  items: Escrow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FundEscrowInput {
  stellarTxHash: string;
  contractAddress?: string;
}

export interface ReleaseEscrowInput {
  stellarTxHash?: string;
}

export interface RefundEscrowInput {
  stellarTxHash?: string;
}

export interface DisputeEscrowInput {
  reason: string;
  stellarTxHash?: string;
}

export type DisputeOutcome = 'RELEASE' | 'REFUND';

export interface ResolveDisputeInput {
  outcome: DisputeOutcome;
  note?: string;
  stellarTxHash?: string;
}

export interface OnChainState {
  chainEscrowId: number;
  eligible: boolean;
  state: {
    buyer: string;
    seller: string;
    arbiter: string;
    token: string;
    amount: string;
    status: string;
  } | null;
}
