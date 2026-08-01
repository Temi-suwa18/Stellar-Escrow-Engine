import { Account, Address, Contract, nativeToScVal, rpc, TransactionBuilder, xdr } from '@stellar/stellar-sdk';
import { decodeEscrow } from './codec';
import type {
  CreateEscrowParams,
  DisputeEscrowParams,
  Escrow,
  EscrowClientConfig,
  FundEscrowParams,
  RefundEscrowParams,
  ReleaseEscrowParams,
  ResolveEscrowParams,
} from './types';

const BASE_FEE = '100000';
const TX_TIMEOUT_SECONDS = 30;

/**
 * Thin wrapper around the `escrow-contract` Soroban contract. Builds and fee-
 * bumps transactions ready for a caller to sign and submit — this client
 * never holds a secret key, matching how the Backend brokers wallet-signed
 * transactions rather than custodying keys itself.
 */
export class EscrowContractClient {
  private readonly contract: Contract;
  private readonly server: rpc.Server;
  private readonly networkPassphrase: string;

  constructor(config: EscrowClientConfig) {
    this.contract = new Contract(config.contractId);
    this.server = new rpc.Server(config.rpcUrl);
    this.networkPassphrase = config.networkPassphrase;
  }

  async createEscrow(params: CreateEscrowParams) {
    return this.buildTransaction(params.sourcePublicKey, 'create_escrow', [
      nativeToScVal(params.escrowId, { type: 'u64' }),
      new Address(params.buyer).toScVal(),
      new Address(params.seller).toScVal(),
      new Address(params.arbiter).toScVal(),
      new Address(params.token).toScVal(),
      nativeToScVal(params.amount, { type: 'i128' }),
    ]);
  }

  async fund(params: FundEscrowParams) {
    return this.buildTransaction(params.sourcePublicKey, 'fund', [
      nativeToScVal(params.escrowId, { type: 'u64' }),
    ]);
  }

  async release(params: ReleaseEscrowParams) {
    return this.buildTransaction(params.sourcePublicKey, 'release', [
      nativeToScVal(params.escrowId, { type: 'u64' }),
      new Address(params.caller).toScVal(),
    ]);
  }

  async refund(params: RefundEscrowParams) {
    return this.buildTransaction(params.sourcePublicKey, 'refund', [
      nativeToScVal(params.escrowId, { type: 'u64' }),
      new Address(params.caller).toScVal(),
    ]);
  }

  async dispute(params: DisputeEscrowParams) {
    return this.buildTransaction(params.sourcePublicKey, 'dispute', [
      nativeToScVal(params.escrowId, { type: 'u64' }),
      new Address(params.caller).toScVal(),
    ]);
  }

  async resolve(params: ResolveEscrowParams) {
    return this.buildTransaction(params.sourcePublicKey, 'resolve', [
      nativeToScVal(params.escrowId, { type: 'u64' }),
      nativeToScVal(params.releaseToSeller),
    ]);
  }

  /**
   * Read-only lookup — simulates rather than submitting, so it costs no fee
   * and needs no real, funded source account. `Account`'s sequence number is
   * irrelevant here since simulation never touches it.
   */
  async getEscrow(escrowId: bigint): Promise<Escrow> {
    const account = new Account(READ_ONLY_SOURCE, '0');
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(this.contract.call('get_escrow', nativeToScVal(escrowId, { type: 'u64' })))
      .setTimeout(TX_TIMEOUT_SECONDS)
      .build();

    const simulation = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulation)) {
      throw new Error(`get_escrow simulation failed: ${simulation.error}`);
    }
    if (!simulation.result) {
      throw new Error('get_escrow simulation returned no result — does this escrow id exist?');
    }

    return decodeEscrow(simulation.result.retval);
  }

  private async buildTransaction(sourcePublicKey: string, method: string, args: xdr.ScVal[]) {
    const account = await this.server.getAccount(sourcePublicKey);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(TX_TIMEOUT_SECONDS)
      .build();

    return this.server.prepareTransaction(tx);
  }
}

/**
 * A syntactically valid but unfunded, unowned keypair used purely to satisfy
 * `TransactionBuilder`'s source-account requirement for read-only simulation
 * calls, which are never signed or submitted, so nothing needs to actually
 * own or fund this account on any network.
 */
const READ_ONLY_SOURCE = 'GBSPRLU6OMESPTMJBOY6525XHNFY2FO37GL7EYW5KYKBZEPXVYOP2TGJ';
