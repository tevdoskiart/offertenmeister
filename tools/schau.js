// Sichtprüfung vor dem Push: npm run schau
// Öffnet jede Seite in Chrome bei 1366 px (Computer) und 390 px (Handy), speichert ein Bild in schau/ und meldet:
// horizontales Scrollen, Fehler in der Konsole (auch CSP), fehlende Dateien, kaputte Bilder, Überschriften, die über den Rand laufen.
// Nur bestimmte Seiten: npm run schau -- /e/grueter/ /angebot/website/
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer-core');
const { ROOT, start, chrome } = require('./server');
const { alle, alleOrte } = require('./entwurf-bauen');

const BREITEN = [1366, 390];
// Feste Seiten + je Farbe/Vorlage ein Entwurf und eine Ortsseite (alle 60+ wären gleich aufgebaut).
function seiten() {
  const e = alle(), o = alleOrte();
  const langerName = [...e].sort((a, b) => b.b.firma.length - a.b.firma.length)[0];
  const langerOrt = [...o].sort((a, b) => b.ort.length - a.ort.length)[0];
  return ['/', '/en/', '/404.html', '/demo/basic/', '/demo/premium/', '/angebot/website/', '/angebot/social/', '/angebot/jetzt/', '/entwurf.html?f=grueter',
    `/e/${e[0].k}/`, `/e/${langerName.k}/`, `/e/${langerOrt.k}/${langerOrt.slug}/`];
}

(async () => {
  const wahl = process.argv.slice(2);
  const liste = wahl.length ? wahl : seiten();
  const ziel = path.join(ROOT, 'schau');
  fs.mkdirSync(ziel, { recursive: true });
  const srv = await start();
  const browser = await puppeteer.launch({ executablePath: chrome(), headless: 'new' });
  let fehler = 0;
  for (const u of liste) for (const w of BREITEN) {
    const seite = await browser.newPage();
    await seite.setViewport({ width: w, height: 900 });
    await seite.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const meldungen = [];
    seite.on('console', (m) => { if (m.type() === 'error') meldungen.push('Konsole: ' + m.text().slice(0, 160)); });
    seite.on('pageerror', (e) => meldungen.push('Script: ' + String(e).slice(0, 160)));
    seite.on('requestfailed', (r) => { if (r.url().startsWith(srv.url) && !/\.mp4/.test(r.url())) meldungen.push('Laden: ' + r.url().replace(srv.url, '')); });
    seite.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(srv.url)) meldungen.push(`${r.status()}: ` + r.url().replace(srv.url, '')); });
    await seite.goto(srv.url + u, { waitUntil: 'networkidle0', timeout: 30000 });
    // Ganze Seite einmal durchscrollen, damit Bilder mit loading="lazy" geladen sind.
    await seite.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } scrollTo(0, 0); });
    await new Promise((r) => setTimeout(r, 300));
    const m = await seite.evaluate(() => {
      const d = document.documentElement, out = [];
      if (d.scrollWidth > d.clientWidth) out.push(`horizontales Scrollen (${d.scrollWidth} > ${d.clientWidth} px)`);
      for (const i of document.images) if (i.complete && i.naturalWidth === 0) out.push('Bild kaputt: ' + i.getAttribute('src'));
      for (const h of document.querySelectorAll('h1,h2,h3')) { const r = h.getBoundingClientRect(); if (r.width && (r.right > d.clientWidth + 1 || r.left < -1)) out.push('Überschrift läuft über den Rand: ' + h.textContent.trim().slice(0, 40)); }
      return out;
    });
    meldungen.push(...m);
    const name = (u.replace(/[?=]/g, '-').replace(/^\/|\/$/g, '').replace(/[\/.]/g, '_') || 'start') + `-${w}.png`;
    await seite.screenshot({ path: path.join(ziel, name), fullPage: true });
    await seite.close();
    const eindeutig = [...new Set(meldungen)];
    fehler += eindeutig.length;
    console.log(`${eindeutig.length ? 'FEHLER' : 'ok    '}  ${String(w).padStart(4)} px  ${u}`);
    for (const x of eindeutig) console.log('          ' + x);
  }
  await browser.close(); srv.stop();
  console.log(fehler ? `\n${fehler} Meldung(en). Bilder: schau/` : `\nAlles in Ordnung. Bilder zum Anschauen: schau/`);
  process.exit(fehler ? 1 : 0);
})().catch((e) => { console.error(e.message); process.exit(1); });
