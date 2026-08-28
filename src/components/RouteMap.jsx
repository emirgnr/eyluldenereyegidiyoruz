import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { PATHS, VIEWBOX, placeXY } from '../lib/geo.js'

const ROUTE_COLORS = ['#2c6a74', '#a98545', '#5b7a99']

/** En fazla kaç kat yakınlaştırılabilir (1 = rotaya sığdırılmış hâl). */
const MIN_K = 0.12
const MAX_K = 1

/** Kabın piksel boyutunu izler — işaretlerin ekranda sabit boyutta kalması için. */
function useSize(ref) {
  const [size, setSize] = useState({ w: 600, h: 440 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => setSize({ w: el.clientWidth || 600, h: el.clientHeight || 440 })
    read()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

/**
 * Yumuşak viewBox geçişi. Kullanıcı sürüklerken/zoomlarken anında uygulanır.
 *
 * Görünen değer tek bir ref'te tutuluyor. Daha önce React state'i kullanılıyordu:
 * sürükleme boyunca animasyon çalışmadığı için state sürükleme öncesindeki
 * viewBox'ta kalıyor, parmak kalkınca o eski değer bir kare boyunca ekrana
 * basılıp (sağa/sola sıçrama) sonra bırakılan yere geri animasyon yapıyordu.
 */
function useAnimatedViewBox(target, animasyonlu) {
  const [, tik] = useState(0)
  const gorunen = useRef(target)
  const from = useRef(target)
  const raf = useRef(0)
  const start = useRef(0)

  // Sürükleme/zoom sırasında hedef doğrudan uygulanır — animasyon yok.
  if (!animasyonlu) gorunen.current = target

  useEffect(() => {
    cancelAnimationFrame(raf.current)
    if (!animasyonlu) {
      gorunen.current = target
      return
    }
    from.current = gorunen.current
    if (from.current.every((v, i) => Math.abs(v - target[i]) < 0.01)) {
      gorunen.current = target
      return
    }
    start.current = performance.now()
    const dur = 620
    const ease = (t) => 1 - Math.pow(1 - t, 3)
    const step = (now) => {
      const t = Math.min(1, (now - start.current) / dur)
      const e = ease(t)
      gorunen.current = from.current.map((v, i) => v + (target[i] - v) * e)
      tik((n) => n + 1)
      if (t < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.join(','), animasyonlu])

  return gorunen.current
}

function pointsFor(tur) {
  return (tur.duraklar || []).map((d) => ({ ...d, xy: placeXY(d.ad) })).filter((d) => d.xy)
}

/** Catmull-Rom → bezier ile yumuşatılmış rota çizgisi. */
function smoothPath(pts) {
  if (pts.length < 2) return ''
  if (pts.length === 2) return `M${pts[0][0]} ${pts[0][1]}L${pts[1][0]} ${pts[1][1]}`
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6.5, p1[1] + (p2[1] - p0[1]) / 6.5]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6.5, p2[1] - (p3[1] - p1[1]) / 6.5]
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

/** Etiketleri üst üste binmeyecek şekilde yerleştirir (ekran pikseli cinsinden). */
function dodgeLabels(items, pxPerUnit) {
  const placed = []
  const out = new Map()
  const H = 15
  for (const it of items) {
    const cx = it.xy[0] * pxPerUnit
    const cy = it.xy[1] * pxPerUnit
    const halfW = it.ad.length * 3.6 + 8
    let dy = -12
    let yerBulundu = false
    for (let tries = 0; tries < 10; tries++) {
      const top = cy + dy - H
      const hit = placed.some((p) => Math.abs(p.cx - cx) < halfW + p.halfW && Math.abs(p.top - top) < H)
      if (!hit) { yerBulundu = true; break }
      dy = dy < 0 ? -dy + 6 : -(dy + 8)
    }
    // Boş yer kalmadıysa etiket hiç çizilmez — küçük ekranda üst üste binmesindense
    // yakınlaştırıldığında görünmesi daha okunaklı.
    if (!yerBulundu) continue
    placed.push({ cx, top: cy + dy - H, halfW })
    out.set(it.key, dy)
  }
  return out
}

export default function RouteMap({ turlar, secili, aktifDurak, onDurakSec }) {
  const boxRef = useRef(null)
  const svgRef = useRef(null)
  const { w: boxW, h: boxH } = useSize(boxRef)

  /** Kullanıcının yakınlaştırma/kaydırma durumu. k=1 → rotaya sığdırılmış hâl. */
  const [gorunum, setGorunum] = useState({ k: 1, cx: null, cy: null })
  const [suruklenen, setSuruklenen] = useState(false)
  const surukleme = useRef(null)
  /** Aktif parmaklar — iki parmakla sıkıştırarak yakınlaştırma için */
  const parmaklar = useRef(new Map())
  const sikistirma = useRef(null)

  const gosterilen = useMemo(() => turlar.filter((t) => secili.includes(t.id)), [turlar, secili])

  const rotalar = useMemo(
    () =>
      gosterilen.map((t, i) => ({
        tur: t,
        renk: ROUTE_COLORS[i % ROUTE_COLORS.length],
        noktalar: pointsFor(t),
      })),
    [gosterilen]
  )

  /** Seçili rotaları kabın oranına göre çerçeveleyen temel görünüm. */
  const sigdir = useMemo(() => {
    const ratio = boxH / Math.max(1, boxW)
    const bolge = rotalar.flatMap((r) => r.noktalar.filter((n) => n.ad !== 'İstanbul').map((n) => n.xy))
    const all = bolge.length >= 2 ? bolge : rotalar.flatMap((r) => r.noktalar.map((n) => n.xy))
    if (all.length < 2) {
      let [x, y, w, h] = VIEWBOX
      if (h / w < ratio) { const nw = h / ratio; x += (w - nw) / 2; w = nw }
      else { const nh = w * ratio; y += (h - nh) / 2; h = nh }
      return [x, y, w, h]
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const [x, y] of all) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x)
      minY = Math.min(minY, y); maxY = Math.max(maxY, y)
    }
    const padX = Math.max(30, (maxX - minX) * 0.1)
    const padY = Math.max(30, (maxY - minY) * 0.3)
    let x = minX - padX, y = minY - padY
    let w = maxX - minX + padX * 2, h = maxY - minY + padY * 2
    if (h / w < ratio) { const nh = w * ratio; y -= (nh - h) / 2; h = nh }
    else { const nw = h / ratio; x -= (nw - w) / 2; w = nw }
    if (w <= VIEWBOX[2]) x = Math.min(Math.max(x, 0), VIEWBOX[2] - w)
    if (h <= VIEWBOX[3]) y = Math.min(Math.max(y, 0), VIEWBOX[3] - h)
    return [x, y, w, h]
  }, [rotalar, boxW, boxH])

  /** Sığdırılmış görünüm + kullanıcının zoom/pan durumu. */
  const target = useMemo(() => {
    const [fx, fy, fw, fh] = sigdir
    const w = fw * gorunum.k
    const h = fh * gorunum.k
    const cx = gorunum.cx ?? fx + fw / 2
    const cy = gorunum.cy ?? fy + fh / 2
    let x = cx - w / 2
    let y = cy - h / 2
    // Harita verisinin dışına çıkmayı engelle (kenarda 40 birim pay bırakılır)
    const pay = 40
    if (w <= VIEWBOX[2] + pay * 2) x = clamp(x, -pay, VIEWBOX[2] + pay - w)
    if (h <= VIEWBOX[3] + pay * 2) y = clamp(y, -pay, VIEWBOX[3] + pay - h)
    return [x, y, w, h]
  }, [sigdir, gorunum])

  const vb = useAnimatedViewBox(target, !suruklenen)

  const pxPerUnit = boxW / Math.max(1, vb[2])
  const px = (screenPx) => screenPx / pxPerUnit

  /** Fare/dokunma konumunu viewBox koordinatına çevirir. */
  const olcekli = useCallback(
    (e) => {
      const r = svgRef.current?.getBoundingClientRect()
      if (!r) return null
      const [x, y, w, h] = vb
      // preserveAspectRatio="xMidYMid slice" → ölçek iki eksende de aynı
      const s = Math.max(r.width / w, r.height / h)
      const ofsX = (r.width - w * s) / 2
      const ofsY = (r.height - h * s) / 2
      return [x + (e.clientX - r.left - ofsX) / s, y + (e.clientY - r.top - ofsY) / s]
    },
    [vb]
  )

  const zoomla = useCallback(
    (carpan, merkez) => {
      setGorunum((g) => {
        const [fx, fy, fw, fh] = sigdir
        const yeniK = clamp(g.k * carpan, MIN_K, MAX_K)
        if (yeniK === g.k) return g
        const cx = g.cx ?? fx + fw / 2
        const cy = g.cy ?? fy + fh / 2
        if (!merkez) return { k: yeniK, cx, cy }
        // İmlecin altındaki nokta sabit kalsın
        const oran = yeniK / g.k
        return {
          k: yeniK,
          cx: merkez[0] + (cx - merkez[0]) * oran,
          cy: merkez[1] + (cy - merkez[1]) * oran,
        }
      })
    },
    [sigdir]
  )

  const sifirla = useCallback(() => setGorunum({ k: 1, cx: null, cy: null }), [])

  // Seçim değişince kullanıcı zoom'u sıfırlanır
  useEffect(() => { sifirla() }, [secili.join(','), sifirla])

  // Tekerlek ile zoom — sayfa kaydırmasını engellemek için passive olmayan dinleyici
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      zoomla(e.deltaY > 0 ? 1.16 : 1 / 1.16, olcekli(e))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomla, olcekli])

  const onPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    const r = svgRef.current?.getBoundingClientRect()
    if (!r) return

    parmaklar.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (parmaklar.current.size === 2) {
      // İki parmak: sıkıştırarak yakınlaştırma başlıyor, sürükleme iptal
      const [a, b2] = [...parmaklar.current.values()]
      sikistirma.current = { mesafe: Math.hypot(a.x - b2.x, a.y - b2.y), k: gorunum.k }
      surukleme.current = null
      setSuruklenen(false)
      return
    }

    const [fx, fy, fw, fh] = sigdir
    // Ölçek sürükleme BAŞLANGICINDA sabitlenir. Canlı viewBox'tan hesaplasaydık
    // her hareket ölçeği değiştirir, o da konumu değiştirirdi — titremenin sebebi buydu.
    const birimBasinaPx = Math.max(r.width / vb[2], r.height / vb[3])
    // Pointer capture'ı hemen almıyoruz: alsaydık durak tıklamaları yutulurdu.
    surukleme.current = {
      basEkran: [e.clientX, e.clientY],
      birimBasinaPx,
      cx: gorunum.cx ?? fx + fw / 2,
      cy: gorunum.cy ?? fy + fh / 2,
      tasindi: false,
      hedef: e.currentTarget,
      pointerId: e.pointerId,
    }
  }

  const onPointerMove = (e) => {
    if (parmaklar.current.has(e.pointerId)) {
      parmaklar.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }

    // İki parmakla sıkıştırma
    if (sikistirma.current && parmaklar.current.size === 2) {
      const [a, b2] = [...parmaklar.current.values()]
      const mesafe = Math.hypot(a.x - b2.x, a.y - b2.y)
      if (mesafe > 8 && sikistirma.current.mesafe > 8) {
        const oran = sikistirma.current.mesafe / mesafe
        const orta = olcekli({ clientX: (a.x + b2.x) / 2, clientY: (a.y + b2.y) / 2 })
        setGorunum((g) => {
          const [fx, fy, fw, fh] = sigdir
          const yeniK = clamp(sikistirma.current.k * oran, MIN_K, MAX_K)
          const cx = g.cx ?? fx + fw / 2
          const cy = g.cy ?? fy + fh / 2
          if (!orta) return { ...g, k: yeniK }
          const p = yeniK / g.k
          return { k: yeniK, cx: orta[0] + (cx - orta[0]) * p, cy: orta[1] + (cy - orta[1]) * p }
        })
      }
      return
    }

    const s = surukleme.current
    if (!s) return
    const dx = e.clientX - s.basEkran[0]
    const dy = e.clientY - s.basEkran[1]
    if (!s.tasindi) {
      if (Math.hypot(dx, dy) < 4) return // eşik altındaki hareket tıklama sayılır
      s.tasindi = true
      setSuruklenen(true)
      s.hedef.setPointerCapture?.(s.pointerId)
    }
    // Bir kare içinde birden fazla pointermove gelirse yalnızca sonuncusu uygulanır
    s.dx = dx
    s.dy = dy
    if (s.raf) return
    s.raf = requestAnimationFrame(() => uygulaSurukleme(s))
  }

  /** Sürüklemenin son konumunu görünüme yazar. */
  const uygulaSurukleme = (s) => {
    s.raf = 0
    setGorunum((g) => ({ ...g, cx: s.cx - s.dx / s.birimBasinaPx, cy: s.cy - s.dy / s.birimBasinaPx }))
  }

  const onPointerUp = (e) => {
    parmaklar.current.delete(e.pointerId)
    if (parmaklar.current.size < 2) sikistirma.current = null
    const s = surukleme.current
    // Bekleyen kare varsa iptal edip son konumu yine de uygula — yoksa harita
    // parmağın bırakıldığı yerin biraz gerisine düşüyordu.
    if (s?.raf) {
      cancelAnimationFrame(s.raf)
      uygulaSurukleme(s)
    }
    if (s?.tasindi) {
      s.hedef.releasePointerCapture?.(s.pointerId)
      setSuruklenen(false)
      // tıklama olayı sürüklemeden hemen sonra gelirse yutulsun
      setTimeout(() => { surukleme.current = null }, 0)
      return
    }
    surukleme.current = null
  }

  /** Aynı yer birden fazla turda geçebilir — haritada bir kez çizilir. */
  const benzersizDuraklar = useMemo(() => {
    const harita = new Map()
    rotalar.forEach((r) =>
      r.noktalar.forEach((n) => {
        const mevcut = harita.get(n.ad)
        if (mevcut) {
          if (!mevcut.renkler.includes(r.renk)) mevcut.renkler.push(r.renk)
          mevcut.turlar.push(r.tur.kisaAd)
          mevcut.tekne = mevcut.tekne || n.tekne
          mevcut.deniz = mevcut.deniz || n.deniz
          mevcut.plaj = mevcut.plaj || n.plaj
          return
        }
        harita.set(n.ad, { ...n, renk: r.renk, renkler: [r.renk], turlar: [r.tur.kisaAd], turAd: r.tur.kisaAd })
      })
    )
    return [...harita.values()]
  }, [rotalar])

  const kadrajda = (n) =>
    n.xy[0] >= vb[0] - 4 && n.xy[0] <= vb[0] + vb[2] + 4 && n.xy[1] >= vb[1] - 4 && n.xy[1] <= vb[1] + vb[3] + 4

  // Sürükleme sırasında durak listesi sabit tutulur; aksi hâlde kadraja giren/çıkan
  // duraklar yüzünden etiketler her karede yeniden yerleşip zıplıyor.
  const donmusDuraklar = useRef([])
  const gorunenDuraklar = suruklenen ? donmusDuraklar.current : benzersizDuraklar.filter(kadrajda)
  if (!suruklenen) donmusDuraklar.current = gorunenDuraklar

  const etiketler = useMemo(
    () => dodgeLabels(gorunenDuraklar.map((n) => ({ key: n.ad, ad: n.ad, xy: n.xy })), pxPerUnit),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gorunenDuraklar.map((n) => n.ad).join(','), pxPerUnit]
  )

  const yakinlik = Math.round((1 / gorunum.k) * 10) / 10

  return (
    <div
      className={`map${suruklenen ? ' suruklenen' : ''}`}
      ref={boxRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <svg
        ref={svgRef}
        viewBox={vb.join(' ')}
        preserveAspectRatio="xMidYMid slice"
        className="map-svg"
        role="img"
        aria-label="Turların rota haritası"
      >
        <defs>
          <linearGradient id="seaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eef5f6" />
            <stop offset="100%" stopColor="#e4eef0" />
          </linearGradient>
          <filter id="landShadow" x="-8%" y="-8%" width="116%" height="116%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="4" floodColor="#14202a" floodOpacity="0.07" />
          </filter>
        </defs>

        <rect x={-3000} y={-3000} width={9000} height={9000} fill="url(#seaFill)" />

        <g filter="url(#landShadow)">
          <path d={PATHS.bulgaria} fill="#f3f1ed" stroke="rgba(20,32,42,.07)" strokeWidth={px(0.8)} />
          <path d={PATHS.greece} fill="#f2f1ec" stroke="rgba(20,32,42,.10)" strokeWidth={px(0.9)} />
          <path d={PATHS.cyprus} fill="#f2f1ec" stroke="rgba(20,32,42,.10)" strokeWidth={px(0.9)} />
          <path d={PATHS.turkey} fill="#faf9f6" stroke="rgba(20,32,42,.17)" strokeWidth={px(1.2)} />
        </g>

        {rotalar.map((r, ri) => {
          const bolge = r.noktalar.filter((n) => n.ad !== 'İstanbul')
          const ist = r.noktalar.find((n) => n.ad === 'İstanbul')
          const dBolge = smoothPath(bolge.map((n) => n.xy))
          const transfer =
            ist && bolge.length
              ? `M${ist.xy[0]} ${ist.xy[1]}L${bolge[0].xy[0]} ${bolge[0].xy[1]}` +
                `M${bolge[bolge.length - 1].xy[0]} ${bolge[bolge.length - 1].xy[1]}L${ist.xy[0]} ${ist.xy[1]}`
              : ''
          return (
            <g key={r.tur.id}>
              {transfer && (
                <path
                  d={transfer}
                  fill="none"
                  stroke={r.renk}
                  strokeOpacity={0.3}
                  strokeWidth={px(1)}
                  strokeDasharray={`${px(5)} ${px(5)}`}
                  strokeLinecap="round"
                />
              )}
              <path d={dBolge} fill="none" stroke={r.renk} strokeOpacity={0.15} strokeWidth={px(9)} strokeLinecap="round" strokeLinejoin="round" />
              <path
                className="route-line"
                d={dBolge}
                fill="none"
                stroke={r.renk}
                strokeWidth={px(2.4)}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={ri === 0 ? undefined : `${px(10)} ${px(7)}`}
              />
            </g>
          )
        })}

        {gorunenDuraklar.map((n) => {
          const [x, y] = n.xy
          const aktif = aktifDurak && aktifDurak.ad === n.ad
          const uc = n.ad === 'İstanbul'
          const sec = (e) => {
            // sürükleme sonrası tıklama sayılmasın
            if (surukleme.current?.tasindi) return
            e.stopPropagation()
            onDurakSec(aktif ? null : n)
          }
          return (
            <g
              key={n.ad}
              className="map-stop"
              onClick={sec}
              tabIndex={0}
              role="button"
              aria-label={`${n.ad} durağı`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDurakSec(aktif ? null : n) }
              }}
            >
              <circle cx={x} cy={y} r={px(14)} fill="transparent" />
              {/* klavye odağı için kendi halkamız — tarayıcının siyah çerçevesi kapatıldı */}
              <circle className="odak-halka" cx={x} cy={y} r={px(10)} fill="none" stroke="#3d838e" strokeWidth={px(2)} />
              {aktif && <circle cx={x} cy={y} r={px(12)} fill={n.renk} fillOpacity={0.16} />}
              {n.renkler.length > 1 && (
                <circle cx={x} cy={y} r={px(7.4)} fill="none" stroke={n.renkler[1]} strokeWidth={px(1.6)} strokeOpacity={0.75} />
              )}
              <circle
                cx={x}
                cy={y}
                r={px(uc ? 5.8 : 4.4)}
                fill={uc || n.gidilmis ? n.renk : '#ffffff'}
                stroke={n.gidilmis ? '#8b7f74' : n.renk}
                strokeWidth={px(2)}
              />
              {n.tekne && (
                <circle cx={x + px(7)} cy={y - px(7)} r={px(2.6)} fill="#a98545" stroke="#fff" strokeWidth={px(1)} />
              )}
            </g>
          )
        })}

        {/* Etiketler ayrı katmanda — hiçbir işaretin altında kalmasın */}
        <g className="map-labels">
          {gorunenDuraklar.map((n) => {
            const dy = etiketler.get(n.ad)
            if (dy == null) return null
            const aktif = aktifDurak && aktifDurak.ad === n.ad
            return (
              <text
                key={n.ad}
                className="map-label"
                x={n.xy[0]}
                y={n.xy[1] + px(dy)}
                textAnchor="middle"
                fontSize={px(12.5)}
                fill={aktif ? n.renk : n.gidilmis ? '#8b7f74' : '#14202a'}
                stroke="#f2f6f7"
                strokeWidth={px(3.6)}
                paintOrder="stroke"
              >
                {n.ad}
              </text>
            )
          })}
        </g>
      </svg>

      <div className="map-legend">
        {rotalar.map((r, i) => (
          <span className="map-legend-item" key={r.tur.id}>
            <i style={{ background: r.renk, borderStyle: i === 0 ? 'solid' : 'dashed' }} />
            {r.tur.kisaAd}
          </span>
        ))}
        {rotalar.some((r) => r.noktalar.some((n) => n.tekne)) && (
          <span className="map-legend-item map-legend-note">
            <i className="dot-gold" /> tekne / koy turu durağı
          </span>
        )}
        {rotalar.length > 0 && (
          <span className="map-legend-item map-legend-note">
            <i className="dash-ist" /> İstanbul’a gidiş–dönüş
          </span>
        )}
        {rotalar.length === 0 && <span className="map-legend-note">Karşılaştırmak için tur seç</span>}
      </div>

      <div className="map-zoom" onPointerDown={(e) => e.stopPropagation()}>
        <button onClick={() => zoomla(1 / 1.5)} aria-label="Yakınlaştır" disabled={gorunum.k <= MIN_K + 0.001}>
          +
        </button>
        <button onClick={() => zoomla(1.5)} aria-label="Uzaklaştır" disabled={gorunum.k >= MAX_K - 0.001}>
          −
        </button>
        <button className="sigdir" onClick={sifirla} disabled={gorunum.k >= MAX_K - 0.001 && gorunum.cx == null}>
          Sığdır
        </button>
      </div>

      {gorunum.k < MAX_K - 0.001 && <div className="map-zoom-rozet num">{yakinlik}×</div>}

      <div className="map-ipucu">Tekerlekle yakınlaştır · sürükleyerek gez</div>

      {aktifDurak && (
        <div className="map-pop" key={aktifDurak.ad} onPointerDown={(e) => e.stopPropagation()}>
          <button className="map-pop-close" onClick={() => onDurakSec(null)} aria-label="Kapat">
            ×
          </button>
          <div className="map-pop-eyebrow" style={{ color: aktifDurak.renk }}>
            {(aktifDurak.turlar || [aktifDurak.turAd]).join(' · ')}
          </div>
          <div className="map-pop-title serif">{aktifDurak.ad}</div>
          <div className="map-pop-tags">
            {aktifDurak.deniz && <span>🌊 Deniz</span>}
            {aktifDurak.plaj && <span>🏖️ Plaj</span>}
            {aktifDurak.tekne && <span>🚤 Tekne</span>}
            {aktifDurak.tarihi && <span>🏛️ Tarihi</span>}
            {aktifDurak.doga && <span>🌿 Doğa</span>}
            {aktifDurak.gidilmis && <span>⚠️ Daha önce gidildi</span>}
          </div>
          {aktifDurak.sure && (
            <div className="map-pop-row">
              <span>⏱️ Program süresi</span>
              <b>{aktifDurak.sure}</b>
            </div>
          )}
          {aktifDurak.not && <p className="map-pop-note">{aktifDurak.not}</p>}
        </div>
      )}
    </div>
  )
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max)
}
