import { useMemo } from 'react'
import { PATHS, placeXY } from '../lib/geo.js'

/**
 * Kart görseli: turun KENDİ rotasından üretilen mini harita.
 * Stok fotoğraf yerine gerçek rota kullanılır — dış kaynak / API anahtarı gerekmez.
 */
export default function RouteThumb({ tur, tint = '#2c6a74' }) {
  const { vb, d, noktalar, istanbul } = useMemo(() => {
    const stops = (tur.duraklar || [])
      .map((s) => ({ ...s, xy: placeXY(s.ad) }))
      .filter((s) => s.xy)

    const ist = placeXY('İstanbul')
    // Çerçeveyi İstanbul dışındaki duraklara göre kur (kıyı detayı görünsün)
    const focus = stops.filter((s) => s.ad !== 'İstanbul')
    const pts = (focus.length >= 2 ? focus : stops).map((s) => s.xy)
    if (!pts.length) return { vb: '0 0 100 51', d: '', noktalar: [], istanbul: null }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const [x, y] of pts) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x)
      minY = Math.min(minY, y); maxY = Math.max(maxY, y)
    }
    const padX = Math.max(58, (maxX - minX) * 0.42)
    const padY = Math.max(46, (maxY - minY) * 0.42)
    let x = minX - padX, y = minY - padY
    let w = maxX - minX + padX * 2, h = maxY - minY + padY * 2
    const ratio = 8.2 / 16
    if (h / w < ratio) { const nh = w * ratio; y -= (nh - h) / 2; h = nh }
    else { const nw = h / ratio; x -= (nw - w) / 2; w = nw }

    // Çizgi yalnızca çerçevedeki duraklardan geçsin — İstanbul kadraj dışıysa
    // ona uzanan bacak "boşluğa giden çizgi" gibi görünmesin.
    const cizim = focus.length >= 2 ? focus : stops
    const path = cizim
      .map((s, i) => `${i ? 'L' : 'M'}${s.xy[0].toFixed(1)} ${s.xy[1].toFixed(1)}`)
      .join('')

    const istIcerde = ist && ist[0] >= x && ist[0] <= x + w && ist[1] >= y && ist[1] <= y + h

    return {
      vb: [x, y, w, h].map((v) => v.toFixed(1)).join(' '),
      d: path,
      noktalar: cizim,
      istanbul: istIcerde ? ist : null,
    }
  }, [tur])

  const k = parseFloat(vb.split(' ')[2]) / 1000 // ölçek katsayısı
  const sw = (v) => (v * k).toFixed(2)

  return (
    <svg viewBox={vb} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`sea-${tur.id}`} x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0%" stopColor="#f2f8f8" />
          <stop offset="100%" stopColor="#dfebee" />
        </linearGradient>
        <radialGradient id={`glow-${tur.id}`} cx="0.78" cy="0.16" r="0.6">
          <stop offset="0%" stopColor="#f7efdd" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f7efdd" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="-9999" y="-9999" width="19998" height="19998" fill={`url(#sea-${tur.id})`} />
      <rect x="-9999" y="-9999" width="19998" height="19998" fill={`url(#glow-${tur.id})`} />

      <path d={PATHS.greece} fill="#f0efea" stroke="rgba(20,32,42,.10)" strokeWidth={sw(1.2)} />
      <path d={PATHS.cyprus} fill="#f0efea" stroke="rgba(20,32,42,.10)" strokeWidth={sw(1.2)} />
      <path d={PATHS.turkey} fill="#fbfaf6" stroke="rgba(20,32,42,.17)" strokeWidth={sw(1.6)} />

      {d && (
        <>
          <path d={d} fill="none" stroke={tint} strokeOpacity="0.15" strokeWidth={sw(9)} strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill="none" stroke={tint} strokeWidth={sw(2.6)} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}

      {noktalar.map((s, i) => (
        <circle
          key={s.ad + i}
          cx={s.xy[0]}
          cy={s.xy[1]}
          r={sw(s.tekne ? 6 : 4.6)}
          fill={s.tekne ? '#a98545' : '#ffffff'}
          stroke={s.tekne ? '#a98545' : tint}
          strokeWidth={sw(2.2)}
        />
      ))}

      {istanbul && (
        <circle cx={istanbul[0]} cy={istanbul[1]} r={sw(5)} fill={tint} stroke="#fff" strokeWidth={sw(2)} />
      )}
    </svg>
  )
}
