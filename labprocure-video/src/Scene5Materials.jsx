import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { COLORS, FONT, FlaskIcon, BrowserChrome, SceneLabel, Cursor, HighlightRing } from './shared';

const MATERIALS = [
  { name: 'Alt-R CRISPR-Cas9 Enzyme', supplier: 'IDT', sku: 'IDT-1074182', price: 380.00, qty: '1 × 500 μg' },
  { name: 'Agrobacterium tumefaciens GV3101', supplier: 'DSMZ', sku: 'DSM-5A6', price: 185.00, qty: '1 vial' },
  { name: 'Murashige & Skoog Basal Medium', supplier: 'Sigma', sku: 'M5519-10L', price: 94.50, qty: '10 L' },
  { name: 'PCR Master Mix (2×)', supplier: 'Thermo', sku: 'K0171', price: 127.00, qty: '200 rxn' },
  { name: 'Plant RNA Extraction Kit', supplier: 'Qiagen', sku: 'RNEasy-74904', price: 215.00, qty: '50 preps' },
];

function MaterialCard({ material, index, animProgress, highlighted, compareHighlight, emailHighlight }) {
  return (
    <div style={{
      background: COLORS.bgSurface,
      border: `1px solid ${highlighted ? 'rgba(45,122,58,0.4)' : COLORS.borderSoft}`,
      borderRadius: 6,
      padding: '11px 14px',
      opacity: animProgress,
      transform: `translateY(${(1 - animProgress) * 10}px)`,
      boxShadow: highlighted ? '0 0 0 3px rgba(45,122,58,0.12)' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <span style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 13, color: COLORS.textPrimary, letterSpacing: '-0.01em' }}>
          {material.name}
        </span>
        <span style={{
          fontFamily: FONT.sans, fontSize: 10, padding: '2px 7px',
          borderRadius: 4, border: `1px solid ${COLORS.borderSoft}`,
          background: COLORS.bgBase, color: COLORS.textMuted, flexShrink: 0,
        }}>
          {material.supplier}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: FONT.sans, fontSize: 11, color: COLORS.textMuted }}>SKU</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 11, fontWeight: 600, color: COLORS.textPrimary }}>{material.sku}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: FONT.sans, fontSize: 11, color: COLORS.textMuted }}>Qty</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 11, color: COLORS.textSecondary }}>{material.qty}</span>
        </span>
        <span style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginLeft: 'auto' }}>
          ${material.price.toFixed(2)}
        </span>
      </div>

      {/* Compare button */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{
          padding: '4px 10px', fontSize: 11, fontFamily: FONT.sans, fontWeight: 500,
          borderRadius: 5, cursor: 'pointer',
          background: compareHighlight ? COLORS.textPrimary : 'transparent',
          color: compareHighlight ? '#fff' : COLORS.textMuted,
          border: `1px solid ${compareHighlight ? COLORS.textPrimary : COLORS.borderSoft}`,
          letterSpacing: '-0.01em',
        }}>
          Compare suppliers
        </div>
      </div>
    </div>
  );
}

