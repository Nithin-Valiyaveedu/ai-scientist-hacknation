// ── Design tokens (mirrors tailwind.config.js + index.css) ────────────────────
export const COLORS = {
  bgBase: '#F2EDE3',
  bgSurface: '#FAFAF8',
  bgHover: '#E8E3D8',
  textPrimary: '#111110',
  textSecondary: '#4A4A44',
  textMuted: '#9A9A94',
  borderSoft: 'rgba(0,0,0,0.08)',
  success: '#2D7A3A',
  successLight: '#F0FFF4',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  danger: '#C0392B',
  dangerLight: '#FFF5F5',
  chartColors: ['#111110', '#4A4A44', '#9A9A94', '#2D7A3A', '#D97706', '#C0392B', '#0F766E'],
};

export const FONT = {
  sans: 'Inter, system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
};

// Hypothesis used throughout
export const HYPOTHESIS =
  'Does CRISPR-Cas9 efficiently edit plant cell genomes via Agrobacterium-mediated transformation?';

// ── Shared UI primitives ───────────────────────────────────────────────────────

export function FlaskIcon({ size = 16, color = COLORS.textPrimary }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6M9 3v7l-5 9a1 1 0 00.9 1.5h12.2A1 1 0 0018 19l-5-9V3" />
    </svg>
  );
}

export function CheckCircle({ size = 13, color = COLORS.textMuted }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11.5 14.5 15 10" />
    </svg>
  );
}

export function SendIcon({ size = 12, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function BookOpen({ size = 14, color = COLORS.textMuted }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export function MicIcon({ size = 20, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M19 10a7 7 0 0 1-14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

// ── MacOS browser chrome wrapper ───────────────────────────────────────────────
export function BrowserChrome({ children, url = 'labprocure.app', width, height }) {
  const CHROME_H = 44;
  return (
    <div style={{
      width,
      height,
      borderRadius: 12,
      overflow: 'hidden',
      background: COLORS.bgSurface,
      boxShadow: '0 32px 80px rgba(0,0,0,0.28), 0 8px 24px rgba(0,0,0,0.14)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Title bar */}
      <div style={{
        height: CHROME_H,
        background: '#EBEBEB',
        borderBottom: '1px solid rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 8,
        flexShrink: 0,
      }}>
        {/* Traffic lights */}
        {['#FF5F57', '#FFBD2E', '#28C840'].map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
        ))}
        {/* Address bar */}
        <div style={{
          flex: 1,
          maxWidth: 420,
          margin: '0 auto',
          background: '#DCDCDC',
          borderRadius: 6,
          height: 26,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span style={{ fontFamily: FONT.sans, fontSize: 11, color: '#555', letterSpacing: 0 }}>
            {url}
          </span>
        </div>
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}

// ── Scene label + callout overlay ──────────────────────────────────────────────
export function SceneLabel({ step, label, callout, opacity }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
      {/* Bottom-left step label */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: 60,
        opacity,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          fontFamily: FONT.mono,
          fontSize: 11,
          fontWeight: 600,
          color: COLORS.textMuted,
          padding: '3px 8px',
          borderRadius: 4,
          background: 'rgba(242,237,227,0.9)',
          border: '1px solid rgba(0,0,0,0.1)',
          backdropFilter: 'blur(4px)',
        }}>
          {String(step).padStart(2, '0')}
        </div>
        <span style={{
          fontFamily: FONT.sans,
          fontSize: 13,
          fontWeight: 500,
          color: COLORS.textSecondary,
          background: 'rgba(242,237,227,0.9)',
          padding: '3px 10px',
          borderRadius: 4,
          border: '1px solid rgba(0,0,0,0.08)',
        }}>
          {label}
        </span>
      </div>
      {/* Top-right callout */}
      {callout && (
        <div style={{
          position: 'absolute',
          top: 40,
          right: 60,
          opacity,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(17,17,16,0.88)',
          color: '#fff',
          fontFamily: FONT.sans,
          fontSize: 12,
          fontWeight: 600,
          padding: '6px 14px',
          borderRadius: 20,
          letterSpacing: '-0.01em',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: '#2D7A3A' }} />
          {callout}
        </div>
      )}
    </div>
  );
}

// ── Cursor component ───────────────────────────────────────────────────────────
export function Cursor({ x, y, clicking }) {
  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: y,
      pointerEvents: 'none',
      zIndex: 200,
      transform: 'translate(-4px, -4px)',
    }}>
      {/* Click ripple */}
      {clicking && (
        <div style={{
          position: 'absolute',
          left: -16,
          top: -16,
          width: 40,
          height: 40,
          borderRadius: 20,
          border: '2px solid rgba(0,0,0,0.3)',
          animation: 'none',
        }} />
      )}
      {/* Cursor arrow */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white"
        style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }}>
        <path d="M4 2l16 10-7 1-4 7z" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ── Highlight ring ─────────────────────────────────────────────────────────────
export function HighlightRing({ x, y, width, height, opacity, radius = 8 }) {
  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      borderRadius: radius,
      border: `2px solid rgba(45,122,58,${opacity * 0.8})`,
      boxShadow: `0 0 0 4px rgba(45,122,58,${opacity * 0.15})`,
      pointerEvents: 'none',
      zIndex: 150,
    }} />
  );
}
