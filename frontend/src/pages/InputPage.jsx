import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const EXAMPLES = [
  'Does CRISPR-Cas9 efficiently edit plant cell genomes via Agrobacterium-mediated transformation?',
  'Can graphene oxide membranes selectively filter microplastics from freshwater samples?',
  "Do gut microbiome changes modulate Alzheimer's disease progression in murine models?",
]

export default function InputPage() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/literature-qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      navigate('/qc', { state: { qcResult: data, question: question.trim() } })
    } catch (err) {
      setError(err.message || 'Failed to reach server. Is the backend running?')
      setLoading(false)
    }
  }

  return (
    <div className="dot-bg min-h-screen flex flex-col">
      {loading && <div className="load-bar" />}

      {/* Top nav */}
      <header className="w-full border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
            </svg>
            <span className="font-display font-semibold text-base" style={{ color: 'var(--ink)' }}>
              The AI Scientist
            </span>
          </div>
          <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ color: 'var(--muted)', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            v1.0.0
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl flex flex-col items-center gap-8 stagger">

          {/* Label */}
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--accent)' }}
            />
            <span className="font-sans text-sm font-500" style={{ color: 'var(--accent)' }}>
              AI Hackathon 2026
            </span>
          </div>

          {/* Heading */}
          <div className="text-center flex flex-col gap-3">
            <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight" style={{ color: 'var(--ink)' }}>
              From Hypothesis to<br />
              <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Runnable Experiment</em>
            </h1>
            <p className="font-sans text-lg" style={{ color: 'var(--muted)', maxWidth: 480, margin: '0 auto' }}>
              Enter a scientific question. We check prior literature, then generate a complete, operationally grounded lab protocol.
            </p>
          </div>

          {/* Search form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
            <div className="flex gap-2 w-full">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Describe your scientific hypothesis…"
                className="sci-input px-4 py-3 flex-1"
                disabled={loading}
                autoFocus
              />
              <button
                type="submit"
                className="btn-primary px-6 py-3 whitespace-nowrap"
                disabled={loading || !question.trim()}
              >
                {loading ? 'Searching…' : 'Analyse →'}
              </button>
            </div>

            {error && (
              <p
                className="font-sans text-sm px-4 py-2 rounded"
                style={{ color: 'var(--danger)', background: 'var(--danger-light)', border: '1px solid #fca5a5' }}
              >
                {error}
              </p>
            )}
          </form>

          {/* Example prompts */}
          <div className="w-full flex flex-col gap-2">
            <p className="font-sans text-xs font-600 uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              Example hypotheses
            </p>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setQuestion(ex)}
                disabled={loading}
                className="btn-ghost w-full text-left px-4 py-2.5 rounded"
                style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--body)' }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <span className="font-sans text-xs" style={{ color: 'var(--muted)' }}>
            Hack-Nation × World Bank Youth Summit · Global AI Hackathon 2026
          </span>
          <span className="font-sans text-xs" style={{ color: 'var(--muted)' }}>
            Hack-Nation × World Bank Youth Summit · Global AI Hackathon 2026
          </span>
        </div>
      </footer>
    </div>
  )
}
