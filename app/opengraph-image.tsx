import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 45%, #fed7aa 100%)',
          padding: '56px',
          color: '#111827',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: 40,
            fontWeight: 700,
            color: '#ea580c',
          }}
        >
          <span>PixPaw AI</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.08 }}>
            Turn Pet Photos Into Stunning AI Art
          </div>
          <div style={{ fontSize: 34, color: '#374151' }}>
            Custom portraits, gifts, and memorial keepsakes in seconds.
          </div>
        </div>

        <div style={{ fontSize: 30, color: '#ea580c', fontWeight: 600 }}>pixpawai.com</div>
      </div>
    ),
    size
  );
}
