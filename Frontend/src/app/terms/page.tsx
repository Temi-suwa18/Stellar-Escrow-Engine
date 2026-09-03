import type { Metadata } from 'next';
import { Navbar } from '@/components/marketing/navbar';
import { Footer } from '@/components/marketing/footer';

export const metadata: Metadata = {
  title: 'Terms of Service',
};

const LAST_UPDATED = '2026-08-02';

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 py-20">
        <div className="container">
          <div className="mx-auto flex max-w-2xl flex-col gap-10">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
              <p className="text-muted-foreground text-sm">Last updated {LAST_UPDATED}</p>
            </div>

            <div className="text-muted-foreground flex flex-col gap-8 text-sm leading-relaxed">
              <p>
                These terms cover use of the ESCRA API, dashboard, and SDKs (&quot;the
                Service&quot;). ESCRA is an actively developed, early-stage project — read
                &quot;actively under construction&quot; on the README literally, and evaluate the
                Service accordingly before relying on it for anything you can&apos;t afford to
                lose.
              </p>

              <section className="flex flex-col gap-2">
                <h2 className="text-foreground text-base font-semibold">What ESCRA is</h2>
                <p>
                  A non-custodial escrow protocol on Stellar. The API brokers and verifies
                  transactions against a Soroban smart contract; it does not custody funds, and it
                  cannot move funds without the relevant wallet&apos;s signature. You — and the
                  depositor/beneficiary/arbitrator wallets involved — remain in control of your
                  own funds at every step.
                </p>
              </section>

              <section className="flex flex-col gap-2">
                <h2 className="text-foreground text-base font-semibold">Your responsibilities</h2>
                <ul className="list-disc pl-5">
                  <li>Keep your account credentials, API keys, and wallet keys secure — we can revoke a compromised API key, but we can&apos;t recover funds moved by a compromised wallet.</li>
                  <li>Use the Service lawfully. You&apos;re responsible for how escrows you create are used.</li>
                  <li>
                    Understand that transactions submitted to the Stellar network are irreversible
                    once confirmed — that&apos;s a property of the blockchain, not a Service
                    limitation.
                  </li>
                </ul>
              </section>

              <section className="flex flex-col gap-2">
                <h2 className="text-foreground text-base font-semibold">
                  No warranty, use at your own risk
                </h2>
                <p>
                  The Service is provided &quot;as is&quot;, without warranty of any kind, during
                  active development. Smart contract code, however carefully written and tested,
                  carries inherent risk — ESCRA&apos;s contract has unit tests and has been
                  verified against Stellar testnet, but has not undergone a third-party security
                  audit. Do not rely on it for mainnet funds you cannot afford to lose.
                </p>
              </section>

              <section className="flex flex-col gap-2">
                <h2 className="text-foreground text-base font-semibold">License</h2>
                <p>
                  The ESCRA codebase is proprietary — all rights reserved, per the LICENSE in the
                  repository. Using the hosted API/dashboard doesn&apos;t grant you rights to the
                  underlying source beyond what that license states.
                </p>
              </section>

              <section className="flex flex-col gap-2">
                <h2 className="text-foreground text-base font-semibold">Changes</h2>
                <p>
                  We&apos;ll update the date at the top of this page when these terms change
                  materially. Continued use of the Service after a change means you accept the
                  updated terms.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
