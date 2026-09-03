import { ImageResponse } from 'next/og';

// No `runtime = 'edge'` — this image never varies per request, so it
// should render once at build time like every other static route here, not
// disable static generation to run per-request on the edge for no reason.
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '80px',
          background: '#08090c',
          backgroundImage:
            'radial-gradient(60% 50% at 30% 0%, rgba(59,130,246,0.18), transparent)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div
            style={{
              display: 'flex',
              width: 56,
              height: 56,
              borderRadius: 12,
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.4)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Same mark as components/marketing/logo.tsx and app/icon.tsx — not a stand-in. */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"
                stroke="#60a5fa"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M12 12 3 7m9 5 9-5m-9 5v10"
                stroke="#60a5fa"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ display: 'flex', color: '#fff', fontSize: 40, fontWeight: 700 }}>
            ESCRA
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            color: '#fff',
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: 980,
          }}
        >
          Universal escrow protocol on Stellar
        </div>
        <div
          style={{
            display: 'flex',
            color: '#9ca3af',
            fontSize: 28,
            marginTop: 24,
            maxWidth: 900,
          }}
        >
          Freelance, ecommerce, rentals, and logistics — one API, non-custodial by design.
        </div>
      </div>
    ),
    { ...size },
  );
}
