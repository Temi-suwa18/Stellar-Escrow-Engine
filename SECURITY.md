# Security Policy

ESCRA is an actively-developed, pre-audit project. This document is the
process for reporting a security issue — see `Frontend/src/app/security/page.tsx`
(the site's `/security` page, linked from the footer) for a summary of
what's currently implemented.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**
Public issues are indexed and visible to everyone immediately, including
anyone looking for an unpatched way in.

Instead, use GitHub's private vulnerability reporting:

1. Go to the [Security tab](../../security) of this repository.
2. Click **Report a vulnerability**.
3. Include:
   - What the issue is and where it lives (file/endpoint/contract function).
   - Steps to reproduce, or a proof-of-concept if you have one.
   - The impact you believe it has (e.g. "lets an attacker drain escrowed
     funds" is a different severity than "endpoint returns a stack trace").

If GitHub's private reporting isn't available to you for some reason, open
an issue asking to be pointed to an alternate contact rather than
describing the vulnerability itself.

## Scope

In scope:

- `Backend/` — the NestJS API (auth, organizations, API keys, escrows).
- `Blockchain/contracts/escrow` — the Soroban smart contract.
- `Blockchain/sdk` and `sdks/typescript` — the client SDKs.
- `Frontend/` — the dashboard and marketing site.

Out of scope:

- The Stellar network itself, or Soroban runtime bugs not specific to this
  contract's logic.
- Findings that require physical access to a user's device, or a
  compromised dependency already flagged by `npm audit` / Dependabot with
  no ESCRA-specific exploitation path.
- Denial-of-service via brute-force volume against endpoints that are
  already rate-limited as designed (see `Backend/src/auth/auth.controller.ts`)
  — report if the rate limiting itself is bypassable, not that the limits
  exist.

## What to expect

This is presently a single-maintainer project without a formal SLA. A
genuine, actionable report will get a response — expect it to take days,
not hours. There is no bug bounty program at this stage.

## Known limitations

Documented here rather than left for someone to "discover":

- The Soroban escrow contract has unit test coverage and has been verified
  against Stellar testnet, but has **not** had a third-party security
  audit. Do not point it at mainnet funds you can't afford to lose.
- `autoReleaseAt` is stored on an escrow but nothing currently executes it
  — no background scheduler exists yet.
- Per-milestone release is a Backend/database concept only; the on-chain
  contract only tracks whole-escrow state.
