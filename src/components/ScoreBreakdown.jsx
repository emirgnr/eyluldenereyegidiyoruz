import { useState } from 'react'
import { kirilim, uyumSkoru } from '../lib/scoring.js'

export default function ScoreBreakdown({ tur, acikBaslangic = false }) {
  const [acik, setAcik] = useState(acikBaslangic)
  const rows = kirilim(tur)

  return (
    <div>
      <button
        className="act"
        style={{ padding: '8px 0', justifyContent: 'flex-start', fontSize: 12.6 }}
        onClick={() => setAcik((v) => !v)}
        aria-expanded={acik}
      >
        {acik ? 'Puan kırılımını gizle' : `%${uyumSkoru(tur)} uyum nasıl hesaplandı?`}{' '}
        <span aria-hidden>{acik ? '↑' : '↓'}</span>
      </button>

      {acik && (
        <div className="breakdown" style={{ marginTop: 10 }}>
          {rows.map((r) => (
            <div className="bd-row" key={r.key}>
              <div className="k" title={r.ipucu}>
                {r.ad} <em>%{Math.round(r.w * 100)}</em>
              </div>
              <div className="bd-bar">
                <i style={{ width: `${r.puan * 10}%`, animationDelay: `${rows.indexOf(r) * 70}ms` }} />
              </div>
              <div className="v num">
                {r.puan.toFixed(1)}
                <span style={{ color: 'var(--ink-4)' }}> → {r.katki}</span>
              </div>
            </div>
          ))}
          <div className="bd-row" style={{ borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 2 }}>
            <div className="k" style={{ color: 'var(--ink)' }}>
              Toplam
            </div>
            <div />
            <div className="v num" style={{ color: 'var(--sea)', fontWeight: 500 }}>
              %{uyumSkoru(tur)}
            </div>
          </div>
          {tur.skor?.gerekce && (
            <ul style={{ marginTop: 10 }}>
              {Object.entries(tur.skor.gerekce).map(([k, v]) => (
                <li key={k} className="note" style={{ padding: '3px 0' }}>
                  <b style={{ color: 'var(--ink-2)', fontWeight: 450 }}>{k}:</b> {v}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
