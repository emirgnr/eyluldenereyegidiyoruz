import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { META, TURLAR, ELENENLER, ELEME_GRUPLARI, KAYNAKLAR, METODOLOJI } from './data/tours.js'
import {
  ARALIK,
  BUTCE,
  SIRALAMALAR,
  ekstraToplam,
  gunNo,
  gunSayisi,
  tahminiToplam,
  tarihAraligi,
  tl,
  tlKisa,
  uyumSkoru,
} from './lib/scoring.js'
import TourCard, { FiyatBlogu } from './components/TourCard.jsx'
import Secim from './components/Secim.jsx'
import ProgramModal from './components/ProgramModal.jsx'
import RouteMap from './components/RouteMap.jsx'
import CompareTable from './components/CompareTable.jsx'
import ScoreRing from './components/ScoreRing.jsx'
import ScoreBreakdown from './components/ScoreBreakdown.jsx'

const ROUTE_COLORS = ['#2c6a74', '#a98545', '#5b7a99']

/** Arama aralığında seçilebilir günler: 4–13 Eylül 2026 */
const GUNLER = Array.from({ length: 10 }, (_, i) => `2026-09-${String(4 + i).padStart(2, '0')}`)

/* ------------------------------------------------------------------ */

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  })
}

function TopBar() {
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const on = () => setStuck(window.scrollY > 12)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className={`topbar${stuck ? ' stuck' : ''}`}>
      <div className="wrap topbar-in">
        <div className="topbar-brand">
          <span className="mark" />
          Eylül'de Nereye Gidiyoruz
        </div>
        <nav className="topbar-nav">
          <a href="#en-uygun">En uygun</a>
          <a href="#turlar">Turlar</a>
          <a href="#harita">Harita</a>
          <a href="#elenenler">Elenenler</a>
          <a href="#sonuc">Sonuç</a>
        </nav>
      </div>
    </header>
  )
}

