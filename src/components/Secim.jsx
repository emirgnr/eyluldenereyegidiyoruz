import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

/**
 * Sayfanın tasarımına uyan açılır liste.
 *
 * Yerleşik <select>'in açılan listesi işletim sisteminin kendi penceresi —
 * ne yazı tipi, ne renk, ne köşe yuvarlaklığı sayfayla uyuşuyordu ve
 * mobilde iyice kaba duruyordu. Bu yüzden listbox'ı kendimiz çiziyoruz.
 */
export default function Secim({
  deger,
  secenekler,
  onDegis,
  etiket,
  sinif = '',
  hizala = 'sol',
  genislik,
}) {
  const [acik, setAcik] = useState(false)
  const [imlec, setImlec] = useState(-1)
  const [yukari, setYukari] = useState(false)
  const kokRef = useRef(null)
  const panelRef = useRef(null)
  const dugmeRef = useRef(null)
  const id = useId()

  const secili = secenekler.find((s) => s.deger === deger)
  const secililIdx = secenekler.findIndex((s) => s.deger === deger)

  // Dışarı tıklama / Esc / sayfa kayması listeyi kapatır
  useEffect(() => {
    if (!acik) return
    const disari = (e) => {
      if (!kokRef.current?.contains(e.target)) setAcik(false)
    }
    const tus = (e) => {
      if (e.key === 'Escape') {
        setAcik(false)
        dugmeRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', disari)
    document.addEventListener('keydown', tus)
    window.addEventListener('resize', () => setAcik(false), { once: true })
    return () => {
      document.removeEventListener('pointerdown', disari)
      document.removeEventListener('keydown', tus)
    }
  }, [acik])

  // Aşağıda yer yoksa liste yukarı açılır
  useLayoutEffect(() => {
    if (!acik) return
    const r = dugmeRef.current?.getBoundingClientRect()
    if (!r) return
    const panelY = Math.min(secenekler.length * 38 + 12, 288)
    setYukari(r.bottom + panelY + 16 > window.innerHeight && r.top > panelY + 16)
    setImlec(secililIdx)
    requestAnimationFrame(() => {
      panelRef.current?.querySelector('[data-secili="1"]')?.scrollIntoView({ block: 'nearest' })
    })
  }, [acik, secenekler.length, secililIdx])

  const sec = (s) => {
    if (s.pasif) return
    onDegis(s.deger)
    setAcik(false)
    dugmeRef.current?.focus()
  }

  const komsu = (yon) => {
    let i = imlec < 0 ? secililIdx : imlec
    for (let adim = 0; adim < secenekler.length; adim++) {
      i = (i + yon + secenekler.length) % secenekler.length
      if (!secenekler[i].pasif) return i
    }
    return imlec
  }

  const tuslar = (e) => {
    if (!acik) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault()
        setAcik(true)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setImlec(komsu(1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setImlec(komsu(-1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (secenekler[imlec]) sec(secenekler[imlec])
    } else if (e.key === 'Tab') {
      setAcik(false)
    }
  }

  return (
    <div className={`secim${acik ? ' acik' : ''} ${sinif}`} ref={kokRef} style={genislik ? { width: genislik } : undefined}>
      <button
        type="button"
        ref={dugmeRef}
        className="secim-dugme"
        aria-haspopup="listbox"
        aria-expanded={acik}
        aria-label={etiket}
        onClick={() => setAcik((a) => !a)}
        onKeyDown={tuslar}
      >
        <span className="secim-metin">{secili?.etiket ?? ''}</span>
        <svg className="secim-ok" width="11" height="11" viewBox="0 0 12 12" aria-hidden>
          <path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {acik && (
        <div
          className={`secim-panel${yukari ? ' yukari' : ''}${hizala === 'sag' ? ' sag' : ''}`}
          role="listbox"
          id={id}
          aria-label={etiket}
          ref={panelRef}
          onKeyDown={tuslar}
        >
          {secenekler.map((s, i) => (
            <button
              type="button"
              key={s.deger}
              role="option"
              aria-selected={s.deger === deger}
              aria-disabled={s.pasif || undefined}
              data-secili={s.deger === deger ? '1' : undefined}
              className={`secim-sec${s.deger === deger ? ' on' : ''}${s.pasif ? ' pasif' : ''}${i === imlec ? ' imlec' : ''}`}
              onClick={() => sec(s)}
              onPointerEnter={() => !s.pasif && setImlec(i)}
              tabIndex={-1}
            >
              <span className="secim-tik" aria-hidden>
                {s.deger === deger ? '✓' : ''}
              </span>
              <span>{s.etiket}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
