import { useState, useCallback, useEffect, useRef } from 'react'
import { ConversationProvider, useConversation, useConversationClientTool } from '@elevenlabs/react'
import { motion, AnimatePresence } from 'framer-motion'

const CONNECTION_TIMEOUT_MS = 30_000

// ── Icons ──────────────────────────────────────────────────────────────────────
function MicIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function PhoneOffIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07" />
      <path d="M14.5 9.5 9 4" />
      <line x1="23" y1="1" x2="1" y2="23" />
    </svg>
  )
}

// ── Waveform ───────────────────────────────────────────────────────────────────
function Waveform({ speaking }) {
  const bars = [3, 5, 8, 5, 3, 7, 4, 6, 3, 5]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 24 }}>
      {bars.map((h, i) => (
        <motion.div
          key={i}
          style={{ width: 2, borderRadius: 2, background: speaking ? '#10b981' : 'var(--text-muted)' }}
          animate={{ height: speaking ? [h, h * 2.5, h] : 4 }}
          transition={speaking ? {
            duration: 0.4 + i * 0.05, repeat: Infinity,
            delay: i * 0.07, ease: 'easeInOut',
          } : { duration: 0.2 }}
        />
      ))}
    </div>
  )
}

function PulseRing({ color }) {
  return (
    <motion.div
      style={{
        position: 'absolute', inset: -5, borderRadius: '50%',
        border: `1.5px solid ${color}`, pointerEvents: 'none',
      }}
      animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
      transition={{ duration: 1.3, repeat: Infinity, ease: 'easeOut' }}
    />
  )
}

function Spinner({ size = 16, color = 'var(--text-primary)' }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      style={{
        width: size, height: size, borderRadius: '50%',
        border: `2px solid rgba(0,0,0,0.1)`,
        borderTopColor: color,
        flexShrink: 0,
      }}
    />
  )
}

// ── Context builder (pure, called after connection is live) ────────────────────
function buildContextUpdate(context = {}) {
  const question  = context.question || ''
  const novelty   = context.novelty_signal || ''
  const papers    = context.papers || []
  const protocol  = context.protocol || []
  const materials = context.materials || []
  const budget    = context.total_budget || ''

  if (protocol.length > 0 || materials.length > 0) {
    const steps = protocol.slice(0, 5)
      .map((s, i) => `${i + 1}. ${typeof s === 'object' ? s.step : s}`)
      .join('; ')
    const mats = materials.slice(0, 4)
      .map(m => `${m.name} (${m.supplier || ''}, $${m.unit_price || ''})`)
      .join(', ')
    return `[Research context] Hypothesis: "${question}". Protocol: ${steps}. Key materials: ${mats}. Budget: $${budget}. Use this context to answer questions about the experiment plan.`
  }

  if (papers.length > 0) {
    const titles = papers.slice(0, 5).map(p => `"${p.title}" (${p.year})`).join(', ')
    return `[Research context] Hypothesis: "${question}". Novelty: ${novelty}. Papers loaded: ${titles}. Use this context to discuss the literature with the researcher.`
  }

  return question
    ? `[Research context] The researcher is exploring: "${question}".`
    : ''
}

