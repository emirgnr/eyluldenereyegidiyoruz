/**
 * dist/index.html'i tek parça bir Artifact dosyasına (artifact.html) dönüştürür.
 * Artifact yayınlayıcısı sayfayı kendi <!doctype><head><body> sarmalayıcısına koyduğu için
 * bu dosyada doctype/html/head/body etiketi bulunmaz.
 */
import fs from 'node:fs'

const html = fs.readFileSync('dist/index.html', 'utf8')
const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'))

const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || 'Eylül’de Denize Kaçıyoruz'
const links = [...head.matchAll(/<link[^>]*fonts\.(?:googleapis|gstatic)[^>]*>/g)].map((m) => m[0].replace(/\s+/g, ' '))
const styles = [...head.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0])
const scripts = [...head.matchAll(/<script[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0])

const out = [`<title>${title}</title>`, ...links, ...styles, '<div id="root"></div>', ...scripts].join('\n') + '\n'
fs.writeFileSync('artifact.html', out)

console.log(`artifact.html yazıldı — ${(fs.statSync('artifact.html').size / 1024 / 1024).toFixed(2)} MB`)
