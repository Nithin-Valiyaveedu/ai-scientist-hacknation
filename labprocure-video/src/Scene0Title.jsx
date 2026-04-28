import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { COLORS, FONT, FlaskIcon } from './shared';

export function Scene0Title() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Flask icon fades + scales in
  const iconProgress = interpolate(frame, [0, 0.6 * fps], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Headline fades up after icon
  const headlineProgress = interpolate(frame, [0.4 * fps, 1.2 * fps], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Sub words stagger in
  const subProgress = interpolate(frame, [1.0 * fps, 1.8 * fps], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle bottom rule
  const ruleProgress = interpolate(frame, [1.5 * fps, 2.2 * fps], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: COLORS.bgBase,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0,
    }}>
      {/* Flask + wordmark */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        opacity: iconProgress,
        transform: `scale(${0.85 + 0.15 * iconProgress})`,
        marginBottom: 36,
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: COLORS.bgSurface,
          border: `1px solid ${COLORS.borderSoft}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <FlaskIcon size={24} />
        </div>
        <span style={{
          fontFamily: FONT.sans,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: '-0.04em',
          color: COLORS.textPrimary,
        }}>
          LabProcure
        </span>
      </div>

      {/* Main headline */}
      <div style={{
        opacity: headlineProgress,
        transform: `translateY(${(1 - headlineProgress) * 18}px)`,
        textAlign: 'center',
        maxWidth: 820,
        padding: '0 60px',
      }}>
        <h1 style={{
          fontFamily: FONT.sans,
          fontWeight: 700,
          fontSize: 68,
          lineHeight: 1.08,
          letterSpacing: '-0.04em',
          color: COLORS.textPrimary,
          margin: 0,
        }}>
          Your AI copilot from{' '}
          <span style={{ color: COLORS.textMuted, fontWeight: 400 }}>
            hypothesis research,
          </span>
        </h1>
        <h1 style={{
          fontFamily: FONT.sans,
          fontWeight: 700,
          fontSize: 68,
          lineHeight: 1.08,
          letterSpacing: '-0.04em',
          color: COLORS.textPrimary,
          margin: 0,
        }}>
          protocol design{' '}
          <span style={{ color: COLORS.textMuted, fontWeight: 400 }}>and</span>{' '}
          lab procurement.
        </h1>
      </div>

      {/* Divider */}
      <div style={{
        width: ruleProgress * 280,
        height: 1,
        background: COLORS.borderSoft,
        marginTop: 36,
        marginBottom: 20,
      }} />

      {/* Tagline pills */}
      <div style={{
        display: 'flex',
        gap: 10,
        opacity: subProgress,
        transform: `translateY(${(1 - subProgress) * 10}px)`,
      }}>
        {['Literature QC', 'Protocol Generation', 'Budget Planning', 'Lab Procurement'].map((label, i) => (
          <div key={i} style={{
            fontFamily: FONT.sans,
            fontSize: 12,
            fontWeight: 500,
            padding: '5px 14px',
            borderRadius: 20,
            background: COLORS.bgSurface,
            border: `1px solid ${COLORS.borderSoft}`,
            color: COLORS.textSecondary,
            letterSpacing: '-0.01em',
          }}>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
