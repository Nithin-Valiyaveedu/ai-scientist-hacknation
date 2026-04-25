import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'

const NOVELTY_CONFIG = {
  'not found': {
    label: 'Novel — No Prior Protocol Found',
    color: 'var(--success)',
    bg: 'var(--success-light)',
    border: '#6ee7b7',
    dot: '#059669',
    description:
      'No existing protocols match this hypothesis in the searched repositories. This appears to be unexplored territory — proceed with confidence.',
  },
  'similar work exists': {
    label: 'Similar Work Exists',
    color: 'var(--warning)',
    bg: 'var(--warning-light)',
    border: '#fcd34d',
    dot: '#d97706',
    description:
      'Related or adjacent protocols have been published. Review the references below to understand existing approaches before generating your plan.',
  },
  'exact match found': {
    label: 'Exact Match Found',
    color: 'var(--danger)',
    bg: 'var(--danger-light)',
    border: '#fca5a5',
    dot: '#dc2626',
    description:
      'An existing protocol closely matches this hypothesis. Consider refining your research question to establish greater novelty.',
  },
}

export default function QCPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { qcResult, question } = location.state || {}

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  if (!qcResult || !question) {
    return (
      <div className="dot-bg min-h-screen flex items-center justify-center">
        <div className="card p-8 text-center flex flex-col gap-4 items-center" style={{ maxWidth: 360 }}>
          <p className="font-sans text-sm" style={{ color: 'var(--muted)' }}>No QC data found.</p>
          <Link to="/" className="btn-primary px-5 py-2 rounded text-sm">← Start over</Link>
        </div>
      </div>
    )
  }

  const cfg = NOVELTY_CONFIG[qcResult.novelty_signal] || NOVELTY_CONFIG['similar work exists']

  const handleProceed = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          literature_context: qcResult.context_summary || '',
          references: qcResult.references || [],
        }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const plan = await res.json()
      navigate('/plan', { state: { plan, question } })
    } catch (err) {
      setError(err.message || 'Failed to generate plan.')
      setLoading(false)
    }
  }

  return (
    <div className="dot-bg min-h-screen flex flex-col">
      {loading && <div className="load-bar" />}

      {/* Top nav */}
      <header className="w-full border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
            </svg>
            <span className="font-display font-semibold text-sm" style={{ color: 'var(--ink)' }}>The AI Scientist</span>
          </Link>
          <span style={{ color: 'var(--border)' }}>›</span>
          <span className="font-sans text-sm" style={{ color: 'var(--muted)' }}>Literature QC</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-10">
        <div className="w-full max-w-2xl flex flex-col gap-5 stagger">

          {/* Hypothesis card */}
          <div className="card px-5 py-4">
            <p className="font-sans text-xs font-600 uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)' }}>
              Hypothesis
            </p>
            <p className="font-display text-xl font-semibold leading-snug" style={{ color: 'var(--ink)' }}>
              "{question}"
            </p>
          </div>

          {/* Novelty signal */}
          <div
            className="card px-5 py-5 flex flex-col gap-3"
            style={{ borderColor: cfg.border, background: cfg.bg }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: cfg.dot }}
              />
              <span className="font-sans font-bold text-sm" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
            </div>
            <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--body)' }}>
              {cfg.description}
            </p>
          </div>

          {/* References */}
          {qcResult.references?.length > 0 && (
            <div className="card px-5 py-4 flex flex-col gap-3">
              <p className="font-sans text-xs font-600 uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                Retrieved References
              </p>
              <ul className="flex flex-col gap-2.5">
                {qcResult.references.map((url, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span
                      className="font-mono text-xs mt-0.5 flex-shrink-0 px-1.5 py-0.5 rounded"
                      style={{ color: 'var(--accent)', background: 'var(--accent-light)', border: '1px solid #bfdbfe' }}
                    >
                      {i + 1}
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans text-sm break-all hover:underline"
                      style={{ color: 'var(--accent)' }}
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Context summary */}
          {qcResult.context_summary && (
            <div className="card px-5 py-4 flex flex-col gap-3">
              <p className="font-sans text-xs font-600 uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                Literature Snapshot
              </p>
              <div
                className="font-sans text-sm leading-relaxed max-h-40 overflow-y-auto pr-1"
                style={{ color: 'var(--body)', whiteSpace: 'pre-wrap' }}
              >
                {qcResult.context_summary}
              </div>
            </div>
          )}

          {error && (
            <p
              className="font-sans text-sm px-4 py-2 rounded"
              style={{ color: 'var(--danger)', background: 'var(--danger-light)', border: '1px solid #fca5a5' }}
            >
              {error}
            </p>
          )}

          {/* CTA */}
          <button
            onClick={handleProceed}
            disabled={loading}
            className="btn-primary w-full py-3.5 rounded text-base"
          >
            {loading ? 'Generating Experiment Plan — this may take 30–60 seconds…' : 'Proceed to Plan Generation →'}
          </button>

          <p className="font-sans text-xs text-center" style={{ color: 'var(--muted)' }}>
            Plan generation uses GPT-4o with structured output and may take up to a minute.
          </p>
        </div>
      </main>
    </div>
  )
}
