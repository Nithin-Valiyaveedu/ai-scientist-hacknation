import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { COLORS, FONT, FlaskIcon, BookOpen, CheckCircle, BrowserChrome, SceneLabel, HighlightRing, HYPOTHESIS } from './shared';

const PAPERS = [
  { title: 'CRISPR-Cas9-mediated genome editing in plant cells', year: '2023', venue: 'Nature Plants', citations: 1842 },
  { title: 'Agrobacterium T-DNA delivery mechanisms in dicots', year: '2022', venue: 'Plant Cell', citations: 967 },
  { title: 'Off-target analysis of Cas9 in Arabidopsis thaliana', year: '2023', venue: 'PNAS', citations: 543 },
  { title: 'Stable transformation efficiency in monocot species', year: '2021', venue: 'Plant Biotech J.', citations: 388 },
  { title: 'Guide RNA design for plant genome editing', year: '2024', venue: 'Cell Reports', citations: 214 },
  { title: 'Callus regeneration post-Agrobacterium infection', year: '2022', venue: 'J. Exp. Botany', citations: 172 },
];

const CHAT_MESSAGES = [
  { role: 'user', text: 'How novel is this hypothesis vs. existing work?' },
  { role: 'agent', text: 'While CRISPR-Cas9 plant editing is well-studied, your specific combination of Agrobacterium delivery with efficiency quantification across a broad range of plant cell types represents a **gap in the literature**. Most studies focus on model organisms like Arabidopsis rather than comparative efficiency metrics.' },
];

