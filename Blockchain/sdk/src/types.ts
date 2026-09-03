export enum EscrowStatus {
  Created = 'Created',
  Funded = 'Funded',
  Released = 'Released',
  Refunded = 'Refunded',
  Disputed = 'Disputed',
}

export interface Escrow {
  buyer: string;
  seller: string;
  arbiter: string;
  token: string;
  amount: bigint;
  status: EscrowStatus;
}

export interface EscrowClientConfig {
  /** Deployed contract address (C...), e.g. from `stellar contract deploy`. */
  contractId: string;
  /** Soroban RPC endpoint, e.g. https://soroban-testnet.stellar.org. */
  rpcUrl: string;
  /** Network passphrase — use the `Networks` export from @stellar/stellar-sdk. */
  networkPassphrase: string;
}

export interface CreateEscrowParams {
  sourcePublicKey: string;
  escrowId: bigint;
  buyer: string;
  seller: string;
  arbiter: string;
  token: string;
  amount: bigint;
}

export interface FundEscrowParams {
  sourcePublicKey: string;
  escrowId: bigint;
}

export interface ReleaseEscrowParams {
  sourcePublicKey: string;
  escrowId: bigint;
  caller: string;
}

export interface RefundEscrowParams {
  sourcePublicKey: string;
  escrowId: bigint;
  caller: string;
}

export interface DisputeEscrowParams {
  sourcePublicKey: string;
  escrowId: bigint;
  caller: string;
}

export interface ResolveEscrowParams {
  sourcePublicKey: string;
  escrowId: bigint;
  releaseToSeller: boolean;
}
