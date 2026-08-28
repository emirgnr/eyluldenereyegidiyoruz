import { useEffect, useRef } from 'react'
import { ekstraToplam, gunSayisi, pesinTaksit, tarihAraligi, tl, tlKisa } from '../lib/scoring.js'

const TIP_ICON = { yol: '🚌', deniz: '🌊', tekne: '🚤', gezi: '🏛️', doga: '🌿', otel: '🏨' }

/**
 * Gün gün program penceresi.
 * Kart içinde açılmıyor — kartı aşağı doğru uzatıp ızgarayı bozuyordu.
 * App seviyesinde render edilir; kartın transform'u position:fixed'i bozmasın diye.
 */
export default function ProgramModal({ tur, onKapat }) {
  const kapatRef = useRef(null)

  useEffect(() => {
    if (!tur) return
    kapatRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onKapat()
    }
    document.addEventListener('keydown', onKey)
    const eskiOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = eskiOverflow
    }
  }, [tur, onKapat])

  if (!tur) return null

  const ekstra = ekstraToplam(tur)

  return (
    <div className="modal-ort" onClick={onKapat} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${tur.ad} — gün gün program`}
      >
        <header className="modal-bas">
          <div>
            <div className="eyebrow">{tur.firma} · gün gün program</div>
            <h3 className="serif">{tur.ad}</h3>
            <div className="modal-ozet">
              <span className="num">{tarihAraligi(tur.cikisISO, tur.donusISO)}</span>
              <span className="sep">·</span>
              <span className="num">
                {gunSayisi(tur)} gün / {tur.geceOtel} gece otel
              </span>
              <span className="sep">·</span>
              <span className="num">{tl(tur.paketFiyat)}</span>
              <span className="sep">·</span>
              <span className="num">{pesinTaksit(tur)} taksit</span>
            </div>
          </div>
          <button className="modal-kapat" onClick={onKapat} ref={kapatRef} aria-label="Kapat">
            ×
          </button>
        </header>

        <div className="modal-govde scroll-y">
          <div className="modal-grid">
            <section className="modal-sol">
              <h5>Gün gün program</h5>
              <div className="tl">
                {tur.program.map((g, i) => (
                  <div className={`tl-item ${g.tip}`} key={i}>
                    <div className="tl-date">{g.tarih}</div>
                    <div className="tl-title">
                      {TIP_ICON[g.tip] || '•'} {g.baslik}
                    </div>
                    <div className="tl-body">{g.metin}</div>
                    {g.etiketler?.length > 0 && (
                      <div className="tl-tags">
                        {g.etiketler.map((e) => (
                          <span className="tl-tag" key={e}>
                            {e}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <aside className="modal-sag">
              <div className="prog-block">
                <h5>Konaklama</h5>
                {tur.oteller.length === 0 && <div className="note">Otel bilgisi doğrulanamadı.</div>}
                {tur.oteller.map((o, i) => (
                  <div className="hotel-row" key={i}>
                    <span>{o.ad}</span>
                    <span className="c">
                      {o.sehir}
                      {o.yildiz ? ` · ${o.yildiz}` : ''} · {o.gece} gece
                    </span>
                  </div>
                ))}
              </div>

              <div className="prog-block">
                <h5>Fiyata dahil</h5>
                <ul>
                  {tur.dahil.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>

              <div className="prog-block">
                <h5>Dahil değil / ekstra</h5>
                <ul>
                  {tur.dahilDegil.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>

              <div className="prog-block">
                <h5>Artıları</h5>
                <ul>
                  {tur.arti.map((x, i) => (
                    <li key={i}>✓ {x}</li>
                  ))}
                </ul>
              </div>

              <div className="prog-block">
                <h5>Eksileri</h5>
                <ul>
                  {tur.eksi.map((x, i) => (
                    <li key={i}>− {x}</li>
                  ))}
                </ul>
              </div>

              {tur.maliyetNotu && (
                <div className="prog-block">
                  <h5>Maliyet notu</h5>
                  <div className={ekstra.belirsiz ? 'warnbox' : 'note'}>{tur.maliyetNotu}</div>
                </div>
              )}

              <div className="prog-block">
                <h5>Ulaşım</h5>
                <div className="note">
                  🚌 {tur.ulasim}
                  {tur.otobusKm ? ` · Toplam yol ≈ ${tlKisa(tur.otobusKm)} km.` : ' · Toplam mesafe sayfada yayımlanmamış.'}
                  {tur.otobusNot ? ` ${tur.otobusNot}` : ''}
                </div>
              </div>

              {tur.taksit && (
                <div className="prog-block">
                  <h5>Ödeme</h5>
                  <div className="note">💳 {tur.taksit.not}</div>
                </div>
              )}

              {tur.dogrulanamayan?.length > 0 && (
                <div className="prog-block">
                  <h5>Doğrulanamayan bilgiler</h5>
                  <div className="warnbox">
                    {tur.dogrulanamayan.map((x, i) => (
                      <div key={i}>• {x}</div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>

        <footer className="modal-alt">
          <div className="note">
            Kaynak: {tur.firma} — bütün veriler bu sayfadan okundu.
          </div>
          <a className="cta" href={tur.url} target="_blank" rel="noopener noreferrer">
            Tur sayfasını aç <span aria-hidden>→</span>
          </a>
        </footer>
      </div>
    </div>
  )
}
