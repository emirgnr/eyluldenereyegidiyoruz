/**
 * "Emir için Uyum Skoru"
 * Ağırlıklar doğrudan kullanıcının öncelik sırasından geliyor.
 * Alt skorlar 0–10 arasıdır ve her biri turun gerçek program verisinden türetilir
 * (bkz. src/data/tours.js -> skor.gerekce).
 */
export const AGIRLIKLAR = [
  { key: 'deniz', ad: 'Deniz', w: 0.3, ipucu: 'Plaj/koy zamanı, denize sıfır konaklama, serbest yüzme süresi' },
  { key: 'tekne', ad: 'Tekne & koy', w: 0.25, ipucu: 'Tekne turu dahil mi, kaç tekne turu var, koy sayısı' },
  { key: 'yeniYer', ad: 'Yeni yer', w: 0.2, ipucu: 'Daha önce gidilmemiş farklı durak sayısı ve çeşitliliği' },
  { key: 'konaklama', ad: 'Konaklama', w: 0.1, ipucu: 'Otel gece sayısı, otel konumu ve kategorisi' },
  { key: 'fiyat', ad: 'Fiyat / performans', w: 0.1, ipucu: 'Paket fiyatının bütçeye ve içeriğe oranı' },
  { key: 'doga', ad: 'Doğal güzellik', w: 0.05, ipucu: 'Kanyon, şelale, milli park, doğal koy ve manzara durakları' },
]

export function uyumSkoru(tur) {
  const s = tur.skor || {}
  const toplam = AGIRLIKLAR.reduce((acc, a) => acc + (Number(s[a.key]) || 0) * a.w, 0)
  return Math.round(toplam * 10)
}

export function kirilim(tur) {
  const s = tur.skor || {}
  return AGIRLIKLAR.map((a) => ({
    ...a,
    puan: Number(s[a.key]) || 0,
    katki: +(((Number(s[a.key]) || 0) * a.w) * 10).toFixed(1),
  }))
}

/**
 * BÜTÇE KURALI
 * 17.000 TL yalnızca PAKET SATIŞ FİYATI için üst sınırdır.
 * Ekstra ücretler (tekne, müze, ören yeri, isteğe bağlı turlar) ayrıca gösterilir
 * ama eleme kriterine dahil edilmez.
 */
export const BUTCE = 17000

/** Arama aralığı sınırları — sabit tur tarihi değil. */
export const ARALIK = { bas: '2026-09-04', son: '2026-09-13' }

/**
 * Ekstra ücretlerin toplamı.
 * Tur firmaları ekstra tekne turlarının TL tutarını çoğu zaman YAYIMLAMIYOR;
 * tutarı bilinmeyen kalem varsa `belirsiz: true` döner ve toplam "tahmini alt sınır" olur.
 */
export function ekstraToplam(tur) {
  const kalemler = tur.ekstralar || []
  const bilinen = kalemler.filter((e) => e.tutar != null)
  const bilinmeyen = kalemler.filter((e) => e.tutar == null)
  return {
    tutar: bilinen.reduce((a, e) => a + Number(e.tutar), 0),
    belirsiz: bilinmeyen.length > 0,
    bilinmeyenSayisi: bilinmeyen.length,
  }
}

/** Paket fiyatı + ekstralar. Bilinmeyen kalem varsa alt sınırdır. */
export function tahminiToplam(tur) {
  if (tur.paketFiyat == null) return null
  return tur.paketFiyat + ekstraToplam(tur).tutar
}

/** Eleme kriteri yalnızca paket fiyatına bakar. */
export function butceyeUyuyorMu(tur) {
  return tur.paketFiyat != null && tur.paketFiyat <= BUTCE
}

export const tl = (n) =>
  n == null ? '—' : new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n) + ' TL'

export const tlKisa = (n) =>
  n == null ? '—' : new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n)

/* ---------------------------------------------------------------- tarih */

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

/** '2026-09-06' -> gün numarası (6) */
export const gunNo = (iso) => Number(String(iso).slice(8, 10))

