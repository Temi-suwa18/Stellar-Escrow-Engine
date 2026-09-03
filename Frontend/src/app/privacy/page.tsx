import type { Metadata } from 'next';
import { Navbar } from '@/components/marketing/navbar';
import { Footer } from '@/components/marketing/footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

const LAST_UPDATED = '2026-08-02';

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 py-20">
        <div className="container">
          <div className="mx-auto flex max-w-2xl flex-col gap-10">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
              <p className="text-muted-foreground text-sm">Last updated {LAST_UPDATED}</p>
            </div>

            <div className="text-muted-foreground flex flex-col gap-8 text-sm leading-relaxed">
              <p>
                ESCRA (&quot;we&quot;, &quot;us&quot;) provides an escrow API and dashboard built
                on the Stellar network. This page describes what we actually collect and why —
                not a template disconnected from what the product does.
              </p>

              <section className="flex flex-col gap-2">
                <h2 className="text-foreground text-base font-semibold">What we collect</h2>
                <p>Directly, when you create an account or use the dashboard:</p>
                <ul className="list-disc pl-5">
                  <li>Email address and name, for authentication and account communication.</li>
                  <li>
                    Organization name and role, and — if you sign in with Google or GitHub — the
                    profile information those providers share with us.
                  </li>
                  <li>
                    API keys you generate: we store a hash and a short prefix, never the raw key
                    after it&apos;s shown to you once.
                  </li>
                  <li>
                    Wallet addresses (Stellar public keys) you supply when creating an escrow —
                    these are public blockchain identifiers, not secrets.
                  </li>
                  <li>
                    Session metadata (IP address, user agent) attached to login sessions, used for
                    security purposes like detecting refresh-token reuse.
                  </li>
                </ul>
                <p>
                  We do not collect wallet private keys. ESCRA is non-custodial — funds move
                  through a Soroban smart contract that only your wallet can authorize; we never
                  hold the keys that would let us move them ourselves.
                </p>
              </section>

              <section className="flex flex-col gap-2">
                <h2 className="text-foreground text-base font-semibold">How it&apos;s used</h2>
                <p>
                  To operate your account (authentication, sessions, 2FA), to send transactional
                  email (magic links, invitations — nothing marketing without separate consent),
                  and to operate the escrow API you integrate with. We don&apos;t sell personal
                  data.
                </p>
              </section>

              <section className="flex flex-col gap-2">
                <h2 className="text-foreground text-base font-semibold">On-chain data</h2>
                <p>
                  Stellar is a public ledger. Any transaction an escrow contract processes —
                  amounts, wallet addresses, timing — is permanently public on-chain, independent
                  of anything ESCRA does with its own database. This policy covers data in our
                  systems, not the blockchain itself.
                </p>
              </section>

              <section className="flex flex-col gap-2">
                <h2 className="text-foreground text-base font-semibold">Your rights</h2>
                <p>
                  You can request account data deletion or export by reaching out through the
                  channels on the <a href="/contact" className="text-primary hover:underline">Contact</a>{' '}
                  page. Deleting your account removes your profile and session data; it cannot
                  remove transactions already recorded on the Stellar ledger.
                </p>
              </section>

              <section className="flex flex-col gap-2">
                <h2 className="text-foreground text-base font-semibold">Changes to this policy</h2>
                <p>
                  ESCRA is under active development. We&apos;ll update the date at the top of this
                  page when this policy changes materially.
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
