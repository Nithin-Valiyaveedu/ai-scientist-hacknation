import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { COLORS, FONT, FlaskIcon, BrowserChrome, SceneLabel, HighlightRing, HYPOTHESIS } from './shared';

const STEPS = [
  'Design gRNA targeting sequences',
  'Prepare Agrobacterium cultures',
  'Infiltrate plant leaf discs',
  'Select transformed callus tissue',
  'PCR-confirm genomic edits',
  'Phenotype analysis & imaging',
  'Statistical validation & reporting',
];

const BUDGET = [
  { item: 'CRISPR reagents & gRNA synthesis', cost: 840, color: '#111110' },
  { item: 'Agrobacterium media & cultures', cost: 320, color: '#4A4A44' },
  { item: 'Plant tissue & growth media', cost: 215, color: '#9A9A94' },
  { item: 'PCR kits & sequencing', cost: 480, color: '#2D7A3A' },
  { item: 'Lab consumables', cost: 165, color: '#D97706' },
  { item: 'Overhead (22%)', cost: 444, color: '#C0392B' },
];

const TOTAL = BUDGET.reduce((s, b) => s + b.cost, 0);

function PieChartSVG({ progress }) {
  const cx = 80, cy = 80, r = 55, innerR = 32;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;

  const segments = BUDGET.map((b) => {
    const fraction = b.cost / TOTAL;
    const start = cumulative;
    cumulative += fraction;
    return { ...b, fraction, start };
  });

  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      {segments.map((seg, i) => {
        const startAngle = seg.start * 2 * Math.PI - Math.PI / 2;
        const endAngle = (seg.start + seg.fraction) * 2 * Math.PI - Math.PI / 2;
        const segLen = seg.fraction * circumference;
        const animatedSegLen = segLen * progress;

        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const largeArc = seg.fraction > 0.5 ? 1 : 0;

        // Animated arc using stroke-dasharray
        const dashOffset = circumference - animatedSegLen;

        return (
          <circle
            key={i}
            r={r}
            cx={cx}
            cy={cy}
            fill="none"
            stroke={seg.color}
            strokeWidth={18}
            strokeDasharray={`${segLen} ${circumference}`}
            strokeDashoffset={circumference * (1 - progress) + (circumference - segLen) * progress}
            transform={`rotate(${seg.start * 360 - 90} ${cx} ${cy})`}
            style={{ opacity: progress > 0.05 ? 1 : 0 }}
          />
        );
      })}
      {/* Donut hole */}
      <circle cx={cx} cy={cy} r={innerR} fill={COLORS.bgSurface} />
      {/* Center text */}
      <text x={cx} y={cy - 6} textAnchor="middle"
        style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 700, fill: COLORS.textPrimary }}>
        ${TOTAL.toLocaleString()}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle"
        style={{ fontFamily: FONT.sans, fontSize: 8, fill: COLORS.textMuted }}>
        TOTAL
      </text>
    </svg>
  );
}

