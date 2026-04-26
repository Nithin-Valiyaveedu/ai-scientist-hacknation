import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeUp } from '../lib/animations'

export default function Toast({ message, type = 'success', onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 3000)
    return () => clearTimeout(t)
  }, [])

  const colors = type === 'success'
    ? { bg: 'rgba(45,122,58,0.08)', border: 'rgba(45,122,58,0.2)', color: 'var(--diff-add)' }
    : { bg: 'rgba(192,57,43,0.08)', border: 'rgba(192,57,43,0.2)', color: 'var(--diff-remove)' }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 999999,
            background: 'var(--bg-surface)',
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            padding: '10px 16px',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            color: colors.color,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            maxWidth: 320,
          }}
        >
          {type === 'success' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
