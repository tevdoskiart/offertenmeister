// Neuer Betrieb aus einer Zeile: Eintrag, Entwurf, Ortsseiten, Teilen-Bild und die fertigen Nachrichten.
//   npm run neu -- "Maler Muster GmbH" "Thun" "079 123 45 67"
//   npm run neu -- "Maler Muster GmbH" "Thun" "079 123 45 67" --ansprache "Herr Muster" --orte "Spiez, Steffisburg" --farbe blau --kuerzel muster --leistungen innen,fassade,gips
// Danach: npm test, npm run schau, dann pushen. Die Nachrichten werden nur angezeigt, nichts wird verschickt.
// Vor dem Verschicken auf local.ch prüfen: Der Eintrag darf KEINEN Stern («wünscht keine Werbung») haben.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { seite, ortSlug, alle } = require('./entwurf-bauen');

const DATEI = path.join(__dirname, 'betriebe.json');
// Beispiel-Orte aus der Nachbarschaft, wenn --orte fehlt. Auf der Seite als «Beispiel-Orte» beschriftet.
const NACHBARN = JSON.parse(fs.readFileSync(path.join(__dirname, 'nachbarn.json'), 'utf8'));
const FUELLWORT = /^(maler|malerei|malergeschaeft|malerbetrieb|gipser|gipsergeschaeft|und|gmbh|ag|co|sohn|soehne|renovationen|the|der|die|das|[a-z])$/;

function kuerzel(firma, vergeben) {
  const w = ortSlug(firma).replace(/^maler-/, '').split('-').filter((x) => x && !FUELLWORT.test(x));
  const basis = (w[w.length - 1] || ortSlug(firma).replace(/^maler-/, '').split('-')[0] || 'betrieb').slice(0, 20);
  let k = basis;
  for (let i = 2; vergeben.includes(k); i++) k = `${basis}-${i}`;
  return k;
}

function nachrichten(k, b) {
  const gruss = b.ansprache ? `Grüezi ${b.ansprache}` : 'Grüezi';
  const link = `https://offertenmeister.ch/e/${k}/`;
  const mail = `${gruss}

Ich bin Mihajlo Tevdoski, selbst Maler, und baue mit Offertenmeister Websites für Malerbetriebe in der Deutschschweiz.

[EIN SATZ ZU IHRER WEBSITE: was Ihnen konkret aufgefallen ist. Ohne diesen Satz nicht verschicken.]

Darum habe ich für ${b.firma} einen Entwurf gemacht. Er kostet Sie nichts:
${link}

Ihre Kunden rechnen dort den Richtpreis selbst aus und schicken die Anfrage mit Fotos direkt per WhatsApp auf Ihr Handy. Probieren Sie den Rechner kurz aus.

Gefällt Ihnen der Entwurf, ist die Seite in 7 Tagen online. Gefällt er Ihnen nicht, lösche ich ihn. Ein kurzes Ja oder Nein genügt mir.

Freundliche Grüsse
Mihajlo Tevdoski
Offertenmeister
WhatsApp +389 78 338 208
ul. Bane Stefanovski 6, 1200 Tetovo, Nordmazedonien

Sie möchten keine weiteren E-Mails von mir? Eine kurze Antwort genügt.`;
  const wa = `${gruss}, ich bin Mihajlo Tevdoski, selbst Maler. Ich habe für ${b.firma} einen Website-Entwurf mit Preisrechner gemacht, kostenlos und unverbindlich: ${link} Gefällt er Ihnen? Ein kurzes Ja oder Nein genügt.`;
  return { betreff: `Entwurf für Ihre Website, ${b.firma}`, mail, wa, link, waLink: `https://wa.me/41${b.mobile.replace(/\s/g, '').slice(1)}?text=${encodeURIComponent(wa)}` };
}

function eintrag(argv, vergeben) {
  const frei = [], opt = {};
  for (let i = 0; i < argv.length; i++) { if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[++i]; else frei.push(argv[i]); }
  const [firma, ort, mobile] = frei;
  if (!firma || !ort || !mobile) throw new Error('Aufruf: npm run neu -- "Firma" "Ort" "079 123 45 67" [--ansprache "Herr Muster"] [--orte "A, B"] [--farbe blau] [--kuerzel name] [--leistungen innen,fassade]');
  const liste = (t) => t.split(',').map((x) => x.trim()).filter(Boolean);
  const b = { firma: firma.trim(), ort: ort.trim(), ansprache: (opt.ansprache || '').trim(), mobile: mobile.trim() };
  if (opt.leistungen) b.leistungen = liste(opt.leistungen);
  const orte = opt.orte !== undefined ? liste(opt.orte) : (NACHBARN[b.ort] || []);
  if (orte.length) b.orte = orte;
  if (opt.farbe) b.farbe = opt.farbe;
  const k = opt.kuerzel || kuerzel(b.firma, vergeben);
  if (vergeben.includes(k)) throw new Error(`Kürzel «${k}» gibt es schon. Anderes wählen: --kuerzel name`);
  return { k, b };
}

// Eine Zeile je Betrieb, wie der Rest der Datei.
function speichern(k, b) {
  const text = fs.readFileSync(DATEI, 'utf8').trimEnd();
  const zeile = `  ${JSON.stringify(k)}: ${JSON.stringify(b).replace(/^\{/, '{ ').replace(/\}$/, ' }').replace(/":/g, '": ').replace(/,"/g, ', "').replace(/\[/g, '[ ').replace(/\]/g, ' ]').replace(/","/g, '", "')}`;
  fs.writeFileSync(DATEI, text.replace(/\n\}$/, `,\n${zeile}\n}\n`));
}

if (require.main === module) {
  try {
    const { k, b } = eintrag(process.argv.slice(2), alle().map((s) => s.k));
    seite(k, b, fs.readFileSync(path.join(__dirname, 'entwurf-vorlage.html'), 'utf8')); // prüft alle Angaben, bevor etwas geschrieben wird
    speichern(k, b);
    const lauf = (datei, args = []) => { const r = spawnSync(process.execPath, [path.join(__dirname, datei), ...args], { stdio: ['ignore', 'ignore', 'inherit'] }); return r.status === 0; };
    if (!lauf('entwurf-bauen.js')) throw new Error('npm run entwurf ist fehlgeschlagen');
    const bild = lauf('og-bauen.js', [k]);
    const n = nachrichten(k, b);
    console.log(`\nNeu: ${b.firma}, ${b.ort}  →  ${n.link}`);
    if (b.orte) console.log(`Ortsseiten: ${b.orte.join(', ')}` + (process.argv.includes('--orte') ? '' : '  (Beispiele aus tools/nachbarn.json)'));
    if (!bild) console.log('ACHTUNG: Teilen-Bild fehlt (Chrome nicht gefunden?). Nachholen mit: npm run og');
    console.log(`\n--- E-MAIL ---\nBetreff: ${n.betreff}\n\n${n.mail}\n\n--- WHATSAPP ---\n${n.wa}\n\nLink zum Öffnen in WhatsApp:\n${n.waLink}\n`);
    console.log('Vor dem Verschicken: auf local.ch prüfen, dass der Eintrag KEINEN Stern («wünscht keine Werbung») hat.\nDann: npm test  →  npm run schau  →  pushen.');
  } catch (e) { console.error('Fehler: ' + e.message); process.exit(1); }
}
module.exports = { kuerzel, nachrichten, eintrag };
