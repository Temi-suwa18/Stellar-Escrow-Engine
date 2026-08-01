import { scValToNative, xdr } from '@stellar/stellar-sdk';
import { Escrow, EscrowStatus } from './types';

/**
 * Fieldless Rust enums (`#[contracttype] enum EscrowStatus { Created, ... }`)
 * are XDR-encoded by soroban-sdk as a single-element vec containing the
 * variant name as a symbol, e.g. `["Disputed"]` — not a bare string and not
 * a `{ tag }` object. Verified against real XDR emitted by the compiled
 * `escrow-contract` (see Blockchain/contracts/escrow/src/test.rs).
 */
export function decodeStatus(raw: unknown): EscrowStatus {
  const tag: unknown = Array.isArray(raw) ? (raw as unknown[])[0] : raw;
  if (typeof tag === 'string' && tag in EscrowStatus) {
    return EscrowStatus[tag as keyof typeof EscrowStatus];
  }
  throw new Error(`Unrecognized escrow status from contract: ${JSON.stringify(raw)}`);
}

/** Decodes the `Escrow` struct returned by `get_escrow` into a clean, typed object. */
export function decodeEscrow(scVal: xdr.ScVal): Escrow {
  const raw = scValToNative(scVal) as Record<string, unknown>;
  return {
    buyer: String(raw.buyer),
    seller: String(raw.seller),
    arbiter: String(raw.arbiter),
    token: String(raw.token),
    amount: BigInt(raw.amount as bigint),
    status: decodeStatus(raw.status),
  };
}
