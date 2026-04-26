/**
 * ProductComparison modal
 *
 * Shows the current reagent alongside up to 4 competitor alternatives in a
 * side-by-side comparison table. The cheapest option gets a green highlight.
 *
 * Props:
 *   material   – { name, supplier, catalog_number, unit_price, quantity }
 *   onClose    – () => void
 */
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

// ── Icons ─────────────────────────────────────────────────────────────────────
function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ── Skeleton column ───────────────────────────────────────────────────────────
function SkeletonColumn() {
  return (
    <div className="flex flex-col gap-3 px-5 py-5 flex-1" style={{ minWidth: 160 }}>
      {[80, 60, 50, 40, 70, 55, 45, 65, 50, 60].map((w, i) => (
        <div
          key={i}
          className="rounded-md"
          style={{
            height: i === 0 ? 20 : 16,
            width: `${w}%`,
            background: 'var(--surface2)',
            animation: `pulse 1.4s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
}

// ── Row label column ──────────────────────────────────────────────────────────
const ROWS = [
  { key: 'supplier',       label: 'Supplier',       section: 'commercial' },
  { key: 'catalog_number', label: 'SKU / Catalog #', section: 'commercial' },
  { key: 'unit_price',     label: 'Unit Price',      section: 'commercial' },
  { key: 'quantity',       label: 'Quantity',         section: 'commercial' },
  { key: 'vs_current',     label: 'vs Current',       section: 'commercial' },
  { key: 'cas_number',     label: 'CAS Number',       section: 'substance' },
  { key: 'purity',         label: 'Purity',           section: 'substance' },
  { key: 'grade',          label: 'Grade',            section: 'substance' },
  { key: 'form',           label: 'Physical Form',    section: 'substance' },
  { key: 'link',           label: 'Product Page',     section: 'commercial' },
]

// ── Supplier badge palette (neutral — no blue/purple) ─────────────────────────
const PALETTE = [
  { bg: 'rgba(0,0,0,0.04)',    color: 'var(--text-primary)',   border: 'var(--border-soft)' },
  { bg: 'rgba(45,122,58,0.07)', color: 'var(--diff-add)',      border: 'rgba(45,122,58,0.2)' },
  { bg: 'var(--bg-base)',       color: 'var(--text-secondary)', border: 'var(--border-soft)' },
  { bg: 'rgba(217,119,6,0.07)', color: '#D97706',              border: 'rgba(217,119,6,0.2)' },
  { bg: 'rgba(192,57,43,0.06)', color: 'var(--diff-remove)',   border: 'rgba(192,57,43,0.2)' },
]

// ── Single product column ─────────────────────────────────────────────────────
function ProductColumn({ product, isCurrent, isCheapest, currentPrice }) {
  const palette   = isCurrent ? { bg: 'rgba(0,0,0,0.06)', color: 'var(--text-primary)', border: 'var(--border-soft)' } : PALETTE[1]
  const hasPrice  = product.unit_price != null && product.unit_price > 0
  const diff      = hasPrice && currentPrice > 0 && !isCurrent
    ? ((product.unit_price - currentPrice) / currentPrice) * 100
    : null
  const cheaper   = diff !== null && diff < -0.5
  const pricier   = diff !== null && diff > 0.5

  const cellStyle = {
    padding: '14px 20px',
    borderBottom: '1px solid var(--border-light)',
    minHeight: 52,
    display: 'flex',
    alignItems: 'center',
  }

  return (
    <div
      className="flex flex-col flex-1"
      style={{
        minWidth: 160,
        borderLeft: '1px solid var(--border)',
        borderTop: isCheapest ? '3px solid #059669' : isCurrent ? '3px solid var(--accent)' : '3px solid transparent',
        background: isCurrent ? 'var(--accent-light)' : isCheapest ? '#F0FDF4' : 'var(--surface)',
        position: 'relative',
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 90,
        }}
      >
        {/* Badge row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {isCurrent && (
            <span
              className="font-sans text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              Current
            </span>
          )}
          {isCheapest && (
            <span
              className="font-sans text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: '#059669', color: 'white' }}
            >
              <CheckIcon /> Best Price
            </span>
          )}
        </div>

        {/* Product name */}
        <p
          className="font-sans font-semibold text-sm leading-snug"
          style={{ color: 'var(--ink)', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {product.name}
        </p>
      </div>

      {/* Supplier */}
      <div style={cellStyle}>
        <span
          className="font-sans text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}
        >
          {product.supplier}
        </span>
      </div>

      {/* SKU */}
      <div style={cellStyle}>
        <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>
          {product.catalog_number || 'N/A'}
        </span>
      </div>

      {/* Unit Price */}
      <div style={cellStyle}>
        <span
          className="font-mono font-bold text-base"
          style={{ color: isCheapest ? '#059669' : 'var(--ink)' }}
        >
          {hasPrice ? `$${Number(product.unit_price).toFixed(2)}` : 'N/A'}
        </span>
      </div>

      {/* Quantity */}
      <div style={cellStyle}>
        <span className="font-sans text-xs" style={{ color: 'var(--body)' }}>
          {product.quantity || '—'}
        </span>
      </div>

      {/* vs Current */}
      <div style={cellStyle}>
        {isCurrent ? (
          <span className="font-sans text-xs" style={{ color: 'var(--muted)' }}>—</span>
        ) : cheaper ? (
          <span
            className="font-sans text-xs font-semibold px-2 py-0.5 rounded-md"
            style={{ background: '#D1FAE5', color: '#059669' }}
          >
            ↓ {Math.abs(diff).toFixed(1)}% cheaper
          </span>
        ) : pricier ? (
          <span
            className="font-sans text-xs font-semibold px-2 py-0.5 rounded-md"
            style={{ background: '#FEE2E2', color: '#DC2626' }}
          >
            ↑ {Math.abs(diff).toFixed(1)}% pricier
          </span>
        ) : (
          <span className="font-sans text-xs" style={{ color: 'var(--muted)' }}>~Same price</span>
        )}
      </div>

      {/* ── Substance section divider ── */}
      <div style={{ padding: '8px 20px 4px', borderBottom: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.02)' }}>
        <span className="font-sans text-xs font-bold uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.07em', fontSize: 9 }}>
          Substance
        </span>
      </div>

      {/* CAS Number */}
      <div style={cellStyle}>
        <span className="font-mono text-xs" style={{ color: 'var(--body)' }}>
          {product.cas_number || <span style={{ color: 'var(--muted)' }}>—</span>}
        </span>
      </div>

      {/* Purity */}
      <div style={cellStyle}>
        {product.purity ? (
          <span
            className="font-sans text-xs font-semibold px-2 py-0.5 rounded-md"
            style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}
          >
            {product.purity}
          </span>
        ) : (
          <span className="font-sans text-xs" style={{ color: 'var(--muted)' }}>—</span>
        )}
      </div>

      {/* Grade */}
      <div style={cellStyle}>
        <span className="font-sans text-xs" style={{ color: 'var(--body)' }}>
          {product.grade || <span style={{ color: 'var(--muted)' }}>—</span>}
        </span>
      </div>

      {/* Physical Form */}
      <div style={cellStyle}>
        {product.form ? (
          <span
            className="font-sans text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--surface2)', color: 'var(--body)', border: '1px solid var(--border)' }}
          >
            {product.form}
          </span>
        ) : (
          <span className="font-sans text-xs" style={{ color: 'var(--muted)' }}>—</span>
        )}
      </div>

      {/* Link */}
      <div style={{ ...cellStyle, borderBottom: 'none' }}>
        {product.url ? (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-sans text-xs font-semibold"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}
          >
            View product <ExternalLinkIcon />
          </a>
        ) : (
          <span className="font-sans text-xs" style={{ color: 'var(--muted)' }}>—</span>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProductComparison({ material, onClose }) {
  const [alternatives, setAlternatives]   = useState(null)  // null = loading
  const [currentDetails, setCurrentDetails] = useState({})
  const [error, setError]                 = useState(null)

  const fetchAlternatives = useCallback(async () => {
    try {
      const res  = await fetch('/compare-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:           material.name,
          supplier:       material.supplier,
          quantity:       material.quantity,
          catalog_number: material.catalog_number || '',
        }),
      })
      const data = await res.json()
      // Merge substance details fetched for the current product
      setCurrentDetails(data.current_details || {})
      setAlternatives(data.alternatives || [])
    } catch (e) {
      setError('Could not load alternatives. Check your connection and try again.')
      setAlternatives([])
    }
  }, [material])

  useEffect(() => {
    fetchAlternatives()
  }, [fetchAlternatives])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Build columns: current (merged with fetched substance details) + alternatives
  const currentProduct = { ...material, url: null, ...currentDetails }
  const allProducts    = alternatives ? [currentProduct, ...alternatives] : [currentProduct]

  // Find cheapest (by unit_price, among those with a price)
  const priced      = allProducts.filter(p => p.unit_price > 0)
  const minPrice    = priced.length ? Math.min(...priced.map(p => p.unit_price)) : null
  const currentPrice = Number(material.unit_price) || 0

  const isLoading = alternatives === null

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col"
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-xl, 0 25px 50px rgba(0,0,0,0.25))',
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        {/* Modal header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
            flexShrink: 0,
          }}
        >
          <div>
            <p className="font-display font-bold text-base" style={{ color: 'var(--ink)' }}>
              Product Comparison
            </p>
            <p className="font-sans text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {material.name} — current supplier vs alternatives
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--muted)',
              flexShrink: 0,
            }}
          >
            <XIcon />
          </button>
        </div>

        {/* Comparison table */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', minWidth: 'max-content' }}>
            {/* Row labels */}
            <div
              style={{
                width: 140,
                flexShrink: 0,
                borderRight: '1px solid var(--border)',
                background: 'var(--surface3)',
              }}
            >
              {/* Spacer matching column header height */}
              <div style={{ height: 90, borderBottom: '1px solid var(--border)', padding: '16px 16px 12px' }}>
                <p className="font-sans text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  {isLoading ? 'Loading…' : `${allProducts.length} option${allProducts.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              {ROWS.map((row, ri) => {
                if (row.key === 'cas_number') {
                  return (
                    <div key="substance-section">
                      <div style={{ padding: '8px 16px 4px', borderBottom: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.02)' }}>
                        <span className="font-sans font-bold uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.07em', fontSize: 9 }}>
                          Substance
                        </span>
                      </div>
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)', minHeight: 52, display: 'flex', alignItems: 'center' }}>
                        <span className="font-sans text-xs font-semibold uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.05em' }}>{row.label}</span>
                      </div>
                    </div>
                  )
                }
                return (
                  <div
                    key={row.key}
                    style={{
                      padding: '14px 16px',
                      borderBottom: row.key !== 'link' ? '1px solid var(--border-light)' : 'none',
                      minHeight: 52,
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    <span
                      className="font-sans text-xs font-semibold uppercase"
                      style={{ color: 'var(--muted)', letterSpacing: '0.05em' }}
                    >
                      {row.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Product columns */}
            {isLoading ? (
              <>
                <ProductColumn product={currentProduct} isCurrent currentPrice={0} isCheapest={false} />
                <SkeletonColumn />
                <SkeletonColumn />
                <SkeletonColumn />
              </>
            ) : (
              allProducts.map((product, i) => (
                <ProductColumn
                  key={i}
                  product={product}
                  isCurrent={i === 0}
                  isCheapest={minPrice !== null && product.unit_price === minPrice && product.unit_price > 0}
                  currentPrice={currentPrice}
                />
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--surface3)',
            flexShrink: 0,
          }}
        >
          {error ? (
            <p className="font-sans text-xs" style={{ color: 'var(--danger, #DC2626)' }}>{error}</p>
          ) : (
            <p className="font-sans text-xs" style={{ color: 'var(--muted)' }}>
              Prices and catalog numbers sourced via live supplier search · may vary
            </p>
          )}
          <button
            onClick={onClose}
            className="font-sans text-xs font-semibold px-4 py-2 rounded-lg"
            style={{ background: 'var(--surface2)', color: 'var(--body)', border: '1px solid var(--border)', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
