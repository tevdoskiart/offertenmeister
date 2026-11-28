// Erzeugt die persönlichen Entwurf-Seiten /e/<kürzel>/index.html aus tools/betriebe.json und tools/entwurf-vorlage.html,
// dazu je weiterem Ort eine Ortsseite /e/<kürzel>/maler-<ort>/index.html aus tools/ort-vorlage.html.
// Jede Seite trägt die Betriebsdaten für Google als JSON-LD (schema.org «HousePainter»).
// Aufruf: npm run entwurf   (danach committen; die Seiten sind fertige, statische HTML-Dateien)
// Neuer Betrieb = neuer Eintrag in betriebe.json. Felder:
//   firma, ort, mobile (Schweizer Handynummer «079 123 45 67»)  Pflicht
//   ansprache   «Herr Muster» → «Grüezi Herr Muster» (leer = «Grüezi»)
//   leistungen  Schlüssel aus LEISTUNGEN unten, 2 bis 4 Stück (Standard: innen, fassade, tapeten, renovation)
//   orte        weitere Orte des Einsatzgebiets, z. B. ["Kriens", "Emmen"] (höchstens 6); jeder bekommt eine Ortsseite
//   farbe       petrol (Standard) | blau | gruen | weinrot | graphit
//   logo        Dateiname im Ordner e/<kürzel>/, z. B. "logo.webp" (nur ein Logo, das der Betrieb selbst öffentlich verwendet)
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OM_WA = '38978338208';
const OM_MAIL = 'info@offertenmeister.ch';

// [Titel der Karte, Text der Karte, Name im Rechner, CHF min, CHF max pro m²] – Preise sind Beispiele.
const LEISTUNGEN = {
  innen: ['Innenräume', 'Wände, Decken, Türen und Fensterrahmen. Sauber abgedeckt, sauber übergeben.', 'Wände und Decken streichen', 24, 34],
  fassade: ['Fassaden', 'Reinigen, ausbessern, streichen. Mit Gerüst aus einer Hand.', 'Fassade streichen', 45, 70],
  tapeten: ['Tapeten', 'Alte Tapeten entfernen, Untergrund vorbereiten, neu tapezieren.', 'Tapezieren', 30, 45],
  renovation: ['Renovation', 'Wohnung nach Auszug, Risse und Wasserflecken, Abgabe ohne Ärger.', 'Wohnung nach Auszug renovieren', 38, 55],
  dekor: ['Dekorputz', 'Spachteltechnik, Kalkputz und fugenlose Flächen für Wohnräume und Bäder.', 'Dekorputz und Spachteltechnik', 60, 110],
  lack: ['Holz und Lack', 'Türen, Fenster, Täfer und Treppen schleifen und neu lackieren.', 'Holzwerk lackieren', 40, 65],
  gips: ['Gipserarbeiten', 'Wände und Decken verputzen, Trockenbau, Risse dauerhaft sanieren.', 'Wände verputzen', 35, 60],
};
const STANDARD = ['innen', 'fassade', 'tapeten', 'renovation'];
const FARBEN = { petrol: '#0e4a57', blau: '#173f73', gruen: '#1f5a3a', weinrot: '#6d1f2b', graphit: '#2b2723' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const chf = (n) => String(Math.round(n / 10) * 10).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
const waNummer = (mobile) => '41' + mobile.replace(/\s/g, '').replace(/^0/, '');
// «Wangen bei Olten» → «maler-wangen-bei-olten», «Domat/Ems» → «maler-domat-ems», «Rüti ZH» → «maler-rueti-zh»
const ortSlug = (ort) => 'maler-' + ort.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const liste = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' und ' + a[a.length - 1] : a[0]);
const ORIGIN = 'https://offertenmeister.ch';

