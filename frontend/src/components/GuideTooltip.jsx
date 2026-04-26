import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { tooltipVariants } from '../lib/animations'

/**
 * Click-activated tooltip.
 * Usage:
 *   <GuideTooltip title="Plan" description="Create a plan for your task" shortcut="⌘P">
 *     <button>Plan</button>
 *   </GuideTooltip>
 */
export default function GuideTooltip({ title, description, shortcut, children, placement = 'top' }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [open])

  const offset = placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'

  return (
    <span ref={wrapRef} style={{ position: 'relative', display: 'block' }}>
      {/* Clone child and inject onClick */}
      <span onClick={() => setOpen(o => !o)} style={{ display: 'block' }}>
        {children}
      </span>

      <AnimatePresence>
        {open && (
          <motion.div
            className={`guide-tooltip ${offset}`}
            style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 200 }}
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="tooltip"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}>
                  {title}
                </span>
                {shortcut && (
                  <kbd style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-soft)',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {shortcut}
                  </kbd>
                )}
              </div>
              {description && (
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  lineHeight: 1.55,
                  margin: 0,
                }}>
                  {description}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}