function PaperItem({ paper, index, isSelected, animProgress }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 7,
      padding: '5px 8px', borderRadius: 6,
      background: isSelected ? COLORS.bgHover : 'transparent',
      cursor: 'pointer',
      opacity: animProgress,
      transform: `translateX(${(1 - animProgress) * -8}px)`,
    }}>
      <CheckCircle size={11} color={COLORS.textMuted} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: FONT.sans, fontSize: 12, fontWeight: 500,
          color: COLORS.textPrimary, letterSpacing: '-0.01em',
          margin: 0, lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>{paper.title}</p>
        <span style={{ fontFamily: FONT.sans, fontSize: 10, color: COLORS.textMuted }}>
          {paper.year} · {paper.venue} · +{paper.citations.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function QCContent({ noveltyProgress, chatProgress }) {
  return (
    <div style={{ flex: 1, overflowY: 'hidden', padding: '20px 24px' }}>
      {/* Hypothesis bubble */}
      <div style={{
        background: '#fff', border: `1px solid ${COLORS.borderSoft}`,
        borderRadius: 6, padding: '10px 14px', marginBottom: 14,
      }}>
        <p style={{ fontFamily: FONT.sans, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: COLORS.textMuted, marginBottom: 5 }}>
          Hypothesis
        </p>
        <p style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: COLORS.textPrimary, letterSpacing: '-0.01em', margin: 0 }}>
          "{HYPOTHESIS}"
        </p>
      </div>

      {/* Agent + Novelty badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 4, flexShrink: 0,
          background: COLORS.bgBase, border: `1px solid ${COLORS.borderSoft}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FlaskIcon size={11} />
        </div>
        <div>
          <p style={{ fontFamily: FONT.sans, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: COLORS.textMuted, marginBottom: 7 }}>
            Literature QC
          </p>

          {/* Novelty badge - the hero element */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '7px 14px', borderRadius: 6,
            background: '#F0FFF4', border: '1px solid rgba(45,122,58,0.2)',
            marginBottom: 10,
            opacity: noveltyProgress,
            transform: `scale(${0.9 + 0.1 * noveltyProgress})`,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2D7A3A', flexShrink: 0 }} />
            <span style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: 700, color: '#2D7A3A', letterSpacing: '-0.01em' }}>
              Novel — No Prior Protocol Found
            </span>
          </div>

          <p style={{ fontFamily: FONT.sans, fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6, margin: 0, maxWidth: 480 }}>
            No existing protocols match this hypothesis. This appears to be unexplored territory — proceed with confidence.
          </p>
        </div>
      </div>

      {/* Chat messages below */}
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10, opacity: chatProgress }}>
        {CHAT_MESSAGES.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '88%', padding: '8px 12px', borderRadius: 6, fontSize: 12,
              background: m.role === 'user' ? COLORS.textPrimary : COLORS.bgBase,
              color: m.role === 'user' ? '#fff' : COLORS.textPrimary,
              border: m.role === 'user' ? 'none' : `1px solid ${COLORS.borderSoft}`,
              fontFamily: FONT.sans, lineHeight: 1.6, letterSpacing: '-0.01em',
            }}>
              {m.text.split('**').map((part, j) => j % 2 === 1
                ? <strong key={j}>{part}</strong>
                : part
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LitChatPane({ visible }) {
  return (
    <div style={{
      background: '#fff', borderLeft: `1px solid ${COLORS.borderSoft}`,
      display: 'flex', flexDirection: 'column', height: '100%',
      opacity: visible ? 1 : 0,
    }}>
      {/* Chrome bar */}
      <div style={{
        borderBottom: `1px solid ${COLORS.borderSoft}`,
        background: COLORS.bgSurface, flexShrink: 0,
      }}>
        <div style={{
          padding: '6px 12px 0',
          borderBottom: `1px solid ${COLORS.borderSoft}`,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: FONT.sans, fontSize: 11, fontWeight: 500,
            color: COLORS.textPrimary, padding: '5px 14px',
            borderRadius: '5px 5px 0 0',
            background: '#fff',
            border: `1px solid ${COLORS.borderSoft}`,
            borderBottom: '1px solid #fff',
            marginBottom: -1,
          }}>
            <BookOpen size={10} />
            Literature Q&A
          </div>
        </div>
        <div style={{ padding: '5px 10px' }}>
          <div style={{
            background: COLORS.bgBase, borderRadius: 5, height: 22,
            display: 'flex', alignItems: 'center', padding: '0 8px',
            fontFamily: FONT.mono, fontSize: 10, color: COLORS.textMuted,
          }}>
            labagent://literature-qa
          </div>
        </div>
      </div>

      {/* Suggestion chips */}
      <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontFamily: FONT.sans, fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginBottom: 4 }}>
          Ask questions about the retrieved papers
        </p>
        {[
          'What are the key findings?',
          'How novel is this hypothesis?',
          'What gaps exist in the literature?',
        ].map((s, i) => (
          <div key={i} style={{
            fontFamily: FONT.sans, fontSize: 11, padding: '7px 10px',
            borderRadius: 6, background: COLORS.bgSurface,
            border: `1px solid ${COLORS.borderSoft}`, color: COLORS.textSecondary,
          }}>
            {s}
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding: '8px 10px', borderTop: `1px solid ${COLORS.borderSoft}`,
        display: 'flex', gap: 7, background: '#fff', flexShrink: 0,
      }}>
        <div style={{
          flex: 1, padding: '6px 10px', borderRadius: 6,
          border: `1px solid ${COLORS.borderSoft}`, background: COLORS.bgBase,
          fontFamily: FONT.sans, fontSize: 12, color: COLORS.textMuted,
        }}>
          Ask about these papers…
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: 5, background: COLORS.bgBase,
          border: `1px solid ${COLORS.borderSoft}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function Scene2LitQC() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const pageOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const noveltyProgress = interpolate(frame, [0.6 * fps, 1.2 * fps], [0, 1], {
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const chatProgress = interpolate(frame, [2.0 * fps, 2.8 * fps], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const labelOpacity = interpolate(frame, [0.4 * fps, 1.0 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Highlight ring around novelty badge
  const ringOpacity = interpolate(frame, [0.8 * fps, 1.4 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ringFade = interpolate(frame, [2.5 * fps, 3.0 * fps], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const CHROME_W = width - 160;
  const CHROME_H = height - 120;

  // 3-column layout: 240 | 1fr | 280
  const COL1 = 220;
  const COL3 = 270;
  const COL2 = CHROME_W - COL1 - COL3;

  return (
    <div style={{ width, height, background: '#D8D4CC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ opacity: pageOpacity, position: 'relative' }}>
        <BrowserChrome url="labprocure.app/qc" width={CHROME_W} height={CHROME_H}>
          {/* Inner flex: nav + 3 cols */}
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Nav */}
            <div style={{
              height: 38, background: COLORS.bgSurface,
              borderBottom: `1px solid ${COLORS.borderSoft}`,
              display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, flexShrink: 0,
            }}>
              <FlaskIcon size={12} />
              <span style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 12, letterSpacing: '-0.02em' }}>LabProcure</span>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              <span style={{ fontFamily: FONT.sans, fontSize: 12, fontWeight: 600, color: COLORS.textMuted }}>Literature QC</span>
            </div>

            {/* 3 columns */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              {/* COL 1 — Papers sidebar */}
              <div style={{
                width: COL1, background: COLORS.bgBase,
                borderRight: `1px solid ${COLORS.borderSoft}`,
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}>
                <div style={{
                  padding: '8px 10px', borderBottom: `1px solid ${COLORS.borderSoft}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontFamily: FONT.sans, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: COLORS.textMuted }}>Papers</span>
                  <span style={{ fontFamily: FONT.mono, fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: COLORS.bgSurface, border: `1px solid ${COLORS.borderSoft}`, color: COLORS.textMuted }}>6</span>
                </div>
                <div style={{ flex: 1, overflowY: 'hidden', padding: 4 }}>
                  {PAPERS.map((p, i) => {
                    const pAnim = interpolate(frame, [0.2 * fps + i * 4, 0.8 * fps + i * 4], [0, 1], {
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
                    });
                    return <PaperItem key={i} paper={p} index={i} isSelected={i === 0} animProgress={pAnim} />;
                  })}
                </div>
              </div>

              {/* COL 2 — QC content */}
              <div style={{
                width: COL2, background: COLORS.bgSurface,
                borderRight: `1px solid ${COLORS.borderSoft}`,
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                position: 'relative',
              }}>
                <QCContent noveltyProgress={noveltyProgress} chatProgress={chatProgress} />

                {/* Proceed bar */}
                <div style={{
                  padding: '10px 20px', borderTop: `1px solid ${COLORS.borderSoft}`,
                  background: COLORS.bgSurface, display: 'flex', alignItems: 'center',
                  gap: 10, flexShrink: 0,
                }}>
                  <p style={{ fontFamily: FONT.sans, fontSize: 11, color: COLORS.textMuted, flex: 1 }}>
                    Plan generation may take up to a minute.
                  </p>
                  <div style={{
                    padding: '6px 16px', fontSize: 12,
                    background: COLORS.textPrimary, color: '#fff',
                    borderRadius: 6, fontFamily: FONT.sans, fontWeight: 500,
                  }}>
                    Proceed to Plan →
                  </div>
                </div>
              </div>

              {/* COL 3 — Lit chat */}
              <div style={{ width: COL3, overflow: 'hidden' }}>
                <LitChatPane visible={true} />
              </div>
            </div>
          </div>
        </BrowserChrome>

        {/* Highlight ring on novelty badge */}
        <HighlightRing
          x={COL1 + 86}
          y={44 + 38 + 112}
          width={280}
          height={32}
          opacity={ringOpacity * ringFade}
          radius={6}
        />
      </div>

      <SceneLabel
        step={2}
        label="Literature QC"
        callout="Novel — no prior protocol found"
        opacity={labelOpacity}
      />
    </div>
  );
}
