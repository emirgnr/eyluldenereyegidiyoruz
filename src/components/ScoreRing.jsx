import { useEffect, useState } from 'react'

/** Uyum skoru halkası — sayfaya girişte yumuşakça dolar. */
export default function ScoreRing({ value, size = 92, label = 'Uyum' }) {
  const [p, setP] = useState(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => setP(value))
    return () => cancelAnimationFrame(id)
  }, [value])

  return (
    <div
      className="score-ring"
      style={{ '--p': p, '--sz': `${size}px`, transition: 'background 1.1s cubic-bezier(.16,1,.3,1)' }}
      role="img"
      aria-label={`${label}: yüzde ${value}`}
    >
      <div>
        <div className="val num">%{value}</div>
        <div className="lbl">{label}</div>
      </div>
    </div>
  )
}
