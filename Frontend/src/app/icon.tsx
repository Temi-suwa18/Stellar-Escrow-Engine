import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Matches components/marketing/logo.tsx's mark exactly (same viewBox/paths)
// rather than a simplified stand-in, so the browser tab icon is actually
// the site's real logo.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0f19',
          borderRadius: 7,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"
            stroke="#3b82f6"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M12 12 3 7m9 5 9-5m-9 5v10"
            stroke="#3b82f6"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