function HeroBg() {
  return (
    <div className="hero-bg" aria-hidden="true">
      <svg viewBox="0 0 1440 460" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hbg" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#f4f8f8" />
            <stop offset="100%" stopColor="#fbfaf7" />
          </linearGradient>
        </defs>
        <rect width="1440" height="460" fill="url(#hbg)" />
        <g stroke="#2c6a74" strokeOpacity="0.09" fill="none" strokeWidth="1">
          <path d="M-40 372 C 180 340, 300 404, 520 372 S 900 340, 1120 372 S 1400 404, 1500 380" />
          <path d="M-40 400 C 180 368, 300 432, 520 400 S 900 368, 1120 400 S 1400 432, 1500 408" />
          <path d="M-40 428 C 180 396, 300 460, 520 428 S 900 396, 1120 428 S 1400 460, 1500 436" />
        </g>
        <circle cx="1235" cy="112" r="62" fill="#a98545" fillOpacity="0.055" />
        <circle cx="1235" cy="112" r="62" stroke="#a98545" strokeOpacity="0.14" fill="none" />
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ */

export default function App() {
  const [sirala, setSirala] = useState('uyum')
  const [filtreler, setFiltreler] = useState({ tekneDahil: false, dortGece: false, denizAgir: false })
  // Arama aralığının sınırları — sabit tur tarihi değil, kullanıcı daraltabilir
  const [aralik, setAralik] = useState({ bas: ARALIK.bas, son: ARALIK.son })
  const [secili, setSecili] = useState(() => TURLAR.slice(0, 3).map((t) => t.id))
  const [aktifDurak, setAktifDurak] = useState(null)
  const [acikProgram, setAcikProgram] = useState(null)
  const haritaRef = useRef(null)

  useReveal()

  const filtreli = useMemo(() => {
    let list = TURLAR.filter((t) => t.cikisISO >= aralik.bas && t.donusISO <= aralik.son)
    if (filtreler.tekneDahil) list = list.filter((t) => t.tekne.durum === 'dahil')
    if (filtreler.dortGece) list = list.filter((t) => t.geceOtel >= 4)
    if (filtreler.denizAgir) list = list.filter((t) => t.skor.deniz >= 8)
    const s = SIRALAMALAR.find((x) => x.key === sirala) || SIRALAMALAR[0]
    return list.sort(s.fn)
  }, [filtreler, sirala, aralik])

  const enIyi = useMemo(() => TURLAR.slice().sort((a, b) => uyumSkoru(b) - uyumSkoru(a))[0], [])

  const seciliTurlar = useMemo(
    () => secili.map((id) => TURLAR.find((t) => t.id === id)).filter(Boolean),
    [secili]
  )

  const secToggle = useCallback((id) => {
    setSecili((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 3) return [...prev.slice(1), id]
      return [...prev, id]
    })
  }, [])

  const haritayaGit = () => {
    haritaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }


  return (
    <>
      <TopBar />

      {/* ---------------------------------------------------- HERO */}
      <section className="hero">
        <HeroBg />
        <div className="wrap hero-in">
          <div className="eyebrow">Kişisel tur karşılaştırması · {META.guncelleme}</div>
          <h1>
            Eylül'de Nereye Gidiyoruz <span className="wave">🌊</span>
          </h1>
          <p className="hero-sub">
            4–13 Eylül 2026 arasında <b>hangi gün çıkarsa çıksın</b>, bu aralığın tamamına sığan
            İstanbul çıkışlı, deniz ve koy odaklı Ege &amp; Akdeniz turlarını senin kriterlerine göre
            karşılaştırdık.
          </p>

          <div className="hero-stats">
            <div className="hero-stat">
              <b className="num">{META.uygunTur}</b>
              <span>uygun tur</span>
            </div>
            <div className="hero-stat">
              <b className="num">{META.taranan.toLocaleString('tr-TR')}</b>
              <span>tur tarandı, {META.detayIncelenen}’si tek tek incelendi</span>
            </div>
            <div className="hero-stat">
              <b className="num">≤{tlKisa(BUTCE)}</b>
              <span>TL paket fiyatı üst sınırı</span>
            </div>
            <div className="hero-stat">
              <b>Tekne</b>
              <span>öncelikli sıralama</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- KAPAK BANDI */}
      {META.kapakFoto && (
        <div className="band">
          <img src={META.kapakFoto.src} alt={META.kapakFoto.alt} />
          <div className="band-cap wrap">
            <span className="band-place">{META.kapakFoto.yer}</span>
            <span className="band-note">{META.kapakFoto.not}</span>
          </div>
          <span className="band-credit">{META.kapakFoto.telif}</span>
        </div>
      )}

      {/* ---------------------------------------------------- FİLTRELER */}
      <div className="filters">
        <div className="wrap filters-in">
          <div className="chips">
            <div className="daterange" title="4–13 Eylül arasında herhangi bir gün çıkabilirsin">
              📅 Çıkış
              <Secim
                sinif="secim-gun"
                etiket="En erken çıkış günü"
                deger={aralik.bas}
                onDegis={(v) => setAralik((a) => ({ ...a, bas: v }))}
                secenekler={GUNLER.map((g) => ({ deger: g, etiket: `${gunNo(g)} Eyl`, pasif: g > aralik.son }))}
              />
              <span className="dr-bar" aria-hidden>
                <i
                  style={{
                    left: `${((gunNo(aralik.bas) - 4) / 9) * 100}%`,
                    right: `${((13 - gunNo(aralik.son)) / 9) * 100}%`,
                  }}
                />
                <span style={{ left: `calc(${((gunNo(aralik.bas) - 4) / 9) * 100}% - 5px)` }} />
                <span style={{ left: `calc(${((gunNo(aralik.son) - 4) / 9) * 100}% - 5px)` }} />
              </span>
              <Secim
                sinif="secim-gun"
                etiket="En geç dönüş günü"
                deger={aralik.son}
                hizala="sag"
                onDegis={(v) => setAralik((a) => ({ ...a, son: v }))}
                secenekler={GUNLER.map((g) => ({ deger: g, etiket: `${gunNo(g)} Eyl`, pasif: g < aralik.bas }))}
              />
            </div>
            <span className="chip lock">💰 Paket ≤ {tlKisa(BUTCE)} TL</span>
            <span className="chip lock">📍 Ege + Akdeniz</span>
            <span className="chip lock">🚌 İstanbul çıkışlı</span>
            <button
              className={`chip${filtreler.dortGece ? ' on' : ''}`}
              onClick={() => setFiltreler((f) => ({ ...f, dortGece: !f.dortGece }))}
            >
              🏨 4+ gece {filtreler.dortGece && <span className="x">×</span>}
            </button>
            <button
              className={`chip${filtreler.tekneDahil ? ' on' : ''}`}
              onClick={() => setFiltreler((f) => ({ ...f, tekneDahil: !f.tekneDahil }))}
            >
              🚤 Tekne dahil {filtreler.tekneDahil && <span className="x">×</span>}
            </button>
            <button
              className={`chip${filtreler.denizAgir ? ' on' : ''}`}
              onClick={() => setFiltreler((f) => ({ ...f, denizAgir: !f.denizAgir }))}
            >
              🌊 Deniz ağırlıklı {filtreler.denizAgir && <span className="x">×</span>}
            </button>
          </div>

          <div className="filters-right">
            <span className="filters-count num">{filtreli.length} tur</span>
            <div className="sortwrap">
              Sırala
              <Secim
                sinif="secim-sirala"
                etiket="Sıralama ölçütü"
                deger={sirala}
                hizala="sag"
                onDegis={setSirala}
                secenekler={SIRALAMALAR.map((s) => ({ deger: s.key, etiket: s.ad }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- EN UYGUN */}
      <section className="section" id="en-uygun">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">Kriterlerinle en yüksek eşleşme</div>
              <h2 className="section-title">🏆 Sana En Uygun Tur</h2>
            </div>
          </div>

          <div className="best reveal">
            <div className="best-ribbon">
              <span>Emir için 1. sıra</span>
            </div>
            {(enIyi.fotoGenis || enIyi.foto) && (
              <div className="best-photo">
                <img src={(enIyi.fotoGenis || enIyi.foto).src} alt={(enIyi.fotoGenis || enIyi.foto).yer} />
                <span className="cap">
                  <b>{(enIyi.fotoGenis || enIyi.foto).yer}</b> — bu turun rotasında
                </span>
                <span className="credit">{(enIyi.fotoGenis || enIyi.foto).telif}</span>
              </div>
            )}
            <div className="best-grid">
              <div className="best-main">
                <div className="best-head">
                  <div>
                    <h3 className="best-title">{enIyi.ad}</h3>
                    <div className="best-firm">
                      {enIyi.firma} · {tarihAraligi(enIyi.cikisISO, enIyi.donusISO)} · {gunSayisi(enIyi)} gün ·{' '}
                      {enIyi.cikis.saat ? `çıkış ${enIyi.cikis.saat}` : 'çıkış saati doğrulanamadı'}
                    </div>
                  </div>
                  <ScoreRing value={uyumSkoru(enIyi)} size={104} label="Uyum" />
                </div>

                <div className="best-metrics">
                  <div className="metric">
                    <div className="k">Paket fiyatı</div>
                    <div className="v num">{tl(enIyi.paketFiyat)}</div>
                  </div>
                  <div className="metric">
                    <div className="k">Otel</div>
                    <div className="v num">
                      {enIyi.geceOtel} <small>gece</small>
                    </div>
                  </div>
                  <div className="metric">
                    <div className="k">Tekne</div>
                    <div className="v">
                      {enIyi.tekne.durum === 'dahil'
                        ? '🚤 Dahil'
                        : enIyi.tekne.durum === 'ekstra'
                        ? enIyi.tekne.ucret
                          ? `🚤 +${tlKisa(enIyi.tekne.ucret)}`
                          : '🚤 Ekstra'
                        : enIyi.tekne.durum === 'yok'
                        ? '🚫 Yok'
                        : 'Doğrulanamadı'}
                    </div>
                  </div>
                  <div className="metric">
                    <div className="k">Deniz skoru</div>
                    <div className="v num">{enIyi.skor.deniz.toFixed(1)} <small>/10</small></div>
                  </div>
                  <div className="metric">
                    <div className="k">Yeni yer</div>
                    <div className="v num">{enIyi.yeniYerSayisi}</div>
                  </div>
                </div>

                <div className="best-why">
                  <h4>Neden bunu seçtik?</h4>
                  <p>{enIyi.neden}</p>
                </div>

                <div className="proscons">
                  <div>
                    <h5>Avantajlar</h5>
                    <ul>
                      {enIyi.arti.map((x, i) => (
                        <li key={i}>
                          <i>✓</i>
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="cons">
                    <h5>Dezavantajlar</h5>
                    <ul>
                      {enIyi.eksi.map((x, i) => (
                        <li key={i}>
                          <i>−</i>
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="best-side">
                <div className="pricebox">
                  <FiyatBlogu tur={enIyi} />
                </div>

                <div>
                  <div className="eyebrow" style={{ marginBottom: 9 }}>Rota</div>
                  <div className="route-chips">
                    {enIyi.duraklar.map((d) => (
                      <span
                        key={d.ad}
                        className={`rchip${d.gidilmis ? ' seen' : d.ad === 'İstanbul' ? '' : d.yeni ? ' new' : ''}`}
                        title={d.gidilmis ? 'Daha önce gidildi' : d.not || ''}
                      >
                        {d.ad}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="eyebrow" style={{ marginBottom: 9 }}>Konaklama</div>
                  {enIyi.oteller.map((o, i) => (
                    <div className="hotel-row" key={i}>
                      <span>{o.ad}</span>
                      <span className="c">
                        {o.sehir}
                        {o.yildiz ? ` · ${o.yildiz}` : ''} · {o.gece} gece
                      </span>
                    </div>
                  ))}
                </div>

                <ScoreBreakdown tur={enIyi} />

                <a className="cta" href={enIyi.url} target="_blank" rel="noopener noreferrer" style={{ marginTop: 4 }}>
                  Turu incele <span aria-hidden>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- TÜM TURLAR */}
      <section className="section" id="turlar" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">Filtreleri geçen turlar</div>
              <h2 className="section-title">Kriterlerine uyan {TURLAR.length} tur</h2>
              <p className="section-sub">
                Hepsi İstanbul çıkışlı; çıkış günü 4–13 Eylül aralığında herhangi bir gün olabilir ve
                dönüş 13 Eylül’ü geçmiyor. Paket fiyatı 17.000 TL’nin altında, en az 3 gece otel
                konaklaması var. Karşılaştırmak için en fazla 3 tur seçebilirsin.
              </p>
            </div>
          </div>

          <div className="cards">
            {filtreli.map((t, i) => (
              <div className="reveal" key={t.id} style={{ transitionDelay: `${Math.min(i, 5) * 60}ms` }}>
                <TourCard
                  tur={t}
                  secili={secili.includes(t.id)}
                  onSec={secToggle}
                  onProgramAc={setAcikProgram}
                  tint={ROUTE_COLORS[secili.indexOf(t.id) >= 0 ? secili.indexOf(t.id) % 3 : 0]}
                  rank={sirala === 'uyum' ? i + 1 : null}
                />
              </div>
            ))}
          </div>

          {filtreli.length === 0 && (
            <div className="map-empty">Bu filtre kombinasyonuna uyan tur kalmadı. Bir filtreyi kaldırmayı dene.</div>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------- HARİTA */}
      <section className="section" id="harita" ref={haritaRef} style={{ background: 'var(--paper-2)' }}>
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">Rota karşılaştırması</div>
              <h2 className="section-title">🗺️ Rotalar haritada</h2>
              <p className="section-sub">
                Kartlardan 2–3 tur seç, rotaları burada üst üste binsin. Haritadaki her durağa
                tıklayarak o durakta ne olduğunu görebilirsin.
              </p>
            </div>
          </div>

          <div className="mapwrap reveal">
            <RouteMap
              turlar={TURLAR}
              secili={secili}
              aktifDurak={aktifDurak}
              onDurakSec={setAktifDurak}
            />
            <div className="map-side">
              <div className="map-side-head">
                <h3>Karşılaştırma</h3>
                <span className="filters-count num">{seciliTurlar.length} tur seçili</span>
              </div>

              {seciliTurlar.length < 2 ? (
                <div className="map-empty">
                  Karşılaştırma tablosu için en az 2 tur seç.
                  <br />
                  Yukarıdaki kartlarda <b>Karşılaştır</b> düğmesini kullanabilirsin.
                </div>
              ) : (
                <div style={{ marginTop: 18 }}>
                  <CompareTable turlar={seciliTurlar} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- ELENENLER */}
      <section className="section" id="elenenler">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <div className="eyebrow">Şeffaflık</div>
              <h2 className="section-title">❌ Neden diğer turları eledik?</h2>
              <p className="section-sub">
                <b>{META.taranan.toLocaleString('tr-TR')} turun</b> hareket takvimi tarandı;{' '}
                <b>{META.araliktaHareketi} turda</b> 4–13 Eylül aralığına sığan hareket bulundu.
                Aşağıdakiler ilk bakışta iyi görünen ama kesin filtrelerden birine takılan turlar —
                her birinin verisi kendi sayfasından okundu.
              </p>
            </div>
          </div>

          {Object.entries(ELEME_GRUPLARI).map(([key, g]) => {
            const liste = ELENENLER.filter((e) => e.grup === key)
            if (!liste.length) return null
            return (
              <div key={key} style={{ marginBottom: 36 }}>
                <div className="drop-group reveal">
                  <span className="drop-group-dot" style={{ background: g.renk }} />
                  {g.ad}
                  <span className="drop-group-count num">{liste.length} tur</span>
                </div>
                <div className="dropped">
                  {liste.map((e, i) => (
                    <div className="drop reveal" key={i} style={{ transitionDelay: `${Math.min(i, 6) * 40}ms` }}>
                      <div className="drop-top">
                        <div>
                          <div className="drop-name">{e.ad}</div>
                          <div className="drop-firm">{e.firma}</div>
                        </div>
                      </div>
                      <div className="drop-fact">{e.veri}</div>
                      <div className="drop-reason" style={{ color: g.renk }}>
                        <span className="drop-x" style={{ background: g.renk }} aria-hidden />
                        {e.sebep}
                      </div>
                      {e.url && (
                        <div style={{ marginTop: 10 }}>
                          <a href={e.url} target="_blank" rel="noopener noreferrer">
                            tur sayfası ↗
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ---------------------------------------------------- SONUÇ */}
      <section className="section" id="sonuc">
        <div className="wrap">
          <div className="verdict reveal">
            <div className="verdict-in">
              <div>
                <div className="eyebrow">Sonuç</div>
                <h2>Ben olsam bunu seçerdim.</h2>
                <div
                  className="serif"
                  style={{ fontSize: 27, marginTop: 20, lineHeight: 1.2 }}
                >
                  {enIyi.ad}
                </div>
                <p className="lead">{META.sonSoz}</p>
                <div className="verdict-facts">
                  <span className="vfact">🌊 Deniz {enIyi.skor.deniz.toFixed(1)}/10</span>
                  <span className="vfact">
                    {enIyi.tekne.durum === 'dahil'
                      ? '🚤 İki tekne turu dahil'
                      : enIyi.tekne.durum === 'ekstra'
                      ? '🚤 Tekne ekstra'
                      : '🚤 Tekne bilgisi'}
                  </span>
                  <span className="vfact">🏨 {enIyi.geceOtel} gece</span>
                  <span className="vfact">🗺️ {enIyi.yeniYerSayisi} yeni yer</span>
                  <span className="vfact">💰 Paket {tl(enIyi.paketFiyat)}</span>
                  <span className="vfact">📅 {tarihAraligi(enIyi.cikisISO, enIyi.donusISO)}</span>
                </div>
                <a className="cta" href={enIyi.url} target="_blank" rel="noopener noreferrer">
                  Turu incele <span aria-hidden>→</span>
                </a>

                {META.alternatif && (() => {
                  const alt = TURLAR.find((t) => t.id === META.alternatif.id)
                  if (!alt) return null
                  return (
                    <div className="verdict-alt">
                      <div className="eyebrow">{META.alternatif.baslik}</div>
                      <p>{META.alternatif.metin}</p>
                      <a href={alt.url} target="_blank" rel="noopener noreferrer">
                        {alt.ad} <span aria-hidden>→</span>
                      </a>
                    </div>
                  )
                })()}
              </div>
              <ScoreRing value={uyumSkoru(enIyi)} size={168} label="Uyum" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- KAYNAKLAR */}
      <footer className="foot">
        <div className="wrap">
          <div className="section-head" style={{ marginBottom: 22 }}>
            <div>
              <div className="eyebrow">Kaynaklar</div>
              <h2 className="section-title" style={{ fontSize: 28 }}>
                Araştırmada taranan siteler
              </h2>
            </div>
          </div>

          <div className="sources">
            {KAYNAKLAR.map((k) => (
              <a className="src" href={k.url} target="_blank" rel="noopener noreferrer" key={k.url}>
                <div className="n">{k.ad}</div>
                <div className="u">{k.url.replace(/^https?:\/\//, '')}</div>
                {k.not && <div className="s">{k.not}</div>}
              </a>
            ))}
          </div>

          <hr className="hairline" style={{ margin: '34px 0 22px' }} />

          <div className="note">
            {METODOLOJI.map((m, i) => (
              <p key={i} style={{ marginBottom: 9 }}>
                {m}
              </p>
            ))}
          </div>
        </div>
      </footer>

      <ProgramModal tur={acikProgram} onKapat={() => setAcikProgram(null)} />

      {/* ---------------------------------------------------- KARŞILAŞTIRMA ÇUBUĞU */}
      <div className={`combar${secili.length > 0 ? ' show' : ''}`}>
        <div className="combar-list scroll-x">
          {seciliTurlar.map((t, i) => (
            <span className="combar-item" key={t.id}>
              <i style={{ background: ROUTE_COLORS[i % 3] }} />
              <span>{t.kisaAd}</span>
            </span>
          ))}
        </div>
        <button className="combar-clear" onClick={() => setSecili([])}>
          temizle
        </button>
        <button className="combar-btn" onClick={haritayaGit} disabled={seciliTurlar.length < 2}>
          Karşılaştır{seciliTurlar.length >= 2 ? ` (${seciliTurlar.length})` : ''}
        </button>
      </div>
    </>
  )
}
