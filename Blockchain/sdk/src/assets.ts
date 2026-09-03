import { Asset } from '@stellar/stellar-sdk';

/** The Soroban token contract address for native XLM on the given network. */
export function nativeAssetContractId(networkPassphrase: string): string {
  return Asset.native().contractId(networkPassphrase);
}

/**
 * The deterministic Soroban token contract address for a classic Stellar
 * asset (e.g. an issued USDC), derived from its code + issuer — the same
 * address `Operation.createStellarAssetContract` would produce, computed
 * without needing a transaction.
 */
export function classicAssetContractId(
  code: string,
  issuer: string,
  networkPassphrase: string,
): string {
  return new Asset(code, issuer).contractId(networkPassphrase);
}
