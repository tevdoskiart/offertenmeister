// Ein Design für alles: Startseite (css/site.css), Entwürfe (entwurf.css) und Teilen-Bilder (tools/og-vorlage.html)
// verwenden dieselben Farben und dieselbe Schrift. Die Werte stehen in CLAUDE.md, Abschnitt «Design».
// Die beiden Demos haben absichtlich ein eigenes Aussehen und werden hier nicht geprüft.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { read, exists, ROOT } = require('./helpers');
const { alle, OG_BILD } = require('../tools/entwurf-bauen');
const { kuerzel, eintrag, nachrichten } = require('../tools/neu');

const FARBEN = { putz: '#F3ECE4', rot: '#C8261B', 'rot-dunkel': '#A31D14', graphit: '#2B2723', beton: '#CFC8BF', 'text-2': '#5A534C' };
const CSS = ['css/site.css', 'entwurf.css'];
const variable = (css, name) => (css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,6})`)) || [])[1];

test('Farben: Startseite und Entwürfe haben dieselben Werte wie in CLAUDE.md', () => {
  const regeln = read('CLAUDE.md');
  for (const [name, wert] of Object.entries(FARBEN)) {
    assert.ok(regeln.includes(`${name} ${wert}`), `CLAUDE.md nennt ${name} ${wert} nicht mehr`);
    for (const f of CSS) assert.equal((variable(read(f), name) || '').toUpperCase(), wert.toUpperCase(), `${f}: --${name}`);
  }
});

test('Schrift: überall Archivo aus /fonts, Überschriften mit Breite 125, keine fremde Schrift', () => {
  for (const f of [...CSS, 'tools/og-vorlage.html']) {
    const css = read(f);
    assert.ok(css.includes('url(/fonts/archivo.woff2)'), `${f}: Archivo fehlt`);
    assert.match(css, /h1[^{]*\{[^}]*font-stretch:125%[^}]*"wdth" 125/, `${f}: Überschrift ohne Breite 125`);
    const schriften = [...css.matchAll(/@font-face\{font-family:([^;]+);/g)].map((m) => m[1]);
    assert.deepEqual(schriften, ['Archivo'], `${f}: andere Schrift geladen`);
    assert.ok(!/fonts\.googleapis|fonts\.gstatic/.test(css), `${f}: Google Fonts`);
  }
});

test('Entwürfe: nur Farben aus der Palette (plus Akzentfarben je Betrieb), Abstände aus der Reihe 4/8/12/16/20/24/32', () => {
  const css = read('entwurf.css');
  const erlaubt = new Set([...Object.values(FARBEN), '#fff', '#E6DFD6', '#F0A51A', '#3F3933', '#FF8A7F', '#DDD6CD', '#0e4a57', '#173f73', '#1f5a3a', '#6d1f2b'].map((x) => x.toUpperCase()));
  for (const m of css.matchAll(/#[0-9a-fA-F]{3,6}\b/g)) assert.ok(erlaubt.has(m[0].toUpperCase()), `Farbe ${m[0]} gehört nicht zur Palette`);
  for (const m of css.matchAll(/(?:^|[;{])(?:gap|margin(?:-top|-bottom)?|padding):([^;}]+)/g)) {
    for (const px of m[1].matchAll(/(?<![\d.(,])(\d+)px/g)) assert.ok([0, 2, 3, 4, 8, 12, 14, 16, 20, 24, 32].includes(+px[1]), `Abstand ${px[0]} in «${m[0].slice(1)}»`);
  }
});

// Breite und Höhe aus dem JPEG lesen (Marker SOF0/SOF2).
function jpegMasse(buf) {
  for (let i = 2; i < buf.length;) {
    const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (m === 0xc0 || m === 0xc2) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  return [0, 0];
}

test('Teilen-Bild: jeder Betrieb hat sein eigenes (1200×630, unter 300 KB) und die Seiten zeigen darauf (sonst: npm run og)', () => {
  for (const s of alle()) {
    const rel = `e/${s.k}/${OG_BILD}`;
    assert.ok(exists(rel), `${rel} fehlt – npm run og`);
    const buf = fs.readFileSync(path.join(ROOT, rel));
    assert.deepEqual(jpegMasse(buf), [1200, 630], rel);
    assert.ok(buf.length < 300 * 1024, `${rel} ist zu gross für WhatsApp`);
    assert.ok(s.html.includes(`<meta property="og:image" content="https://offertenmeister.ch/${rel}">`));
  }
});

test('npm run neu: Kürzel, Beispiel-Orte, Nachrichten; nichts wird verschickt', () => {
  assert.equal(kuerzel('Malerei Hans Muster & Söhne AG', []), 'muster');
  assert.equal(kuerzel('Malergeschäft Grüter GmbH', ['grueter']), 'grueter-2');
  assert.equal(kuerzel('Maler GmbH', []), 'maler');
  const { k, b } = eintrag(['Maler Muster GmbH', 'Thun', '079 123 45 67', '--ansprache', 'Herr Muster'], ['grueter']);
  assert.equal(k, 'muster');
  assert.deepEqual(b.orte, ['Steffisburg', 'Spiez', 'Heimberg']);
  assert.deepEqual(eintrag(['A Test', 'Thun', '079 123 45 67', '--orte', 'Spiez, Uetendorf'], []).b.orte, ['Spiez', 'Uetendorf']);
  assert.equal(eintrag(['A Test', 'Nirgendwo', '079 123 45 67'], []).b.orte, undefined);
  assert.throws(() => eintrag(['Nur Firma'], []), /Aufruf/);
  assert.throws(() => eintrag(['Maler Muster', 'Thun', '079 123 45 67', '--kuerzel', 'grueter'], ['grueter']), /gibt es schon/);
  const n = nachrichten(k, b);
  assert.ok(n.mail.startsWith('Grüezi Herr Muster\n') && n.mail.includes('https://offertenmeister.ch/e/muster/'));
  assert.ok(n.mail.includes('[EIN SATZ ZU IHRER WEBSITE'), 'persönlicher Satz muss von Hand rein');
  assert.ok(n.mail.includes('Sie möchten keine weiteren E-Mails von mir?') && n.mail.includes('Tetovo'));
  assert.ok(!/ß/.test(n.mail + n.wa));
  assert.ok(n.waLink.startsWith('https://wa.me/41791234567?text='));
  const quelle = read('tools/neu.js');
  assert.ok(!/fetch\(|https\.request|nodemailer|smtp/i.test(quelle), 'das Werkzeug darf nichts verschicken');
});
