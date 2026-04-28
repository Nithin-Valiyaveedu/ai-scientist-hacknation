import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { COLORS, FONT, FlaskIcon, BrowserChrome, SceneLabel, Cursor, HighlightRing, HYPOTHESIS } from './shared';

// Typewriter — slices string based on frame
function useTypewriter(text, startFrame, charsPerFrame = 2) {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const chars = Math.min(text.length, Math.floor(elapsed * charsPerFrame));
  return text.slice(0, chars);
}

function InputPageUI({ typed, showButton, buttonHighlight }) {
  const wordCount = typed.trim().length > 0 ? typed.trim().split(/\s+/).length : 0;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: COLORS.bgBase,
    }}>
      {/* Nav */}
      <div style={{
        borderBottom: `1px solid ${COLORS.borderSoft}`,
        background: COLORS.bgSurface,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FlaskIcon size={14} />
          <span style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 13, letterSpacing: '-0.02em' }}>
            LabProcure
          </span>
        </div>
        <span style={{
          fontFamily: FONT.mono, fontSize: 10, padding: '2px 8px',
          borderRadius: 4, background: COLORS.bgBase,
          border: `1px solid ${COLORS.borderSoft}`, color: COLORS.textMuted,
        }}>v1.0</span>
      </div>

      {/* Main */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 540, display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Heading */}
          <div>
            <h1 style={{
              fontFamily: FONT.sans, fontWeight: 700, fontSize: 42,
              lineHeight: 1.12, letterSpacing: '-0.03em', color: COLORS.textPrimary, margin: 0,
            }}>
              Agentic Lab Procurement<br />
              <span style={{ color: COLORS.textMuted, fontWeight: 400 }}>for Scientists</span>
            </h1>
            <p style={{
              fontFamily: FONT.sans, fontSize: 13, lineHeight: 1.65,
              color: COLORS.textMuted, marginTop: 10, maxWidth: 420,
            }}>
              AI-powered platform to automate workflows from protocol design to lab procurement.
            </p>
          </div>

          {/* Input box */}
          <div style={{
            background: COLORS.bgSurface,
            border: `1px solid ${COLORS.borderSoft}`,
            borderRadius: 8,
          }}>
            {/* Textarea area */}
            <div style={{
              minHeight: 110, padding: '14px 16px 10px',
              fontFamily: FONT.sans, fontSize: 15,
              color: typed ? COLORS.textPrimary : COLORS.textMuted,
              lineHeight: 1.65, letterSpacing: '-0.01em',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {typed || 'Describe your hypothesis…'}
              {/* Blinking cursor */}
              <span style={{
                display: 'inline-block', width: 2, height: 16,
                background: COLORS.textPrimary, marginLeft: 1,
                verticalAlign: 'middle',
              }} />
            </div>

            {/* Footer bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px 10px',
              borderTop: `1px solid ${COLORS.borderSoft}`,
            }}>
              <span style={{ fontFamily: FONT.sans, fontSize: 12, color: COLORS.textMuted }}>
                {wordCount > 0 ? (
                  <><strong style={{ color: COLORS.textSecondary }}>{wordCount}</strong> words</>
                ) : 'Intervention · outcome · threshold'}
              </span>
              <div style={{
                padding: '6px 16px', fontSize: 13,
                background: showButton ? COLORS.textPrimary : 'rgba(0,0,0,0.2)',
                color: '#fff',
                borderRadius: 6,
                fontFamily: FONT.sans, fontWeight: 500,
                letterSpacing: '-0.01em',
                border: buttonHighlight ? '2px solid rgba(45,122,58,0.6)' : '2px solid transparent',
                transition: 'none',
              }}>
                Analyse →
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Scene1Input() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Page fades in
  const pageOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Start typing at frame 10, ~2.5 chars/frame → finish ~1.8s
  const typed = useTypewriter(HYPOTHESIS, 10, 2.5);
  const typingDone = typed.length >= HYPOTHESIS.length;

  // Button appears once typing is done
  const showButton = typingDone;

  // Cursor moves toward button
  const cursorX = interpolate(frame, [2.2 * fps, 3.0 * fps], [280, 434], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const cursorY = interpolate(frame, [2.2 * fps, 3.0 * fps], [240, 280], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const clicking = frame > 3.2 * fps && frame < 3.6 * fps;

  // Highlight ring on button
  const ringOpacity = interpolate(frame, [2.8 * fps, 3.2 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Label fades in
  const labelOpacity = interpolate(frame, [0.5 * fps, 1.2 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Chrome dimensions (centered with padding)
  const CHROME_W = width - 160;
  const CHROME_H = height - 120;

  return (
    <div style={{ width, height, background: '#D8D4CC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ opacity: pageOpacity, position: 'relative' }}>
        <BrowserChrome url="labprocure.app" width={CHROME_W} height={CHROME_H}>
          <InputPageUI
            typed={typed}
            showButton={showButton}
            buttonHighlight={clicking}
          />
        </BrowserChrome>

        {/* Cursor over chrome */}
        <Cursor
          x={cursorX + (CHROME_W / 2 - 270)}
          y={cursorY + 44}
          clicking={clicking}
        />

        {/* Highlight ring around Analyse button */}
        <HighlightRing
          x={(CHROME_W - 160) / 2 + 220}
          y={CHROME_H * 0.52}
          width={110}
          height={34}
          opacity={ringOpacity}
          radius={6}
        />
      </div>

      <SceneLabel
        step={1}
        label="Input"
        callout="Describe your hypothesis"
        opacity={labelOpacity}
      />
    </div>
  );
}
