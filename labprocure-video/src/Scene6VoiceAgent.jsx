import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { COLORS, FONT, FlaskIcon, MicIcon, SceneLabel } from './shared';

const SPOKEN_Q = 'What reagents are most critical for CRISPR efficiency in plants?';
const SPOKEN_A = 'The guide RNA design and Cas9 purity are the most critical factors. High-fidelity Cas9 from IDT paired with chemically synthesised crRNA:tracrRNA duplexes consistently yields >80% editing efficiency in tobacco leaf discs according to the retrieved literature.';

// Waveform bars — animated using frame
function Waveform({ frame, fps, active, barCount = 32 }) {
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Each bar oscillates with a unique phase
    const phase = (i / barCount) * Math.PI * 2;
    const speed = 0.08 + (i % 5) * 0.015;
    const amplitude = active ? (0.3 + 0.5 * Math.abs(Math.sin(i * 0.7))) : 0.08;
    const height = amplitude * (0.5 + 0.5 * Math.sin(frame * speed + phase));
    return Math.max(0.04, height);
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 60 }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: 4,
          height: `${h * 100}%`,
          borderRadius: 2,
          background: active ? `rgba(45,122,58,${0.5 + h * 0.8})` : `rgba(154,154,148,${0.3 + h * 0.4})`,
        }} />
      ))}
    </div>
  );
}

// Typewriter for agent reply
function useTypewriter(text, startFrame, fps, charsPerFrame = 3) {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const chars = Math.min(text.length, Math.floor(elapsed * charsPerFrame));
  return text.slice(0, chars);
}

export function Scene6VoiceAgent() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Overall fade in
  const fadeIn = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Mic button pulse ring
  const pulseScale = interpolate(
    frame % (1.2 * fps),
    [0, 0.6 * fps, 1.2 * fps],
    [1, 1.4, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const pulseOpacity = interpolate(
    frame % (1.2 * fps),
    [0, 0.3 * fps, 0.9 * fps],
    [0.6, 0, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Question text types in
  const questionOpacity = interpolate(frame, [0.4 * fps, 0.8 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Agent "thinking" dots appear then reply types
  const agentTypingStart = 1.2 * fps;
  const typedReply = useTypewriter(SPOKEN_A, agentTypingStart, fps, 2.8);

  const replyOpacity = interpolate(frame, [agentTypingStart, agentTypingStart + 0.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const labelOpacity = interpolate(frame, [0.4 * fps, 1.0 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const isAgentSpeaking = frame > agentTypingStart;

  return (
    <div style={{
      width,
      height,
      background: COLORS.bgBase,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: fadeIn,
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 48, background: COLORS.bgSurface,
        borderBottom: `1px solid ${COLORS.borderSoft}`,
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 10,
      }}>
        <FlaskIcon size={14} />
        <span style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 13, letterSpacing: '-0.02em' }}>LabProcure</span>
        <span style={{ fontFamily: FONT.sans, fontSize: 13, color: COLORS.textMuted }}>·</span>
        <span style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: 600, color: COLORS.textMuted }}>Voice Agent</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS.success }} />
          <span style={{ fontFamily: FONT.sans, fontSize: 12, color: COLORS.success, fontWeight: 600 }}>Live</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 36,
        maxWidth: 740,
        width: '100%',
        padding: '0 60px',
        marginTop: 20,
      }}>
        {/* Mic button with pulse */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Pulse ring */}
          <div style={{
            position: 'absolute',
            width: 96,
            height: 96,
            borderRadius: 48,
            border: '2px solid rgba(45,122,58,0.6)',
            transform: `scale(${pulseScale})`,
            opacity: pulseOpacity,
          }} />
          <div style={{
            position: 'absolute',
            width: 80,
            height: 80,
            borderRadius: 40,
            border: '2px solid rgba(45,122,58,0.3)',
            transform: `scale(${1 + (pulseScale - 1) * 0.5})`,
            opacity: pulseOpacity * 0.7,
          }} />
          {/* Mic button */}
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            background: COLORS.textPrimary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}>
            <MicIcon size={22} color="#fff" />
          </div>
        </div>

        {/* Waveform */}
        <Waveform frame={frame} fps={fps} active={true} barCount={40} />

        {/* Conversation */}
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          {/* User question */}
          <div style={{ opacity: questionOpacity, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              maxWidth: '78%',
              padding: '12px 16px',
              borderRadius: 12,
              background: COLORS.textPrimary,
              color: '#fff',
              fontFamily: FONT.sans,
              fontSize: 14,
              lineHeight: 1.55,
              letterSpacing: '-0.01em',
            }}>
              {SPOKEN_Q}
            </div>
          </div>

          {/* Agent reply */}
          <div style={{ opacity: replyOpacity, display: 'flex', justifyContent: 'flex-start', gap: 12 }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: COLORS.bgSurface, border: `1px solid ${COLORS.borderSoft}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FlaskIcon size={14} />
            </div>
            <div style={{
              maxWidth: '82%',
              padding: '12px 16px',
              borderRadius: 12,
              background: COLORS.bgSurface,
              border: `1px solid ${COLORS.borderSoft}`,
              fontFamily: FONT.sans,
              fontSize: 13,
              lineHeight: 1.65,
              color: COLORS.textPrimary,
              letterSpacing: '-0.01em',
            }}>
              {typedReply}
              {/* Blinking cursor while typing */}
              {typedReply.length < SPOKEN_A.length && (
                <span style={{
                  display: 'inline-block', width: 2, height: 13,
                  background: COLORS.textMuted, marginLeft: 2, verticalAlign: 'middle',
                }} />
              )}
            </div>
          </div>
        </div>

        {/* Context badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 20,
          background: COLORS.bgSurface, border: `1px solid ${COLORS.borderSoft}`,
          opacity: questionOpacity,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: COLORS.textMuted }} />
          <span style={{ fontFamily: FONT.sans, fontSize: 11, color: COLORS.textMuted }}>
            Context: 6 papers · CRISPR-Cas9 plant editing
          </span>
        </div>
      </div>

      <SceneLabel
        step={6}
        label="Voice Agent"
        callout="Ask questions about your studies"
        opacity={labelOpacity}
      />
    </div>
  );
}