/** '2026-09-06' + '2026-09-11' -> '6 – 11 Eylül 2026' */
export function tarihAraligi(basIso, sonIso) {
  const b = gunNo(basIso)
  const s = gunNo(sonIso)
  const ay = AYLAR[Number(String(basIso).slice(5, 7)) - 1]
  const yil = String(basIso).slice(0, 4)
  return `${b} – ${s} ${ay} ${yil}`
}

/** Aralığa tamamen sığıyor mu? */
export function araliktaMi(tur) {
  return tur.cikisISO >= ARALIK.bas && tur.donusISO <= ARALIK.son
}

/**
 * Firmanın ilan ettiği program günü sayısı.
 * cikisISO/donusISO gerçek çıkış ve İstanbul'a varış günleridir (aralık filtresi bunları kullanır);
 * program günü sayısı bundan farklı olabilir — örneğin dönüş gece yolculuğuysa.
 */
export const gunSayisi = (tur) => tur.gun ?? gunNo(tur.donusISO) - gunNo(tur.cikisISO) + 1

/* ---------------------------------------------------------------- taksit */

/**
 * Peşin fiyatına (vade farksız) maksimum taksit sayısı.
 * TatilBudur'un taksit tablosunda "Toplam Fiyat" sütunu tek çekimle aynı kaldığı en yüksek
 * taksit sayısı; TatilSepeti'nde sayfada ilan edilen taksit sayısı.
 */
export const pesinTaksit = (tur) => tur.taksit?.pesin ?? 0

/** Aynı turun başka platformdaki listelemesi taksit açısından daha mı iyi? */
export function taksitAvantaji(tur) {
  if (!tur.capraz) return null
  const fark = tur.capraz.taksit - pesinTaksit(tur)
  return fark > 0 ? fark : null
}

/* ------------------------------------------------------------ sıralama */

export const SIRALAMALAR = [
  { key: 'uyum', ad: '⭐ Sana en uygun', fn: (a, b) => uyumSkoru(b) - uyumSkoru(a) },
  { key: 'erken', ad: '📅 En erken çıkan', fn: (a, b) => a.cikisISO.localeCompare(b.cikisISO) },
  { key: 'gec', ad: '📅 En geç çıkan', fn: (a, b) => b.cikisISO.localeCompare(a.cikisISO) },
  { key: 'uzun', ad: '🗓️ En uzun tatil', fn: (a, b) => gunSayisi(b) - gunSayisi(a) },
  { key: 'kisa', ad: '🗓️ En kısa tatil', fn: (a, b) => gunSayisi(a) - gunSayisi(b) },
  { key: 'ucuz', ad: '💰 En ucuz paket', fn: (a, b) => (a.paketFiyat ?? 1e9) - (b.paketFiyat ?? 1e9) },
  { key: 'taksit', ad: '💳 Peşin fiyatına en çok taksit', fn: (a, b) => pesinTaksit(b) - pesinTaksit(a) },
  { key: 'deniz', ad: '🌊 En çok deniz', fn: (a, b) => (b.skor?.deniz || 0) - (a.skor?.deniz || 0) },
  { key: 'tekne', ad: '🚤 Tekne dahil olanlar', fn: (a, b) => (b.skor?.tekne || 0) - (a.skor?.tekne || 0) },
  { key: 'yeni', ad: '🗺️ En çok yeni yer', fn: (a, b) => (b.yeniYerSayisi || 0) - (a.yeniYerSayisi || 0) },
  { key: 'gece', ad: '🏨 En uzun konaklama', fn: (a, b) => (b.geceOtel || 0) - (a.geceOtel || 0) },
  {
    key: 'perf',
    ad: '❤️ En iyi fiyat/performans',
    fn: (a, b) => uyumSkoru(b) / Math.max(1, b.paketFiyat || 1e9) - uyumSkoru(a) / Math.max(1, a.paketFiyat || 1e9),
  },
]
