import { useEffect, useRef, useState } from 'react'
import {
  BUTCE,
  ekstraToplam,
  gunSayisi,
  pesinTaksit,
  tahminiToplam,
  tarihAraligi,
  tlKisa,
  uyumSkoru,
} from '../lib/scoring.js'

const ROUTE_COLORS = ['#2c6a74', '#a98545', '#5b7a99']

const TEKNE_ETIKET = { dahil: 'Dahil', ekstra: 'Ekstra', yok: 'Yok', bilinmiyor: 'Doğrulanamadı' }

const SATIRLAR = [
  { k: 'Tarih', v: (t) => tarihAraligi(t.cikisISO, t.donusISO), kalin: true },
  { k: 'Süre', v: (t) => `${gunSayisi(t)} gün`, n: (t) => gunSayisi(t), iyi: 'max' },
  { k: 'İstanbul çıkışı', v: (t) => t.cikis.saat || 'Doğrulanamadı' },
  { k: 'Paket fiyatı', v: (t) => tlKisa(t.paketFiyat), n: (t) => t.paketFiyat, iyi: 'min', kalin: true },
  {
    k: 'Ekstra ücretler',
    v: (t) => {
      const e = ekstraToplam(t)
      if (e.belirsiz) return e.tutar > 0 ? `+${tlKisa(e.tutar)} +?` : 'Yayımlanmamış'
      return e.tutar > 0 ? `+${tlKisa(e.tutar)}` : 'Yok'
    },
  },
  {
    k: 'Tahmini toplam',
    v: (t) => (ekstraToplam(t).belirsiz ? '≥ ' : '') + tlKisa(tahminiToplam(t)),
    n: (t) => tahminiToplam(t),
    iyi: 'min',
  },
  {
    k: 'Peşin fiyatına taksit',
    v: (t) => `${pesinTaksit(t)} taksit`,
    n: (t) => pesinTaksit(t),
    iyi: 'max',
    kalin: true,
  },
  {
    k: 'Aynı tur başka sitede',
    v: (t) => (t.capraz ? `${t.capraz.site}: ${tlKisa(t.capraz.fiyat)} TL · ${t.capraz.taksit} taksit` : '—'),
  },
  {
    k: 'Bütçe payı (paket)',
    v: (t) => `${tlKisa(BUTCE - t.paketFiyat)} altında`,
    n: (t) => BUTCE - t.paketFiyat,
    iyi: 'max',
  },
  { k: 'Otel gecesi', v: (t) => `${t.geceOtel} gece`, n: (t) => t.geceOtel, iyi: 'max' },
  { k: 'Otobüste gece', v: (t) => `${t.geceOtobus}`, n: (t) => t.geceOtobus, iyi: 'min' },
  {
    k: 'Tekne',
    v: (t) =>
      t.tekne.durum === 'ekstra'
        ? t.tekne.ucret
          ? `Ekstra +${tlKisa(t.tekne.ucret)}`
          : 'Ekstra (ücret yok)'
        : TEKNE_ETIKET[t.tekne.durum],
    n: (t) => ({ dahil: 3, ekstra: 2, bilinmiyor: 1, yok: 0 }[t.tekne.durum]),
    iyi: 'max',
  },
  { k: 'Deniz skoru', v: (t) => t.skor.deniz.toFixed(1), n: (t) => t.skor.deniz, iyi: 'max' },
  { k: 'Deniz odaklı gün', v: (t) => `${t.denizGun} / ${t.toplamGun}`, n: (t) => t.denizGun / t.toplamGun, iyi: 'max' },
  { k: 'Yeni yer', v: (t) => `${t.yeniYerSayisi}`, n: (t) => t.yeniYerSayisi, iyi: 'max' },
  { k: 'Toplam yol', v: (t) => (t.otobusKm ? `${tlKisa(t.otobusKm)} km` : 'Yayımlanmamış'), n: (t) => -(t.otobusKm || 9999), iyi: 'max' },
  { k: 'Emir için uyum', v: (t) => `%${uyumSkoru(t)}`, n: (t) => uyumSkoru(t), iyi: 'max', kalin: true },
]

export default function CompareTable({ turlar }) {
  const kutuRef = useRef(null)
  const [kaydirilabilir, setKaydirilabilir] = useState(false)

  // Sağda görünmeyen sütun kaldıysa kenar geçişi ve ipucu gösterilir
  useEffect(() => {
    const el = kutuRef.current
    if (!el) return
    const bak = () => setKaydirilabilir(el.scrollWidth - el.clientWidth - el.scrollLeft > 8)
    bak()
    el.addEventListener('scroll', bak, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(bak) : null
    ro?.observe(el)
    return () => {
      el.removeEventListener('scroll', bak)
      ro?.disconnect()
    }
  }, [turlar.length])

  if (turlar.length < 2) return null

  return (
    <div className={`ctable-sar${kaydirilabilir ? ' kaydirilabilir' : ''}`}>
      <div className="ctable-ipucu">
        <span aria-hidden>↔</span> Tüm turları görmek için tabloyu yana kaydır
      </div>
      <div className="scroll-x" ref={kutuRef}>
        <table className="ctable">
          <thead>
            <tr>
              <th>Özellik</th>
            {turlar.map((t, i) => (
              <th key={t.id}>
                <span className="dotc" style={{ background: ROUTE_COLORS[i % 3] }} />
                {t.kisaAd}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SATIRLAR.map((s) => {
            let bestIdx = -1
            if (s.iyi && s.n) {
              const vals = turlar.map(s.n)
              const target = s.iyi === 'min' ? Math.min(...vals) : Math.max(...vals)
              // yalnızca tek bir kazanan varsa vurgula
              if (vals.filter((v) => v === target).length === 1) bestIdx = vals.indexOf(target)
            }
            return (
              <tr key={s.k} className={s.kalin ? 'total' : undefined}>
                <td>{s.k}</td>
                {turlar.map((t, i) => (
                  <td key={t.id} className={`num${i === bestIdx ? ' best' : ''}`}>
                    {s.v(t)}
                  </td>
                ))}
              </tr>
            )
          })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