// ── Inner component (inside ConversationProvider) ──────────────────────────────
function VoiceCallInner({ context }) {
  // Separate flag for the async "fetching signed URL" phase before SDK takes over
  const [isFetching, setIsFetching] = useState(false)
  const [errorMsg, setErrorMsg]     = useState('')
  const timeoutRef  = useRef(null)
  // Keep a live ref to the SDK status so timeout/cleanup callbacks are never stale
  const statusRef   = useRef('disconnected')

  // conversationRef lets us call sendContextualUpdate inside onConnect without
  // a circular-reference or stale-closure problem.
  const conversationRef = useRef(null)

  const conversation = useConversation({
    onStatusChange: ({ status }) => {
      statusRef.current = status
    },
    onError: (msg) => {
      clearTimeout(timeoutRef.current)
      setErrorMsg(typeof msg === 'string' ? msg : 'Voice call failed.')
    },
    onConnect: () => {
      clearTimeout(timeoutRef.current)
      // Inject research context now that the connection is live.
      // We use the ref (not the closure variable) to avoid stale captures.
      const update = buildContextUpdate(context)
      if (update && conversationRef.current) {
        conversationRef.current.sendContextualUpdate(update)
      }
    },
  })

  // Keep both refs in sync every render
  conversationRef.current = conversation
  useEffect(() => {
    statusRef.current = conversation.status
  }, [conversation.status])

  // Register the search_literature client tool.
  // ElevenLabs sends the call event to the browser; we call our own /literature-qc.
  useConversationClientTool('search_literature', async ({ query }) => {
    try {
      const res = await fetch('/literature-qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      })
      if (!res.ok) return JSON.stringify({ error: `Search returned ${res.status}` })
      const data = await res.json()
      return JSON.stringify({
        novelty_signal: data.novelty_signal,
        context_summary: data.context_summary,
        papers: (data.papers || []).slice(0, 4).map(p => ({
          title: p.title, year: p.year, venue: p.venue,
          citation_count: p.citation_count,
          abstract: (p.abstract || '').slice(0, 400),
        })),
      })
    } catch (err) {
      return JSON.stringify({ error: err.message })
    }
  })

  // Cleanup timeout on unmount
  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  // safeEnd must be defined before startCall uses it in the timeout closure
  const safeEnd = useCallback(() => {
    // Guard: only call endSession when the SDK actually has an open connection.
    // Calling endSession on a CLOSING/CLOSED WebSocket logs a browser warning;
    // we avoid it entirely by checking the live statusRef instead of stale state.
    if (statusRef.current === 'connected' || statusRef.current === 'connecting') {
      conversation.endSession()
    }
  }, [conversation])

  const endCall = useCallback(() => {
    clearTimeout(timeoutRef.current)
    safeEnd()
    setErrorMsg('')
  }, [safeEnd])

  const startCall = useCallback(async () => {
    if (isFetching || conversation.status === 'connecting' || conversation.status === 'connected') return
    setErrorMsg('')
    setIsFetching(true)

    try {
      const res = await fetch('/voice-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || `Server error ${res.status}`)
      }
      const { signed_url } = await res.json()
      setIsFetching(false)

      // Safety timeout — if connected status never arrives within 30s, bail out.
      // Uses statusRef (not stale closure state) so it always sees the live status.
      timeoutRef.current = setTimeout(() => {
        if (statusRef.current === 'connecting') {
          safeEnd()
          setErrorMsg('Connection timed out. Check that mic permission was granted in your browser.')
        }
      }, CONNECTION_TIMEOUT_MS)

      // No overrides — passing them in the initiation message can cause the
      // ElevenLabs server to close the socket if the agent doesn't have
      // override permissions. Context is injected via sendContextualUpdate
      // inside onConnect instead.
      conversation.startSession({ signedUrl: signed_url })
    } catch (err) {
      setIsFetching(false)
      setErrorMsg(err.message || 'Could not start voice call.')
    }
  }, [isFetching, safeEnd, conversation, context])

  // ── Derived display state ────────────────────────────────────────────────────
  const sdkStatus   = conversation.status           // disconnected|connecting|connected|error
  const isIdle      = !isFetching && sdkStatus === 'disconnected' && !errorMsg
  const isConnecting = isFetching || sdkStatus === 'connecting'
  const isActive    = sdkStatus === 'connected'
  const isError     = !!errorMsg || sdkStatus === 'error'
  const showPanel   = isConnecting || isActive || isError

  const speaking    = isActive && conversation.isSpeaking
  const listening   = isActive && conversation.isListening

  return (
    <>
      {/* Floating info / call panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            style={{
              position: 'fixed', bottom: 74, right: 20, zIndex: 200,
              width: 264,
              background: '#ffffff',
              border: '1px solid var(--border-soft)',
              borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              padding: '14px 16px',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}
          >
            {/* Status row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: isError ? '#ef4444' : isActive ? '#10b981' : '#f59e0b',
              }} />
              <span style={{
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12,
                letterSpacing: '-0.02em', color: 'var(--text-primary)', flex: 1,
              }}>
                {isError ? 'Call error' : isActive ? 'LabAgent' : 'Connecting…'}
              </span>
            </div>

            {/* Connecting hint */}
            {isConnecting && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Spinner size={18} />
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 11,
                  color: 'var(--text-muted)', margin: 0, textAlign: 'center',
                  letterSpacing: '-0.01em',
                }}>
                  {isFetching
                    ? 'Starting session…'
                    : 'Allow microphone access in your browser to continue'}
                </p>
              </div>
            )}

            {/* Active call */}
            {isActive && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <Waveform speaking={speaking} />
                <span style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 11,
                  color: 'var(--text-muted)', letterSpacing: '-0.01em',
                }}>
                  {speaking ? 'AI speaking…' : listening ? 'Listening…' : 'Connected'}
                </span>
              </div>
            )}

            {/* Error */}
            {isError && (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#ef4444', margin: 0 }}>
                {errorMsg || 'Something went wrong.'}
              </p>
            )}

            {/* Controls */}
            {isActive && (
              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button
                  onClick={() => conversation.setMuted(!conversation.isMuted)}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                  style={{
                    flex: 1, height: 30, borderRadius: 6,
                    border: '1px solid var(--border-soft)',
                    background: conversation.isMuted ? 'var(--text-primary)' : 'var(--bg-base)',
                    color: conversation.isMuted ? '#fff' : 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 500,
                  }}
                >
                  <MicIcon size={11} />
                  {conversation.isMuted ? 'Unmute' : 'Mute'}
                </motion.button>
                <motion.button
                  onClick={endCall}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                  style={{
                    flex: 1, height: 30, borderRadius: 6,
                    border: 'none', background: '#ef4444', color: '#fff',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 500,
                  }}
                >
                  <PhoneOffIcon size={11} />
                  End
                </motion.button>
              </div>
            )}

            {/* Retry after error */}
            {isError && (
              <motion.button
                onClick={() => { setErrorMsg(''); startCall() }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', height: 30, borderRadius: 6,
                  border: '1px solid var(--border-soft)',
                  background: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 500,
                }}
              >
                Try again
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating mic button */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 201 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isActive && <PulseRing color={speaking ? '#10b981' : 'var(--text-primary)'} />}
          <motion.button
            onClick={isActive ? endCall : isConnecting ? undefined : startCall}
            whileHover={!isConnecting ? { scale: 1.08 } : {}}
            whileTap={!isConnecting ? { scale: 0.92 } : {}}
            title={isActive ? 'End voice call' : isConnecting ? 'Connecting…' : 'Start voice call with LabAgent'}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              border: isActive ? 'none' : '1px solid var(--border-soft)',
              background: isActive
                ? (speaking ? '#10b981' : 'var(--text-primary)')
                : isError
                  ? '#fef2f2'
                  : 'var(--bg-surface)',
              color: isActive ? '#fff' : isError ? '#ef4444' : 'var(--text-primary)',
              cursor: isConnecting ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isActive ? '0 4px 16px rgba(0,0,0,0.16)' : '0 2px 8px rgba(0,0,0,0.07)',
              transition: 'background 0.25s, box-shadow 0.25s',
            }}
          >
            {isConnecting
              ? <Spinner size={16} color={isFetching ? 'var(--text-primary)' : '#f59e0b'} />
              : isActive
                ? <PhoneOffIcon size={16} />
                : <MicIcon size={16} />
            }
          </motion.button>
        </div>
      </div>
    </>
  )
}

// ── Public export ──────────────────────────────────────────────────────────────
export default function VoiceCall({ context = {} }) {
  return (
    <ConversationProvider>
      <VoiceCallInner context={context} />
    </ConversationProvider>
  )
}
