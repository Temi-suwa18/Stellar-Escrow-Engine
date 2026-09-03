import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  classicAssetContractId,
  EscrowContractClient,
  nativeAssetContractId,
  rpc,
  type Escrow as ChainEscrow,
} from '@stellar-escrow/blockchain';
import type { EnvConfig } from '../config/env.validation';

export interface CreateEscrowChainParams {
  chainEscrowId: number;
  buyer: string;
  seller: string;
  arbiter: string;
  assetContractId: string;
  amount: bigint;
}

/**
 * `Error::NotFound = 2` in the Rust contract (Blockchain/contracts/escrow/src/lib.rs)
 * surfaces through simulation as this substring — verified against the real
 * deployed contract (`get_escrow` on an id that was never `create_escrow`'d).
 */
const NOT_FOUND_ERROR_MARKER = 'Error(Contract, #2)';

/** Stellar classic assets (and their Soroban token wrappers) use 7 decimal places. */
const STROOPS_PER_UNIT = 10_000_000;

export function toContractAmount(amount: number): bigint {
  return BigInt(Math.round(amount * STROOPS_PER_UNIT));
}

/**
 * Thin Nest wrapper around `@stellar-escrow/blockchain`'s `EscrowContractClient`.
 * Degrades gracefully when `ESCROW_CONTRACT_ID` isn't configured — escrows
 * stay DB-only rather than the app refusing to boot, since the contract may
 * not be deployed to every environment yet.
 */
@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly client: EscrowContractClient | null;
  private readonly networkPassphrase: string;
  private readonly usdcIssuer?: string;

  constructor(config: ConfigService<EnvConfig, true>) {
    const contractId = config.get('ESCROW_CONTRACT_ID', { infer: true });
    this.networkPassphrase = config.get('STELLAR_NETWORK_PASSPHRASE', { infer: true });
    this.usdcIssuer = config.get('USDC_ASSET_ISSUER', { infer: true });

    this.client = contractId
      ? new EscrowContractClient({
          contractId,
          rpcUrl: config.get('SOROBAN_RPC_URL', { infer: true }),
          networkPassphrase: this.networkPassphrase,
        })
      : null;

    if (!this.client) {
      this.logger.warn(
        'ESCROW_CONTRACT_ID not configured — escrows will be DB-only and unverified on-chain.',
      );
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Maps a display asset code (e.g. "XLM", "USDC") to its Soroban token
   * contract address, or null if it can't be resolved (unknown asset, or a
   * classic asset whose issuer isn't configured).
   */
  resolveAssetContract(asset: string): string | null {
    const code = asset.trim().toUpperCase();
    if (code === 'XLM' || code === 'NATIVE') {
      return nativeAssetContractId(this.networkPassphrase);
    }
    if (code === 'USDC' && this.usdcIssuer) {
      return classicAssetContractId('USDC', this.usdcIssuer, this.networkPassphrase);
    }
    return null;
  }

  /** Builds an unsigned `create_escrow` transaction for the depositor's wallet to sign and submit. */
  async buildCreateEscrowTransaction(params: CreateEscrowChainParams): Promise<string> {
    if (!this.client) throw new Error('Blockchain not configured (ESCROW_CONTRACT_ID unset)');

    const tx = await this.client.createEscrow({
      sourcePublicKey: params.buyer,
      escrowId: BigInt(params.chainEscrowId),
      buyer: params.buyer,
      seller: params.seller,
      arbiter: params.arbiter,
      token: params.assetContractId,
      amount: params.amount,
    });
    return tx.toXDR();
  }

  /** Live on-chain state for an escrow, or null if it hasn't been registered on-chain (yet). */
  async getOnChainEscrow(chainEscrowId: number): Promise<ChainEscrow | null> {
    if (!this.client) return null;

    try {
      return await this.client.getEscrow(BigInt(chainEscrowId));
    } catch (error) {
      if (error instanceof Error && error.message.includes(NOT_FOUND_ERROR_MARKER)) {
        return null;
      }
      throw error;
    }
  }

  /** Confirms a client-supplied transaction hash actually succeeded, rather than trusting it blindly. */
  async verifyTransactionSucceeded(txHash: string): Promise<boolean> {
    if (!this.client) return false;
    const status = await this.client.getTransactionStatus(txHash);
    return status === rpc.Api.GetTransactionStatus.SUCCESS;
  }
}
