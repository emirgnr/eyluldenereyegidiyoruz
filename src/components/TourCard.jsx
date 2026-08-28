import RouteThumb from './RouteThumb.jsx'
import ScoreRing from './ScoreRing.jsx'
import {
  BUTCE,
  ekstraToplam,
  gunSayisi,
  pesinTaksit,
  tahminiToplam,
  tarihAraligi,
  tl,
  tlKisa,
  uyumSkoru,
} from '../lib/scoring.js'

function Tekne({ tekne }) {
  const d = tekne?.durum
  if (d === 'dahil')
    return (
      <div className="boat-line inc">
        <span>🚤 Tekne turu</span>
        <b>FİYATA DAHİL</b>
      </div>
    )
  if (d === 'ekstra')
    return (
      <div className="boat-line extra">
        <span>🚤 Tekne turu</span>
        <b>{tekne.ucret ? `+${tlKisa(tekne.ucret)} TL` : 'EKSTRA · ücret yayımlanmamış'}</b>
      </div>
    )
  if (d === 'yok')
    return (
      <div className="boat-line none">
        <span>🚫 Tekne turu</span>
        <b>YOK</b>
      </div>
    )
  return (
    <div className="boat-line unknown">
      <span>🚤 Tekne turu</span>
      <b>Bilgi doğrulanamadı</b>
    </div>
  )
}

/**
 * Paket fiyatı (eleme kriteri) ile ekstraları ve tahmini toplamı ayrı ayrı gösterir.
 * 17.000 TL sınırı YALNIZCA paket fiyatına uygulanır.
 */
export function FiyatBlogu({ tur }) {
  const ekstra = ekstraToplam(tur)
  const toplam = tahminiToplam(tur)
  const pay = BUTCE - tur.paketFiyat

  return (
    <div className="fiyat">
      <div className="fiyat-ana">
        <div>
          <div className="k">Paket fiyatı</div>
          <div className="v num">{tl(tur.paketFiyat)}</div>
          <div className="sub">kişi başı · 2 kişilik odada</div>
        </div>
        <span className="budget-note">🟢 Bütçenin {tlKisa(pay)} TL altında</span>
      </div>

      <div className="fiyat-alt">
        <div className="fiyat-satir">
          <span>Ekstra ücretler</span>
          <b className="num">
            {ekstra.belirsiz
              ? ekstra.tutar > 0
                ? `+${tlKisa(ekstra.tutar)} TL + yayımlanmamış kalemler`
                : 'Sayfada yayımlanmamış'
              : ekstra.tutar > 0
              ? `+${tlKisa(ekstra.tutar)} TL`
              : 'Yok'}
          </b>
        </div>
        <div className="fiyat-satir toplam">
          <span>Tahmini toplam</span>
          <b className="num">
            {ekstra.belirsiz && <span className="yaklasik">≥ </span>}
            {tl(toplam)}
          </b>
        </div>
      </div>

      {tur.taksit && (
        <div className="taksit-satir" title={tur.taksit.not}>
          <span>💳 Peşin fiyatına taksit</span>
          <b className="num">
            {pesinTaksit(tur)} taksit
            {tur.taksit.sunulan?.length ? (
              <span className="taksit-alt"> · {Math.max(...tur.taksit.sunulan)}’e kadar vade farklı</span>
            ) : null}
          </b>
        </div>
      )}
    </div>
  )
}

export default function TourCard({ tur, secili, onSec, onProgramAc, tint, rank }) {
  const uyum = uyumSkoru(tur)

  return (
    <article className={`card${secili ? ' picked' : ''}`}>
      <div className={`card-visual${tur.foto ? ' has-photo' : ''}`}>
        {tur.foto ? (
          <>
            <img src={tur.foto.src} alt={tur.foto.yer} />
            <span className="photo-caption">{tur.foto.yer}</span>
            <span className="photo-credit">{tur.foto.telif}</span>
          </>
        ) : (
          <RouteThumb tur={tur} tint={tint} />
        )}
        <span className="vtag">
          {tur.bolge} · {tur.duraklar.filter((d) => d.ad !== 'İstanbul').length} durak
        </span>
        <button className={`card-pick${secili ? ' on' : ''}`} onClick={() => onSec(tur.id)} aria-pressed={secili}>
          <span className="box">✓</span>
          <span className="pick-uzun">{secili ? 'Karşılaştırmada' : 'Karşılaştır'}</span>
          <span className="pick-kisa">{secili ? 'Seçildi' : 'Seç'}</span>
        </button>
      </div>

      <div className="card-body">
        <div className="card-top">
          <div>
            {rank && <div className="eyebrow" style={{ marginBottom: 6 }}>#{rank} sırada</div>}
            <h3 className="card-title">{tur.ad}</h3>
            <div className="card-firm">
              {tur.firma} · {tur.kaynakSite}
            </div>
          </div>
          <ScoreRing value={uyum} size={72} />
        </div>

        {/* Tarih kartın en görünür bilgilerinden biri — farklı çıkış tarihleri karşılaştırılabilsin */}
        <div className="card-tarih">
          <div className="ct-aralik serif">{tarihAraligi(tur.cikisISO, tur.donusISO)}</div>
          <div className="ct-detay">
            <span className="num">
              {gunSayisi(tur)} gün / {tur.geceOtel} gece otel
            </span>
            <span className="sep">·</span>
            <span>
              {tur.cikis.saat ? `çıkış ${tur.cikis.saat}` : <span className="unverified">çıkış saati doğrulanamadı</span>}
            </span>
          </div>
          {tur.tarihNot && <div className="ct-not">{tur.tarihNot}</div>}
        </div>

        <div className="stats-row">
          <div className="stat">
            <div className="k">Deniz</div>
            <div className="v sea num">{tur.skor.deniz.toFixed(1)}</div>
          </div>
          <div className="stat">
            <div className="k">Otel</div>
            <div className="v num">{tur.geceOtel} gece</div>
          </div>
          <div className="stat">
            <div className="k">Yeni yer</div>
            <div className="v num">{tur.yeniYerSayisi}</div>
          </div>
          <div className="stat">
            <div className="k">Deniz günü</div>
            <div className="v num">
              {tur.denizGun}/{tur.toplamGun}
            </div>
          </div>
        </div>

        <Tekne tekne={tur.tekne} />

        <div className="route-chips">
          {tur.duraklar
            .filter((d) => d.ad !== 'İstanbul')
            .map((d) => (
              <span key={d.ad} className={`rchip${d.gidilmis ? ' seen' : d.yeni ? ' new' : ''}`} title={d.not || ''}>
                {d.ad}
              </span>
            ))}
        </div>

        <FiyatBlogu tur={tur} />

        {tur.capraz && (
          <a className="capraz" href={tur.capraz.url} target="_blank" rel="noopener noreferrer">
            <div className="capraz-bas">
              <span>Aynı tur {tur.capraz.site}’nde</span>
              <b className="num">
                {tlKisa(tur.capraz.fiyat)} TL · {tur.capraz.taksit} taksit
              </b>
            </div>
            <div className="capraz-not">{tur.capraz.fark}</div>
          </a>
        )}
      </div>

      <div className="card-actions">
        <button className="act" onClick={() => onProgramAc(tur)}>
          Programı gör <span aria-hidden>→</span>
        </button>
        <a className="act primary" href={tur.url} target="_blank" rel="noopener noreferrer">
          Tur sayfası <span aria-hidden>→</span>
        </a>
      </div>

    </article>
  )
}
