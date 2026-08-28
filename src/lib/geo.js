import { MAP } from '../data/map-paths.js'

// Web Mercator — map-paths.js üretilirken kullanılan projeksiyonun aynısı.
const mercY = (lat) => (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))

const B = MAP.bbox
const W = MAP.viewBox[2]
const SCALE = W / (B.e - B.w)
const Y0 = mercY(B.n)

/** [lat, lon] -> SVG viewBox koordinatı */
export function project(lat, lon) {
  return [(lon - B.w) * SCALE, (Y0 - mercY(lat)) * SCALE]
}

export const VIEWBOX = MAP.viewBox
export const PATHS = { turkey: MAP.turkey, greece: MAP.greece, cyprus: MAP.cyprus, bulgaria: MAP.bulgaria }

/**
 * Rotalarda geçen yerlerin gerçek koordinatları (lat, lon).
 * Kaynak: standart coğrafi koordinatlar; harita üzerinde konum doğrulaması yapıldı.
 */
export const PLACES = {
  'İstanbul': [41.0082, 28.9784],
  'Bursa': [40.1826, 29.0665],
  'İzmir': [38.4237, 27.1428],
  'Çanakkale': [40.1553, 26.4142],
  'Assos': [39.4877, 26.3378],
  'Adatepe': [39.5583, 26.55],
  'Bozcaada': [39.829, 26.04],
  'Gökçeada': [40.19, 25.9],
  'Ayvalık': [39.3167, 26.6944],
  'Cunda': [39.34, 26.67],
  'Bergama': [39.12, 27.18],
  'Foça': [38.669, 26.757],
  'Çeşme': [38.3226, 26.3057],
  'Alaçatı': [38.2778, 26.3722],
  'Ilıca': [38.3167, 26.3667],
  'Ildırı': [38.3833, 26.4833],
  'Karaburun': [38.64, 26.51],
  'Sığacık': [38.1975, 26.79],
  'Teos': [38.1833, 26.7833],
  'Gümüldür': [38.07, 27.03],
  'Özdere': [38.03, 27.12],
  'Kuşadası': [37.858, 27.256],
  'Selçuk': [37.949, 27.368],
  'Efes': [37.941, 27.341],
  'Şirince': [37.945, 27.445],
  'Priene': [37.6597, 27.2983],
  'Milet': [37.5306, 27.2778],
  'Didim': [37.3856, 27.2569],
  'Altınkum': [37.35, 27.27],
  'Bafa Gölü': [37.49, 27.45],
  'Güllük': [37.24, 27.59],
  'Bodrum': [37.0344, 27.4305],
  'Gümüşlük': [37.05, 27.23],
  'Turgutreis': [37.0, 27.26],
  'Yalıkavak': [37.105, 27.29],
  'Bitez': [37.03, 27.37],
  'Torba': [37.08, 27.43],
  'Milas': [37.3164, 27.7839],
  'Ören': [37.0333, 27.9667],
  'Sedir Adası': [37.0333, 28.1667],
  'Akyaka': [37.05, 28.32],
  'Gökova': [37.06, 28.34],
  'Muğla': [37.2153, 28.3636],
  'Marmaris': [36.855, 28.274],
  'İçmeler': [36.8, 28.22],
  'Turunç': [36.77, 28.24],
  'Selimiye': [36.705, 28.09],
  'Bozburun': [36.69, 28.04],
  'Datça': [36.725, 27.687],
  'Knidos': [36.687, 27.372],
  'Palamutbükü': [36.68, 27.54],
  'Köyceğiz': [36.97, 28.69],
  'Dalyan': [36.83, 28.64],
  'İztuzu': [36.79, 28.62],
  'Kaunos': [36.83, 28.62],
  'Sarıgerme': [36.75, 28.75],
  'Göcek': [36.75, 28.94],
  'Fethiye': [36.621, 29.116],
  'Ölüdeniz': [36.549, 29.117],
  'Kayaköy': [36.575, 29.09],
  'Kelebekler Vadisi': [36.54, 29.12],
  'Kabak Koyu': [36.47, 29.1],
  'Saklıkent': [36.487, 29.283],
  'Tlos': [36.555, 29.423],
  'Xanthos': [36.356, 29.32],
  'Letoon': [36.34, 29.31],
  'Patara': [36.26, 29.31],
  'Kalkan': [36.265, 29.413],
  'Kaputaş': [36.29, 29.4],
  'Kaş': [36.198, 29.639],
  'Meis': [36.15, 29.58],
  'Üçağız': [36.19, 29.84],
  'Kekova': [36.183, 29.856],
  'Simena': [36.19, 29.86],
  'Demre': [36.244, 29.985],
  'Myra': [36.258, 29.985],
  'Andriake': [36.21, 29.95],
  'Finike': [36.3, 30.15],
  'Olympos': [36.395, 30.472],
  'Çıralı': [36.415, 30.475],
  'Yanartaş': [36.43, 30.47],
  'Adrasan': [36.307, 30.483],
  'Suluada': [36.26, 30.45],
  'Phaselis': [36.523, 30.551],
  'Kemer': [36.602, 30.56],
  'Antalya': [36.8969, 30.7133],
  'Konyaaltı': [36.86, 30.64],
  'Lara': [36.85, 30.83],
  'Düden Şelalesi': [36.86, 30.75],
  'Perge': [36.9611, 30.8536],
  'Aspendos': [36.9394, 31.1725],
  'Termessos': [36.9833, 30.4667],
  'Side': [36.767, 31.389],
  'Manavgat': [36.786, 31.443],
  'Alanya': [36.544, 31.999],
  'Pamukkale': [37.92, 29.12],
  'Hierapolis': [37.925, 29.128],
  'Denizli': [37.7765, 29.0864],
  'Salda Gölü': [37.545, 29.68],
  'Aphrodisias': [37.708, 28.725],
  'Afyon': [38.7507, 30.5567],
  'Balıkesir': [39.6484, 27.8826],
  'Edremit': [39.596, 27.024],
  'Küçükkuyu': [39.55, 26.6],
  'Aydın': [37.856, 27.8416],
  'Nazilli': [37.9133, 28.3236],
  'Kaz Dağları': [39.7, 26.85],
  'Köprülü Kanyon': [37.0833, 31.1833],
  'Ulupınar': [36.44, 30.47],
  'Tahtalı Dağı': [36.5578, 30.4536],
  'Kızkumu': [36.751, 28.128],
  'Bayırköy': [36.797, 28.105],
  'Kumlubük': [36.723, 28.298],
  'Babakale': [39.4806, 26.0656],
  'Gülpınar': [39.5333, 26.1333],
  'Kadırga Koyu': [39.4694, 26.2778],
  'Şeytan Sofrası': [39.3025, 26.6392],
  'Sarımsaklı': [39.2794, 26.6597],
  'Ayazma': [39.8106, 26.0247],
  'Köyceğiz': [36.97, 28.69],
  'Urla': [38.3225, 26.7647],
  'Klazomenai': [38.3667, 26.7667],
  'Doğanbey': [37.6833, 27.2333],
  'Dilek Yarımadası': [37.6833, 27.15],
  'Meryem Ana Evi': [37.9119, 27.3319],
  'Truva': [39.9575, 26.2389],
  'Çanakkale Şehitliği': [40.0486, 26.2233],
  'Tahtakuşlar': [39.6167, 26.7833],
  'Akyarlar': [36.9917, 27.2833],
  'Damlataş': [36.5433, 31.9908],
}

/** [lat, lon] döndürür; bilinmeyen yer adları için null. */
export function coordsFor(name) {
  return PLACES[name] || null
}

/**
 * Yer adını doğrudan SVG viewBox koordinatına çevirir.
 * Bileşenler bunu kullanmalı — ham [lat, lon] değil.
 */
export function placeXY(name) {
  const c = PLACES[name]
  return c ? project(c[0], c[1]) : null
}
