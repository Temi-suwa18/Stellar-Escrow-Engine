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
              color: '#60a5fa',
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            $
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