export function Scene5Materials() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const pageOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const labelOpacity = interpolate(frame, [0.4 * fps, 1.0 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Cursor moving to Email Quote button
  const cursorX = interpolate(frame, [3.2 * fps, 4.2 * fps], [300, 510], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const cursorY = interpolate(frame, [3.2 * fps, 4.2 * fps], [200, 80], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const clicking = frame > 4.4 * fps && frame < 4.8 * fps;

  // Compare highlight on card 0
  const compareHighlight = frame > 2.0 * fps && frame < 3.5 * fps;

  // Email Quote ring
  const emailRingOpacity = interpolate(frame, [4.0 * fps, 4.5 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const CHROME_W = width - 160;
  const CHROME_H = height - 120;
  const COL1 = 210;
  const COL2 = CHROME_W - COL1;

  return (
    <div style={{ width, height, background: '#D8D4CC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ opacity: pageOpacity, position: 'relative' }}>
        <BrowserChrome url="labprocure.app/plan" width={CHROME_W} height={CHROME_H}>
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
              <span style={{ fontFamily: FONT.sans, fontSize: 12, fontWeight: 600, color: COLORS.textMuted }}>Experiment Plan</span>

              {/* Tabs — Materials active */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 1, background: COLORS.bgBase, borderRadius: 6, padding: 2, border: `1px solid ${COLORS.borderSoft}` }}>
                {['Protocol', 'Budget', 'Materials', 'Timeline'].map((tab, i) => (
                  <div key={tab} style={{
                    fontFamily: FONT.sans, fontSize: 11, fontWeight: i === 2 ? 700 : 500,
                    padding: '3px 10px', borderRadius: 5,
                    background: i === 2 ? COLORS.bgSurface : 'transparent',
                    color: i === 2 ? COLORS.textPrimary : COLORS.textMuted,
                    border: i === 2 ? `1px solid ${COLORS.borderSoft}` : '1px solid transparent',
                  }}>
                    {tab}
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              {/* Sidebar (simplified) */}
              <div style={{
                width: COL1, background: COLORS.bgBase,
                borderRight: `1px solid ${COLORS.borderSoft}`,
                flexShrink: 0, padding: '8px 6px',
              }}>
                <div style={{ padding: '4px 8px', marginBottom: 4, borderBottom: `1px solid ${COLORS.borderSoft}`, paddingBottom: 8 }}>
                  <span style={{ fontFamily: FONT.sans, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: COLORS.textMuted }}>Protocol</span>
                </div>
                {['Design gRNA sequences', 'Prepare Agrobacterium', 'Infiltrate leaf discs', 'Select callus tissue', 'PCR confirmation', 'Phenotype analysis', 'Statistical reporting'].map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 6, padding: '4px 8px', borderRadius: 5,
                    background: i === 2 ? COLORS.bgHover : 'transparent',
                    marginBottom: 1,
                  }}>
                    <span style={{ fontFamily: FONT.mono, fontSize: 9, color: COLORS.textMuted, flexShrink: 0, marginTop: 2 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{ fontFamily: FONT.sans, fontSize: 11, color: i < 3 ? COLORS.textMuted : COLORS.textPrimary }}>
                      {s}
                    </span>
                  </div>
                ))}
              </div>

              {/* Materials tab content */}
              <div style={{ flex: 1, background: COLORS.bgBase, overflowY: 'hidden', padding: '14px 18px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontFamily: FONT.sans, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: COLORS.textMuted }}>
                    {MATERIALS.length} items
                  </span>
                  {/* Email Quote button */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 14px', fontSize: 12,
                    background: clicking ? '#333' : COLORS.textPrimary,
                    color: '#fff',
                    borderRadius: 6, fontFamily: FONT.sans, fontWeight: 500,
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                    transform: clicking ? 'scale(0.97)' : 'scale(1)',
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Email Quote
                  </div>
                </div>

                {/* Material cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {MATERIALS.map((m, i) => {
                    const anim = interpolate(frame, [0.1 * fps + i * 5, 0.7 * fps + i * 5], [0, 1], {
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
                    });
                    return (
                      <MaterialCard
                        key={i}
                        material={m}
                        index={i}
                        animProgress={anim}
                        highlighted={i === 0 && frame > 1.5 * fps && frame < 3.8 * fps}
                        compareHighlight={i === 0 && compareHighlight}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </BrowserChrome>

        {/* Cursor heading to Email Quote */}
        <Cursor
          x={cursorX}
          y={cursorY + 44}
          clicking={clicking}
        />

        {/* Highlight ring on Email Quote */}
        <HighlightRing
          x={CHROME_W - 160}
          y={44 + 38 + 14}
          width={130}
          height={30}
          opacity={emailRingOpacity}
          radius={6}
        />
      </div>

      <SceneLabel
        step={5}
        label="Materials & Procurement"
        callout="Auto-sourced SKUs — one-click Email Quote"
        opacity={labelOpacity}
      />
    </div>
  );
}
