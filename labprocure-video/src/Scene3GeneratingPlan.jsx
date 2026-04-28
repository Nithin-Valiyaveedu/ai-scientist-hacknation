import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { COLORS, FONT, FlaskIcon, SceneLabel } from './shared';

const STAGES = [
  'Reviewing literature context…',
  'Designing experimental steps…',
  'Sourcing materials and reagents…',
  'Compiling budget estimates…',
  'Finalising protocol plan…',
];

export function Scene3GeneratingPlan() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Duration: 2s = 60 frames at 30fps
  // Progress goes 20% → 87% over the scene
  const progress = interpolate(frame, [0, 1.8 * fps], [20, 87], {
    easing: Easing.bezier(0.45, 0, 0.55, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const stageIndex = Math.min(
    STAGES.length - 1,
    Math.floor((progress - 20) / ((87 - 20) / STAGES.length))
  );

  // Flask rotates continuously
  const rotation = interpolate(frame, [0, fps], [0, 360], {
    extrapolateRight: 'extend',
  }) % 360;

  // Overall fade in
  const fadeIn = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const labelOpacity = interpolate(frame, [0.3 * fps, 0.8 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <div style={{
      width,
      height,
      background: 'rgba(242,237,227,0.97)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 32,
      opacity: fadeIn,
    }}>
      {/* Rotating flask */}
      <div style={{
        transform: `rotate(${rotation}deg)`,
        color: COLORS.textPrimary,
      }}>
        <FlaskIcon size={52} />
      </div>

      {/* Text block */}
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <h2 style={{
          fontFamily: FONT.sans,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: '-0.03em',
          color: COLORS.textPrimary,
          marginBottom: 10,
        }}>
          Generating Experiment Plan
        </h2>
        <p style={{
          fontFamily: FONT.sans,
          fontSize: 13,
          color: COLORS.textMuted,
          minHeight: 22,
          letterSpacing: '-0.01em',
        }}>
          {STAGES[stageIndex]}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          height: 3,
          background: COLORS.borderSoft,
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: COLORS.textPrimary,
            borderRadius: 2,
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: FONT.sans, fontSize: 11, color: COLORS.textMuted }}>
            Typically 30–60 seconds
          </span>
          <span style={{
            fontFamily: FONT.mono,
            fontSize: 11,
            fontWeight: 700,
            color: COLORS.textPrimary,
          }}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <SceneLabel
        step={3}
        label="Plan Generation"
        callout="AI-powered protocol synthesis"
        opacity={labelOpacity}
      />
    </div>
  );
}
