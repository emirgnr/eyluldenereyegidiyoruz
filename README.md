# Eylül'de Nereye Gidiyoruz 🌊

4–13 Eylül 2026 için **İstanbul çıkışlı, deniz ve koy odaklı Ege & Akdeniz turlarının** kişisel
karşılaştırma ve karar verme aracı.

**Tarih kuralı:** 4 Eylül ve 13 Eylül sabit tur tarihi değil, *arama aralığının sınırlarıdır*.
Çıkış günü aralıkta herhangi bir gün olabilir; dönüşün 13 Eylül'ü geçmemesi yeterlidir.
**Bütçe kuralı:** 17.000 TL yalnızca kişi başı paket satış fiyatına uygulanır; ekstra ücretler
ayrıca gösterilir ama elemeye dahil edilmez.

Sayfadaki tüm tur verileri (tarih, fiyat, otel gecesi, tekne turu durumu, gün gün program)
tur firmalarının kendi sayfalarından çıkarılmış **gerçek verilerdir**. Doğrulanamayan her alan
sayfada açıkça _"Bilgi doğrulanamadı"_ olarak işaretlenir.

## Çalıştırma

```bash
npm install
npm run dev      # geliştirme sunucusu
npm run build    # dist/index.html — tek dosyalık, tamamen bağımsız çıktı
npm run preview  # üretim çıktısını önizle
npm run artifact # dist/index.html'i gömülebilir tek parça artifact.html'e çevirir
```

`npm run build` sonucu oluşan `dist/index.html` hiçbir dış dosyaya bağlı değildir (fotoğraflar ve
harita geometrisi dosyanın içine gömülüdür); çift tıklayarak açabilir, e-posta ile gönderebilir veya
sunum makinesine kopyalayabilirsin. `npm run artifact` ise aynı çıktıyı, `<html>`/`<head>`
sarmalayıcısı olmadan başka bir sayfaya gömülebilecek `artifact.html` biçiminde üretir.

## Doğrulama

Sayfa başsız tarayıcıyla test edildi. **320 / 360 / 390 / 414 / 440 / 480 / 600 / 768 / 834 /
1024 / 1280 / 1680 px** genişliklerinde:

- yatay taşma yok, kutusundan taşan kutu/metin yok, JavaScript hatası yok
- görsellerin tamamı yükleniyor (12/12)
- dokunmatik bağlamda tüm etkileşimli öğeler ≥ 40 px (birincil hedefler 44 px)

Dokunmatik cihaz benzetimiyle (`isMobile`, `hasTouch`) filtre çipleri, tarih aralığı seçicisi,
sıralama listesi, gün gün program penceresi, en fazla 3 turluk karşılaştırma seçimi, haritanın
parmakla sürüklenmesi/iki parmakla yakınlaştırılması ve durak pop-up'ı çalışıyor. Harita
sürüklemesi bırakıldığı yerde kalıyor (sapma 0,00 birim) ve sürüklerken metin seçilmiyor.
Beş turun bağlantısı da HTTP 200 dönüyor.

## Harita hakkında

Harita **hiçbir API anahtarı veya harita servisi gerektirmez.** Türkiye ve Yunanistan kıyı
geometrisi [Natural Earth](https://www.naturalearthdata.com/) 10m veri setinden (kamu malı)
üretilip Web Mercator ile projekte edilmiş, Douglas–Peucker ile sadeleştirilmiş ve SVG yolu olarak
`src/data/map-paths.js` dosyasına gömülmüştür. Durak koordinatları `src/lib/geo.js` içindedir ve
nokta-poligon testleriyle doğrulanmıştır (kara/deniz/ada ayrımı).

## Dizin yapısı

```
src/
  data/
    tours.js        # araştırma çıktısı — turlar, elenenler, kaynaklar
    map-paths.js    # üretilmiş kıyı geometrisi (SVG path)
  lib/
    geo.js          # projeksiyon + destinasyon koordinatları
    scoring.js      # "Emir için Uyum Skoru" ağırlıkları ve hesabı
  components/
    RouteMap.jsx        # interaktif rota haritası (sürükle / yakınlaştır / sıkıştır)
    RouteThumb.jsx      # kart görselindeki mini rota haritası
    TourCard.jsx        # tur kartı
    ProgramModal.jsx    # gün gün program penceresi
    CompareTable.jsx    # 2–3 tur karşılaştırma tablosu
    Secim.jsx           # sayfanın tasarımına uyan açılır liste (<select> yerine)
    ScoreRing.jsx       # uyum skoru halkası
    ScoreBreakdown.jsx  # puanın nasıl oluştuğunun kırılımı
  App.jsx
  styles.css        # tasarım sistemi (renk, tipografi, boşluk)
  components.css    # bileşen stilleri
```

## Puanlama

`src/lib/scoring.js` içindeki ağırlıklar kullanıcının öncelik sırasından gelir:

| Kriter           | Ağırlık |
| ---------------- | ---------: |
| Deniz            |        %30 |
| Tekne / koy      |        %25 |
| Yeni yer         |        %20 |
| Konaklama        |        %10 |
| Fiyat/performans |        %10 |
| Doğal güzellik |         %5 |

Her turun alt puanları `tours.js` içinde `skor.gerekce` alanında gerekçelendirilir; sayfada
"%X uyum nasıl hesaplandı?" düğmesiyle görülebilir.

## Fotoğraflar

Kullanılan destinasyon fotoğrafları Wikimedia Commons'tan alınmış, serbest lisanslı ve
**görsel olarak doğrulanmış** karelerdir. Her fotoğrafın altında yer adı, fotoğrafçı ve lisans
bilgisi görünür. Doğrulayamadığımız yerler için stok fotoğraf yerine turun kendi rotasından
üretilen mini harita kullanılır.