// Betriebsdaten für Google. Nur Angaben, die stimmen: keine Bewertungen, keine Öffnungszeiten, keine Preise.
// «<» wird maskiert, damit ein Firmenname das <script> nicht schliessen kann.
function schema(k, b) {
  const L = (b.leistungen || STANDARD).map((x) => LEISTUNGEN[x]);
  const daten = {
    '@context': 'https://schema.org',
    '@type': 'HousePainter',
    '@id': `${ORIGIN}/e/${k}/#betrieb`,
    name: b.firma,
    url: `${ORIGIN}/e/${k}/`,
    telephone: '+' + waNummer(b.mobile),
    address: { '@type': 'PostalAddress', addressLocality: b.ort, addressCountry: 'CH' },
    areaServed: [b.ort, ...(b.orte || [])].map((o) => ({ '@type': 'City', name: o })),
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Malerarbeiten', itemListElement: L.map((x) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: x[2] } })) },
  };
  return `<script type="application/ld+json">${JSON.stringify(daten).replace(/</g, '\\u003c')}</script>`;
}

function pruefen(k, b) {
  const fehler = (t) => { throw new Error(`betriebe.json «${k}»: ${t}`); };
  if (!/^[a-z0-9-]+$/.test(k)) fehler('Kürzel nur a–z, 0–9 und Bindestrich');
  for (const f of ['firma', 'ort', 'mobile']) if (!b[f] || typeof b[f] !== 'string') fehler(`Feld ${f} fehlt`);
  if (!/^0\d{2} \d{3} \d{2} \d{2}$/.test(b.mobile)) fehler('mobile im Format «079 123 45 67»');
  const l = b.leistungen || STANDARD;
  if (l.length < 2 || l.length > 4) fehler('2 bis 4 Leistungen');
  for (const x of l) if (!LEISTUNGEN[x]) fehler(`Leistung «${x}» gibt es nicht`);
  if (b.farbe && !FARBEN[b.farbe]) fehler(`Farbe «${b.farbe}» gibt es nicht`);
  if (b.logo && !/^[a-z0-9-]+\.(webp|png|svg)$/.test(b.logo)) fehler('logo: Dateiname wie «logo.webp»');
  const o = b.orte || [];
  if (!Array.isArray(o) || o.length > 6) fehler('orte: Liste mit höchstens 6 Orten');
  const slugs = o.map((x) => (typeof x === 'string' && x.trim() ? ortSlug(x) : fehler('orte: leerer Eintrag')));
  if (o.includes(b.ort)) fehler('orte: der Hauptort gehört nicht in die Liste');
  if (new Set(slugs).size !== slugs.length || slugs.includes('maler-')) fehler('orte: doppelter oder ungültiger Ort');
}