function ProtocolSidebar({ activeStep }) {
  return (
    <div style={{
      background: COLORS.bgBase, borderRight: `1px solid ${COLORS.borderSoft}`,
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 10px', borderBottom: `1px solid ${COLORS.borderSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: FONT.sans, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: COLORS.textMuted }}>
          Protocol
        </span>
        <span style={{ fontFamily: FONT.mono, fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: COLORS.bgSurface, border: `1px solid ${COLORS.borderSoft}`, color: COLORS.textMuted }}>
          {STEPS.length}
        </span>
      </div>
      <div style={{ flex: 1, padding: '4px 6px', overflowY: 'hidden' }}>
        {STEPS.map((step, i) => {
          const isDone = i < activeStep;
          const isActive = i === activeStep;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 7,
              padding: '5px 8px', borderRadius: 6, marginBottom: 1,
              background: isActive ? COLORS.bgHover : 'transparent',
            }}>
              <span style={{ color: isDone ? COLORS.success : isActive ? COLORS.textPrimary : COLORS.textMuted, flexShrink: 0, marginTop: 2 }}>
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="9 12 11.5 14.5 15 10" />
                  </svg>
                ) : (
                  <span style={{ fontFamily: FONT.mono, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 12, height: 12 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                )}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  fontFamily: FONT.sans, fontSize: 12, fontWeight: isActive ? 600 : 400,
                  color: isDone ? COLORS.textMuted : COLORS.textPrimary,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  letterSpacing: '-0.01em',
                }}>{step}</span>
                <span style={{ fontFamily: FONT.sans, fontSize: 10, color: COLORS.textMuted }}>Step {i + 1}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BudgetTab({ chartProgress, listProgress }) {
  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stat pills */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Total Budget', value: `$${TOTAL.toLocaleString()}` },
          { label: 'Line Items', value: BUDGET.length },
          { label: 'Largest Cost', value: '$840.00' },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: COLORS.bgSurface, border: `1px solid ${COLORS.borderSoft}`,
            borderRadius: 6, padding: '10px 12px',
          }}>
            <p style={{ fontFamily: FONT.sans, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: COLORS.textMuted, marginBottom: 4 }}>
              {label}
            </p>
            <p style={{ fontFamily: FONT.mono, fontSize: 14, fontWeight: 700, color: COLORS.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart + legend */}
      <div style={{
        background: COLORS.bgSurface, border: `1px solid ${COLORS.borderSoft}`,
        borderRadius: 6, padding: '12px 14px',
      }}>
        <p style={{ fontFamily: FONT.sans, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: COLORS.textMuted, marginBottom: 10 }}>
          Cost Breakdown
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <PieChartSVG progress={chartProgress} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {BUDGET.map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: row.color, flexShrink: 0 }} />
                <span style={{ fontFamily: FONT.sans, fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: COLORS.textSecondary }}>
                  {row.item}
                </span>
                <span style={{ fontFamily: FONT.mono, fontSize: 10, color: COLORS.textMuted, flexShrink: 0 }}>
                  {((row.cost / TOTAL) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Line items */}
      <div style={{
        background: COLORS.bgSurface, border: `1px solid ${COLORS.borderSoft}`,
        borderRadius: 6, overflow: 'hidden',
        opacity: listProgress,
      }}>
        <div style={{ padding: '6px 12px', borderBottom: `1px solid ${COLORS.borderSoft}`, background: COLORS.bgBase, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: FONT.sans, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: COLORS.textMuted }}>Line Items</span>
        </div>
        {BUDGET.map((row, i) => {
          const pct = (row.cost / TOTAL) * 100;
          return (
            <div key={i} style={{ padding: '8px 12px', borderBottom: i < BUDGET.length - 1 ? `1px solid ${COLORS.borderSoft}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 5, height: 5, borderRadius: 1, background: row.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: FONT.sans, fontSize: 12, color: COLORS.textPrimary, letterSpacing: '-0.01em' }}>{row.item}</span>
                </div>
                <span style={{ fontFamily: FONT.mono, fontSize: 12, fontWeight: 600, color: COLORS.textPrimary }}>${row.cost.toFixed(2)}</span>
              </div>
              <div style={{ height: 2, background: COLORS.borderSoft, borderRadius: 1, overflow: 'hidden', marginLeft: 12 }}>
                <div style={{ height: '100%', width: `${pct * listProgress}%`, background: row.color }} />
              </div>
            </div>
          );
        })}
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${COLORS.borderSoft}`, background: COLORS.bgBase, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 12, color: COLORS.textPrimary }}>Total</span>
          <span style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}>${TOTAL.toLocaleString()}.00</span>
        </div>
      </div>
    </div>
  );
}

export function Scene4PlanBudget() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const pageOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const chartProgress = interpolate(frame, [0.5 * fps, 2.0 * fps], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const listProgress = interpolate(frame, [1.8 * fps, 3.0 * fps], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const labelOpacity = interpolate(frame, [0.4 * fps, 1.0 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Ring on total budget pill
  const ringOpacity = interpolate(frame, [0.4 * fps, 1.0 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ringFade = interpolate(frame, [3.5 * fps, 4.5 * fps], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const CHROME_W = width - 160;
  const CHROME_H = height - 120;
  const COL1 = 210;
  const COL2 = CHROME_W - COL1;

  // Active step scrolls: 0→4 over the scene
  const activeStep = Math.floor(interpolate(frame, [0, 4 * fps], [0, 4], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  }));

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

              {/* Tabs */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 1, background: COLORS.bgBase, borderRadius: 6, padding: 2, border: `1px solid ${COLORS.borderSoft}` }}>
                {['Protocol', 'Budget', 'Materials', 'Timeline'].map((tab, i) => (
                  <div key={tab} style={{
                    fontFamily: FONT.sans, fontSize: 11, fontWeight: i === 1 ? 700 : 500,
                    padding: '3px 10px', borderRadius: 5, cursor: 'pointer',
                    background: i === 1 ? COLORS.bgSurface : 'transparent',
                    color: i === 1 ? COLORS.textPrimary : COLORS.textMuted,
                    border: i === 1 ? `1px solid ${COLORS.borderSoft}` : '1px solid transparent',
                  }}>
                    {tab}
                  </div>
                ))}
              </div>
            </div>

            {/* 2 columns */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              <div style={{ width: COL1, flexShrink: 0 }}>
                <ProtocolSidebar activeStep={activeStep} />
              </div>
              <div style={{ width: COL2, overflowY: 'hidden', background: COLORS.bgBase }}>
                <BudgetTab chartProgress={chartProgress} listProgress={listProgress} />
              </div>
            </div>
          </div>
        </BrowserChrome>

        {/* Ring on "Total Budget" stat */}
        <HighlightRing
          x={COL1 + 34}
          y={44 + 38 + 18}
          width={148}
          height={58}
          opacity={ringOpacity * ringFade}
          radius={6}
        />
      </div>

      <SceneLabel
        step={4}
        label="Protocol & Budget"
        callout={`Full budget · $${TOTAL.toLocaleString()} total`}
        opacity={labelOpacity}
      />
    </div>
  );
}
