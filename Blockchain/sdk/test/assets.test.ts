import { describe, expect, it } from 'vitest';
import { Networks } from '@stellar/stellar-sdk';
import { classicAssetContractId, nativeAssetContractId } from '../src/assets';

describe('nativeAssetContractId', () => {
  it('matches the real, well-known native XLM SAC address on testnet', () => {
    // Verified against the actual Stellar testnet: this is the deterministic
    // contract id `Operation.createStellarAssetContract({ asset: Asset.native() })`
    // resolves to — confirmed live (as "contract already exists", since the
    // native SAC is pre-deployed network-wide) while deploying the real
    // escrow-contract instance this SDK targets.
    expect(nativeAssetContractId(Networks.TESTNET)).toBe(
      'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    );
  });

  it('gives a different address per network', () => {
    expect(nativeAssetContractId(Networks.TESTNET)).not.toBe(nativeAssetContractId(Networks.PUBLIC));
  });
});

describe('classicAssetContractId', () => {
  it('is deterministic for the same code, issuer, and network', () => {
    const issuer = 'GA7TYU7ANXW5KXORAIHFGGMA7NADHZZXCOIG77X2MTOX3RV5IPKJZOXE';
    const a = classicAssetContractId('USDC', issuer, Networks.TESTNET);
    const b = classicAssetContractId('USDC', issuer, Networks.TESTNET);
    expect(a).toBe(b);
    expect(a).toMatch(/^C[A-Z0-9]{55}$/);
  });

  it('differs by asset code even with the same issuer', () => {
    const issuer = 'GA7TYU7ANXW5KXORAIHFGGMA7NADHZZXCOIG77X2MTOX3RV5IPKJZOXE';
    expect(classicAssetContractId('USDC', issuer, Networks.TESTNET)).not.toBe(
      classicAssetContractId('EURC', issuer, Networks.TESTNET),
    );
  });
});
