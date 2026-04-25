import { useState } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import InlineEdit from '../components/InlineEdit'
import Toast from '../components/Toast'

const CHART_COLORS = ['#1d4ed8', '#0891b2', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0f766e']

// ── Top bar ────────────────────────────────────────────────────────────────────

function TopBar({ plan, question, correctionCount }) {
  const firstPhase = plan.timeline?.[0]?.phase ?? '—'
  const lastPhase  = plan.timeline?.[plan.timeline.length - 1]?.phase ?? ''
  const timelineLabel = plan.timeline?.length > 0 ? `${firstPhase} – ${lastPhase}` : '—'

  return (
    <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="px-6 py-3 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <Link to="/" className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
            <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
          </svg>
          <span className="font-display font-semibold text-sm" style={{ color: 'var(--ink)' }}>The AI Scientist</span>
        </Link>
        <span style={{ color: 'var(--border)' }}>›</span>
        <span className="font-sans text-sm" style={{ color: 'var(--muted)' }}>Literature QC</span>
        <span style={{ color: 'var(--border)' }}>›</span>
        <span className="font-sans text-sm font-600" style={{ color: 'var(--ink)' }}>Experiment Plan</span>

        {correctionCount > 0 && (
          <span
            className="ml-auto font-sans text-xs px-2.5 py-1 rounded-full font-600"
            style={{ background: '#eff6ff', color: 'var(--accent)', border: '1px solid #bfdbfe' }}
          >
            {correctionCount} correction{correctionCount !== 1 ? 's' : ''} saved
          </span>
        )}
      </div>

      <div className="px-6 py-3 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-sans text-xs font-600 uppercase tracking-widest mb-0.5" style={{ color: 'var(--muted)' }}>Hypothesis</p>
          <p className="font-display text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>"{question}"</p>
        </div>
        <StatPill label="Total Budget"   value={`$${Number(plan.total_budget).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} accent />
        <StatPill label="Timeline"       value={timelineLabel} />
        <StatPill label="Protocol Steps" value={plan.protocol?.length ?? 0} />
        <StatPill label="Materials"      value={plan.materials?.length ?? 0} />
      </div>
    </header>
  )
}

function StatPill({ label, value, accent }) {
  return (
    <div
      className="flex flex-col items-center px-4 py-2 rounded"
      style={{ background: accent ? 'var(--accent-light)' : 'var(--surface2)', border: '1px solid var(--border)', minWidth: 100 }}
    >
      <span className="font-sans text-xs font-600 uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{label}</span>
      <span className="font-display font-bold text-lg leading-tight" style={{ color: accent ? 'var(--accent)' : 'var(--ink)' }}>
        {value}
      </span>
    </div>
  )
}

// ── Protocol Stepper ───────────────────────────────────────────────────────────

function ProtocolStepper({ steps, question, onCorrection }) {
  const [active, setActive] = useState(0)
  const [local, setLocal]   = useState(steps)

  return (
    <div className="flex flex-col gap-1">
      {local.map((step, i) => {
        const isActive = active === i
        const isDone   = i < active
        return (
          <div
            key={i}
            className="step-item rounded-lg overflow-hidden transition-all duration-200"
            style={{
              animationDelay: `${i * 0.04}s`,
              border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
              background: isActive ? 'var(--accent-light)' : 'var(--surface)',
            }}
          >
            {/* Header row — always visible */}
            <button
              onClick={() => setActive(isActive ? -1 : i)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
              style={{ cursor: 'pointer', background: 'transparent', border: 'none' }}
            >
              {/* Step badge */}
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-200"
                style={{
                  background: isDone ? 'var(--success)' : isActive ? 'var(--accent)' : 'var(--surface2)',
                  color: isDone || isActive ? 'white' : 'var(--muted)',
                  border: `1.5px solid ${isDone ? 'var(--success)' : isActive ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                {isDone ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : String(i + 1).padStart(2, '0')}
              </span>

              {/* Step preview */}
              <span
                className="flex-1 font-sans text-sm leading-snug"
                style={{
                  color: isActive ? 'var(--accent)' : isDone ? 'var(--muted)' : 'var(--ink)',
                  fontWeight: isActive ? 600 : 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: isActive ? 'normal' : 'nowrap',
                }}
              >
                {isActive ? `Step ${i + 1}` : step}
              </span>

              {/* Chevron */}
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{
                  color: 'var(--muted)',
                  transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  flexShrink: 0,
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Expanded body */}
            {isActive && (
              <div className="px-4 pb-4 pt-0 border-t" style={{ borderColor: '#bfdbfe' }}>
                <InlineEdit
                  originalText={step}
                  question={question}
                  category="protocol"
                  itemLabel={`Step ${i + 1}`}
                  onSaved={(corrected) => {
                    const updated = [...local]
                    updated[i] = corrected
                    setLocal(updated)
                    onCorrection()
                  }}
                >
                  <p className="font-sans text-sm leading-relaxed pt-3 pr-8" style={{ color: 'var(--body)' }}>
                    {step}
                  </p>
                </InlineEdit>
                <div className="flex gap-2 mt-4">
                  {i > 0 && (
                    <button onClick={() => setActive(i - 1)} className="btn-ghost px-3 py-1 text-xs rounded">
                      ← Prev
                    </button>
                  )}
                  {i < local.length - 1 && (
                    <button onClick={() => setActive(i + 1)} className="btn-primary px-3 py-1 text-xs rounded">
                      Next →
                    </button>
                  )}
                  {i === local.length - 1 && (
                    <span className="font-sans text-xs px-3 py-1 rounded" style={{ background: 'var(--success-light)', color: 'var(--success)', border: '1px solid #6ee7b7' }}>
                      ✓ Protocol complete
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Budget Tab ─────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="card px-3 py-2" style={{ minWidth: 180 }}>
      <p className="font-sans text-xs font-600 mb-0.5" style={{ color: 'var(--muted)' }}>{d.payload.item}</p>
      <p className="font-mono text-sm font-bold" style={{ color: 'var(--accent)' }}>
        ${Number(d.value).toFixed(2)}
      </p>
    </div>
  )
}

function BudgetTab({ budget, totalBudget, question, onCorrection }) {
  const [local, setLocal] = useState(budget)

  return (
    <div className="flex flex-col gap-6">
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={local} cx="50%" cy="50%" innerRadius={68} outerRadius={108} paddingAngle={2} dataKey="cost" nameKey="item">
              {local.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="white" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            <th className="font-sans font-600 text-xs uppercase tracking-widest pb-2 text-left pr-4" style={{ color: 'var(--muted)' }}>Line Item</th>
            <th className="font-sans font-600 text-xs uppercase tracking-widest pb-2 text-right" style={{ color: 'var(--muted)' }}>Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          {local.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <td className="py-2 pr-4">
                <InlineEdit
                  originalText={`${row.item} — $${Number(row.cost).toFixed(2)}`}
                  question={question}
                  category="budget"
                  itemLabel={row.item}
                  onSaved={(corrected) => {
                    const updated = [...local]
                    const parts = corrected.split('—')
                    updated[i] = { ...updated[i], item: parts[0]?.trim() || row.item }
                    setLocal(updated)
                    onCorrection()
                  }}
                >
                  <span className="font-sans text-sm" style={{ color: 'var(--body)' }}>
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm mr-2 align-middle"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    {row.item}
                  </span>
                </InlineEdit>
              </td>
              <td className="py-2 font-mono text-sm text-right font-medium" style={{ color: 'var(--ink)' }}>
                ${Number(row.cost).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid var(--border)' }}>
            <td className="pt-3 font-sans font-bold text-sm uppercase tracking-wide" style={{ color: 'var(--ink)' }}>Total</td>
            <td className="pt-3 font-mono font-bold text-base text-right" style={{ color: 'var(--accent)' }}>
              ${Number(totalBudget).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ── Materials Tab ──────────────────────────────────────────────────────────────

function MaterialsTab({ materials, question, onCorrection }) {
  const [local, setLocal] = useState(materials)

  return (
    <div className="flex flex-col gap-2.5">
      {local.map((m, i) => (
        <InlineEdit
          key={i}
          originalText={`${m.name} | SKU: ${m.catalog_number} | Supplier: ${m.supplier} | Price: $${m.unit_price} | Qty: ${m.quantity}`}
          question={question}
          category="material"
          itemLabel={m.name}
          onSaved={(corrected) => {
            onCorrection()
          }}
        >
          <div className="card card-hover px-4 py-3.5 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3 pr-8">
              <span className="font-sans font-semibold text-sm" style={{ color: 'var(--ink)' }}>{m.name}</span>
              <span
                className="font-sans text-xs px-2.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'var(--surface2)', color: 'var(--body)', border: '1px solid var(--border)' }}
              >
                {m.supplier}
              </span>
            </div>
            <div className="flex items-center gap-5 flex-wrap">
              <span className="flex items-center gap-1.5 font-mono text-xs" style={{ color: 'var(--muted)' }}>
                <span>SKU</span>
                <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{m.catalog_number}</span>
              </span>
              <span className="font-sans text-xs" style={{ color: 'var(--muted)' }}>{m.quantity}</span>
              <span className="font-mono text-sm font-semibold ml-auto" style={{ color: 'var(--ink)' }}>
                ${Number(m.unit_price).toFixed(2)}
              </span>
            </div>
          </div>
        </InlineEdit>
      ))}
    </div>
  )
}

// ── Timeline Tab ───────────────────────────────────────────────────────────────

function TimelineTab({ timeline, question, onCorrection }) {
  const [activePhase, setActivePhase] = useState(0)
  const PHASE_COLORS = ['var(--accent)', 'var(--teal)', '#7c3aed', 'var(--success)']

  return (
    <div className="flex flex-col gap-5">
      {/* Phase track */}
      <div className="flex items-start gap-0 overflow-x-auto pb-1">
        {timeline.map((phase, i) => (
          <div key={i} className="flex items-center flex-shrink-0" style={{ minWidth: 0 }}>
            <button
              onClick={() => setActivePhase(i)}
              className="flex flex-col items-center gap-1.5 group"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 4px' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-200"
                style={{
                  background: activePhase === i ? PHASE_COLORS[i % PHASE_COLORS.length] : 'var(--surface2)',
                  color: activePhase === i ? 'white' : 'var(--muted)',
                  border: `2px solid ${activePhase === i ? PHASE_COLORS[i % PHASE_COLORS.length] : 'var(--border)'}`,
                  boxShadow: activePhase === i ? `0 0 0 4px ${PHASE_COLORS[i % PHASE_COLORS.length]}20` : 'none',
                }}
              >
                {i + 1}
              </div>
              <span
                className="font-sans text-xs font-600 whitespace-nowrap"
                style={{ color: activePhase === i ? PHASE_COLORS[i % PHASE_COLORS.length] : 'var(--muted)' }}
              >
                {phase.phase}
              </span>
            </button>

            {/* Connector line */}
            {i < timeline.length - 1 && (
              <div
                style={{
                  height: 2,
                  width: 40,
                  marginBottom: 20,
                  background: i < activePhase
                    ? PHASE_COLORS[i % PHASE_COLORS.length]
                    : 'var(--border)',
                  transition: 'background 0.3s',
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Active phase tasks */}
      {timeline[activePhase] && (
        <div
          className="card px-4 py-4 flex flex-col gap-3 animate-fade-in"
          style={{ borderColor: PHASE_COLORS[activePhase % PHASE_COLORS.length], borderWidth: 1.5 }}
        >
          <div className="flex items-center justify-between">
            <span
              className="font-sans font-bold text-sm"
              style={{ color: PHASE_COLORS[activePhase % PHASE_COLORS.length] }}
            >
              {timeline[activePhase].phase}
            </span>
            <span className="font-sans text-xs" style={{ color: 'var(--muted)' }}>
              {timeline[activePhase].tasks.length} task{timeline[activePhase].tasks.length !== 1 ? 's' : ''}
            </span>
          </div>

          <ul className="flex flex-col gap-2">
            {timeline[activePhase].tasks.map((task, j) => (
              <li key={j} className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-mono text-xs font-bold mt-0.5"
                  style={{
                    background: `${PHASE_COLORS[activePhase % PHASE_COLORS.length]}18`,
                    color: PHASE_COLORS[activePhase % PHASE_COLORS.length],
                    border: `1px solid ${PHASE_COLORS[activePhase % PHASE_COLORS.length]}40`,
                  }}
                >
                  {j + 1}
                </span>
                <InlineEdit
                  originalText={task}
                  question={question}
                  category="timeline"
                  itemLabel={`${timeline[activePhase].phase} — Task ${j + 1}`}
                  onSaved={onCorrection}
                >
                  <span className="font-sans text-sm leading-relaxed pr-8" style={{ color: 'var(--body)' }}>{task}</span>
                </InlineEdit>
              </li>
            ))}
          </ul>

          {/* Phase navigation */}
          <div className="flex gap-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            {activePhase > 0 && (
              <button onClick={() => setActivePhase(p => p - 1)} className="btn-ghost px-3 py-1 text-xs rounded">← Previous</button>
            )}
            {activePhase < timeline.length - 1 && (
              <button
                onClick={() => setActivePhase(p => p + 1)}
                className="btn-primary px-3 py-1 text-xs rounded"
              >
                Next Phase →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Validation Tab ─────────────────────────────────────────────────────────────

function ValidationTab({ validation, question, onCorrection }) {
  if (!validation?.length) return (
    <p className="font-sans text-sm" style={{ color: 'var(--muted)' }}>No validation criteria returned.</p>
  )
  return (
    <div className="flex flex-col gap-3">
      {validation.map((v, i) => (
        <div key={i} className="card px-4 py-4 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="font-mono text-xs w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid #bfdbfe' }}
            >
              {i + 1}
            </span>
            <span className="font-sans font-semibold text-sm" style={{ color: 'var(--ink)' }}>{v.metric}</span>
          </div>
          <div className="grid grid-cols-1 gap-2 pl-9">
            <InfoRow label="Method"  value={v.method} />
            <InlineEdit
              originalText={v.success_threshold}
              question={question}
              category="validation"
              itemLabel={`${v.metric} — success threshold`}
              onSaved={onCorrection}
            >
              <InfoRow label="Success" value={v.success_threshold} color="var(--success)" bg="var(--success-light)" border="#6ee7b7" />
            </InlineEdit>
            <InlineEdit
              originalText={v.failure_indicator}
              question={question}
              category="validation"
              itemLabel={`${v.metric} — failure indicator`}
              onSaved={onCorrection}
            >
              <InfoRow label="Failure" value={v.failure_indicator} color="var(--danger)" bg="var(--danger-light)" border="#fca5a5" />
            </InlineEdit>
          </div>
        </div>
      ))}
    </div>
  )
}

function InfoRow({ label, value, color, bg, border }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span
        className="font-sans font-600 text-xs flex-shrink-0 mt-0.5 px-2 py-0.5 rounded"
        style={{ color: color || 'var(--body)', background: bg || 'var(--surface2)', border: `1px solid ${border || 'var(--border)'}`, minWidth: 56, textAlign: 'center' }}
      >
        {label}
      </span>
      <span className="font-sans leading-relaxed" style={{ color: 'var(--body)' }}>{value}</span>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const TABS = ['Budget', 'Materials', 'Timeline', 'Validation']

export default function PlanPage() {
  const location = useLocation()
  const { plan, question } = location.state || {}
  const [activeTab, setActiveTab]         = useState('Budget')
  const [correctionCount, setCorrectionCount] = useState(0)
  const [toast, setToast]                 = useState(null)

  if (!plan) return <Navigate to="/" replace />

  const handleCorrection = () => {
    setCorrectionCount(c => c + 1)
    setToast({ message: 'Correction saved — will improve future plans.', type: 'success' })
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', fontFamily: "'Source Sans 3', sans-serif" }}>
      <TopBar plan={plan} question={question} correctionCount={correctionCount} />

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_1.25fr]" style={{ minHeight: 0 }}>

        {/* ── Left: Protocol ── */}
        <div
          className="px-6 py-6 overflow-y-auto"
          style={{ borderRight: '1px solid var(--border)', maxHeight: 'calc(100vh - 130px)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-base" style={{ color: 'var(--ink)' }}>Protocol</h2>
            <span className="font-sans text-xs" style={{ color: 'var(--muted)' }}>Hover any step to suggest a correction</span>
          </div>
          <ProtocolStepper steps={plan.protocol || []} question={question} onCorrection={handleCorrection} />
        </div>

        {/* ── Right: Tabs ── */}
        <div
          className="px-6 py-6 flex flex-col overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 130px)', background: 'var(--bg)' }}
        >
          <div className="flex gap-5 border-b mb-6" style={{ borderColor: 'var(--border)' }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-sans text-sm pb-3 transition-colors duration-150 ${activeTab === tab ? 'tab-active' : 'tab-inactive'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="animate-fade-in">
            {activeTab === 'Budget'     && <BudgetTab     budget={plan.budget || []} totalBudget={plan.total_budget || 0} question={question} onCorrection={handleCorrection} />}
            {activeTab === 'Materials'  && <MaterialsTab  materials={plan.materials || []} question={question} onCorrection={handleCorrection} />}
            {activeTab === 'Timeline'   && <TimelineTab   timeline={plan.timeline || []} question={question} onCorrection={handleCorrection} />}
            {activeTab === 'Validation' && <ValidationTab validation={plan.validation || []} question={question} onCorrection={handleCorrection} />}
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  )
}
