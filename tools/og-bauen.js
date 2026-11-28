// Teilen-Bild je Betrieb: e/<kürzel>/og-v1.jpg (1200×630), erscheint in der Link-Vorschau von WhatsApp und E-Mail.
// Aufruf: npm run og            (nur fehlende Bilder)
//         npm run og -- --alle  (alle neu, z. B. nach einer Änderung an tools/og-vorlage.html)
//         npm run og -- grueter (nur dieser Betrieb)
// Braucht Chrome (siehe tools/server.js). Firmenname geändert → Bild für diesen Betrieb neu bauen.
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer-core');
const { ROOT, start, chrome } = require('./server');
const { alle, LEISTUNGEN, OG_BILD } = require('./entwurf-bauen');

async function bauen(wahl, alles) {
  const liste = alle().filter((s) => (wahl.length ? wahl.includes(s.k) : alles || !fs.existsSync(path.join(ROOT, 'e', s.k, OG_BILD))));
  if (!liste.length) return [];
  const srv = await start();
  const browser = await puppeteer.launch({ executablePath: chrome(), headless: 'new' });
  const seite = await browser.newPage();
  await seite.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  for (const s of liste) {
    const L = LEISTUNGEN[(s.b.leistungen || ['innen'])[0]];
    await seite.goto(srv.url + '/tools/og-vorlage.html', { waitUntil: 'networkidle0' });
    await seite.evaluate(async (firma, ort, arbeit, preis) => {
      const h = document.getElementById('firma');
      h.textContent = firma;
      document.getElementById('ort').textContent = 'Malerarbeiten in ' + ort;
      document.getElementById('arbeit').textContent = arbeit;
      document.getElementById('preis').textContent = preis;
      await document.fonts.ready;
      // Schrift so gross wie möglich: höchstens 3 Zeilen und kein Wort breiter als die Spalte.
      for (let px = 76; px >= 34; px -= 2) { h.style.fontSize = px + 'px'; if (h.scrollWidth <= h.clientWidth && h.offsetHeight <= px * 3.05) break; }
    }, s.b.firma, s.b.ort, L[2], s.html.match(/id="preis">([^<]+)</)[1]);
    const ziel = path.join(ROOT, 'e', s.k, OG_BILD);
    await seite.screenshot({ path: ziel, type: 'jpeg', quality: 84 });
    console.log(`e/${s.k}/${OG_BILD}  ${Math.round(fs.statSync(ziel).size / 1024)} KB  –  ${s.b.firma}`);
  }
  await browser.close(); srv.stop();
  return liste;
}

if (require.main === module) {
  const a = process.argv.slice(2);
  bauen(a.filter((x) => !x.startsWith('--')), a.includes('--alle')).then((l) => { if (!l.length) console.log('Alle Teilen-Bilder sind da. Neu bauen: npm run og -- --alle'); })
    .catch((e) => { console.error(e.message); process.exit(1); });
}
module.exports = { bauen };