// Alle Platzhalter der Vorlagen. «ort» = Ort, für den die Seite gilt (Hauptort oder ein Ort aus «orte»).
function werte(k, b, ort) {
  pruefen(k, b);
  const L = (b.leistungen || STANDARD).map((x) => LEISTUNGEN[x]);
  const wa = waNummer(b.mobile);
  const thema = b.farbe || 'petrol';
  const orte = [b.ort, ...(b.orte || [])];
  const preis = `CHF ${chf(80 * L[0][3])}–${chf(80 * L[0][4])}`;
  const anfrage = `Grüezi ${b.firma}\nIch möchte eine Offerte.\nArbeit: ${L[0][2]}\nFläche: ca. 80 m²\nRichtpreis laut Website: ${preis}\nOrt: ${ort}\nFotos schicke ich gleich nach.`;
  const ja = `Grüezi Herr Tevdoski, der Entwurf für ${b.firma} gefällt mir. Bitte melden Sie sich.`;
  const link = (o) => (o === b.ort ? `/e/${k}/` : `/e/${k}/${ortSlug(o)}/`);
  const chips = orte.map((o) => (o === ort ? `<li>${esc(o)}</li>` : `<li><a href="${link(o)}">${esc(o)}</a></li>`)).join('');
  return {
    KUERZEL: k,
    FIRMA: esc(b.firma),
    ORT: esc(ort),
    SITZ: esc(b.ort),
    SLUG: ortSlug(ort),
    MOBILE: esc(b.mobile),
    WA: wa,
    THEMA: thema,
    THEMA_FARBE: FARBEN[thema],
    LOGO: b.logo ? `<img src="/e/${k}/${b.logo}" alt="" height="40">` : '<i></i>',
    H1: `Malerarbeiten in ${esc(b.ort)} und Umgebung.`,
    LEAD: esc(liste(L.map((x) => x[0])) + '.'),
    OPTIONEN: L.map((x) => `      <option value="${x[3]},${x[4]}">${esc(x[2])}</option>`).join('\n'),
    PREIS: preis,
    SENDEN: `https://wa.me/${wa}?text=${encodeURIComponent(anfrage)}`,
    KARTEN: L.map((x, i) => `    <div class="karte"><div class="farbe f${i + 1}"></div><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></div>`).join('\n'),
    GEBIET: orte.length > 1
      ? `<ul class="orte">${chips}</ul><p>Beispiel-Orte. Jeder Ort hat eine eigene Seite, tippen Sie einen an. So kann Google Ihre Seite zeigen, wenn jemand dort einen Maler sucht. Die Liste passe ich nach Ihren Angaben an.</p>`
      : `<p>${esc(b.ort)} und Umgebung. Sie nennen mir die Orte, in denen Sie arbeiten. So findet Google Ihre Seite, wenn jemand dort einen Maler sucht.</p>`,
    ORTE: `<ul class="orte">${chips}</ul>`,
    SCHEMA: schema(k, b),
    GRUSS: b.ansprache ? `Grüezi ${esc(b.ansprache)}` : 'Grüezi',
    JA_WA: `https://wa.me/${OM_WA}?text=${encodeURIComponent(ja)}`,
    JA_MAIL: `mailto:${OM_MAIL}?subject=${encodeURIComponent('Entwurf ' + b.firma)}&amp;body=${encodeURIComponent(ja)}`,
  };
}

function fuellen(vorlage, W) {
  return vorlage.replace(/%([A-Z0-9_]+)%/g, (m, n) => {
    if (!(n in W)) throw new Error(`Vorlage: unbekannter Platzhalter ${m}`);
    return W[n];
  });
}

const seite = (k, b, vorlage) => fuellen(vorlage, werte(k, b, b.ort));
const ortSeite = (k, b, ort, vorlage) => fuellen(vorlage, werte(k, b, ort));

const lesen = (name) => fs.readFileSync(path.join(__dirname, name), 'utf8');
const betriebe = () => Object.entries(JSON.parse(lesen('betriebe.json')));

function alle() {
  const vorlage = lesen('entwurf-vorlage.html');
  return betriebe().map(([k, b]) => ({ k, b, datei: `e/${k}/index.html`, html: seite(k, b, vorlage) }));
}

// Ortsseiten: eine je Eintrag in «orte».
function alleOrte() {
  const vorlage = lesen('ort-vorlage.html');
  return betriebe().flatMap(([k, b]) => (b.orte || []).map((ort) => (
    { k, b, ort, slug: ortSlug(ort), datei: `e/${k}/${ortSlug(ort)}/index.html`, html: ortSeite(k, b, ort, vorlage) })));
}

if (require.main === module) {
  const orte = alleOrte();
  for (const s of [...alle(), ...orte]) {
    const ziel = path.join(ROOT, s.datei);
    fs.mkdirSync(path.dirname(ziel), { recursive: true });
    fs.writeFileSync(ziel, s.html);
  }
  for (const s of alle()) console.log(`https://offertenmeister.ch/e/${s.k}/  –  ${s.b.firma}, ${s.b.ort}` + (s.b.orte ? `  (+ ${s.b.orte.length} Ortsseiten)` : ''));
}

module.exports = { alle, alleOrte, seite, ortSeite, ortSlug, schema, LEISTUNGEN, FARBEN };
