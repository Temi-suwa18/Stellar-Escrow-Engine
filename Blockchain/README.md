# Blockchain

The on-chain half of ESCRA: a Soroban smart contract that actually holds and
moves funds, plus a TypeScript client the Backend uses to talk to it.

```
Blockchain/
  contracts/escrow/   Soroban smart contract (Rust)
  sdk/                @stellar-escrow/blockchain — TS client (Stellar SDK / Soroban RPC)
```

## contracts/escrow — the escrow contract

A single-contract, multi-escrow design: every escrow agreement is identified
by a caller-supplied `u64` id and stored as its own ledger entry, so one
deployed contract instance serves every escrow on the platform.

State machine: `Created → Funded → Released | Refunded`, with an optional
`Disputed` branch off `Funded` that only the arbiter can resolve.

| Function | Caller | Effect |
|---|---|---|
| `create_escrow(id, buyer, seller, arbiter, token, amount)` | buyer | Registers the agreement. Moves no funds. |
| `fund(id)` | buyer | Transfers `amount` of `token` from buyer into the contract. `Created → Funded`. |
| `release(id, caller)` | buyer or arbiter | Pays the seller. `Funded → Released`. |
| `refund(id, caller)` | seller or arbiter | Pays the buyer back. `Funded → Refunded`. |
| `dispute(id, caller)` | buyer or seller | Freezes `release`/`refund`. `Funded → Disputed`. |
| `resolve(id, release_to_seller)` | arbiter | Settles a dispute either way. |
| `get_escrow(id)` | anyone (read-only) | Returns the current `Escrow` record. |

Any `token` implementing the standard Soroban token interface works —
including Stellar Asset Contracts (XLM, USDC, etc. wrapped via SAC) and
native Soroban tokens.

### Build & test

```bash
cd Blockchain
cargo test -p escrow-contract              # unit tests, run against the native target
rustup target add wasm32-unknown-unknown   # one-time
cargo build -p escrow-contract --release --target wasm32-unknown-unknown
# -> target/wasm32-unknown-unknown/release/escrow_contract.wasm
```

Or with the Stellar CLI, which optimizes the wasm as part of the build:

```bash
stellar contract build
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/escrow_contract.wasm \
  --source <your-identity> \
  --network testnet
```

`soroban-sdk` is pinned to `21.7.6` rather than the newer `22.x` line — at
the time this was set up, `22.x`'s `testutils` feature pulled in an
`ed25519-dalek`/`rand_core` combination from crates.io that doesn't compile
(`ChaCha20Rng` doesn't implement the `CryptoRng` trait it's used against).
`21.7.6` resolves cleanly. Worth revisiting when bumping this dependency.

## sdk — `@stellar-escrow/blockchain`

`EscrowContractClient` wraps `@stellar/stellar-sdk` to build (and, for
reads, simulate) transactions against the deployed contract. It never holds
a secret key — every mutating method returns a *prepared, unsigned*
transaction for the caller (the Backend, brokering a user's wallet) to sign
and submit.

```ts
import { EscrowContractClient, Networks } from '@stellar-escrow/blockchain';

const client = new EscrowContractClient({
  contractId: process.env.ESCROW_CONTRACT_ID!,
  rpcUrl: process.env.SOROBAN_RPC_URL!,
  networkPassphrase: Networks.TESTNET,
});

const tx = await client.createEscrow({
  sourcePublicKey: buyer.publicKey(),
  escrowId: 1n,
  buyer: buyer.publicKey(),
  seller: seller.publicKey(),
  arbiter: arbiter.publicKey(),
  token: usdcContractId,
  amount: 500_000_000n, // 50.0000000 USDC (7 decimals)
});

tx.sign(buyerKeypair);
await server.sendTransaction(tx);

const escrow = await client.getEscrow(1n); // read-only, no signing needed
```

The `decodeEscrow`/`decodeStatus` codec is verified against real XDR emitted
by the compiled Rust contract (see the `print_sample_escrow_xdr_for_client_fixture`
test in `contracts/escrow/src/test.rs` and `sdk/test/codec.test.ts`) — not
guessed at from documentation, since Soroban's wire format for fieldless
Rust enums (`["VariantName"]`, not a bare string) is easy to get wrong.

### Build & test

```bash
cd Blockchain/sdk
pnpm install    # from repo root
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```

## Wiring into the Backend

Not yet connected — `Backend`'s `EscrowsService` currently only writes rows
to Postgres via `@stellar-escrow/database`. Making an escrow "real" means:
adding `ESCROW_CONTRACT_ID` to `Backend/.env`, having the Backend hold (or
broker signing for) the arbiter/platform key, and calling into
`@stellar-escrow/blockchain` from `EscrowsService` alongside the Prisma
writes so the database row and on-chain state stay in sync.
