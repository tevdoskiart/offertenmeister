// Persönliche Entwurf-Seiten /e/<kürzel>/ (tools/entwurf-bauen.js + tools/betriebe.json).
const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { read, exists } = require('./helpers');
const { alle, alleOrte, seite, ortSlug, LEISTUNGEN } = require('../tools/entwurf-bauen');

const SEITEN = alle();
const ORTE = alleOrte();
const ld = (d) => JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent);
const laden = (html, k) => {
  const dom = new JSDOM(html, { url: `https://offertenmeister.ch/e/${k}/`, runScripts: 'outside-only' });
  dom.window.eval(read('e/e.js'));
  return dom.window;
};

test('Jeder Betrieb hat eine aktuelle Seite (sonst: npm run entwurf)', () => {
  assert.ok(SEITEN.length >= 8);
  for (const s of SEITEN) {
    assert.ok(exists(s.datei), `${s.datei} fehlt`);
    assert.equal(read(s.datei), s.html, `${s.datei} ist veraltet`);
  }
});

test('Seiten sind persönlich, noindex, ohne offene Platzhalter und ohne fremde Quellen', () => {
  for (const s of SEITEN) {
    const d = new JSDOM(s.html).window.document;
    assert.equal(d.querySelector('meta[name=robots]').content, 'noindex');
    assert.ok(d.title.includes(s.b.firma));
    assert.equal(d.querySelector('meta[property="og:title"]').content, `Entwurf für ${s.b.firma}`);
    assert.equal(d.querySelector('meta[property="og:url"]').content, `https://offertenmeister.ch/e/${s.k}/`);
    assert.ok(d.querySelector('h1').textContent.includes(s.b.ort));
    assert.ok(!/%[A-Z_]+%/.test(s.html), 'Platzhalter nicht ersetzt');
    assert.ok(!/\{\{|\{%/.test(s.html), 'Jekyll-Zeichen');
    assert.ok(!/style="|<style|onclick=/.test(s.html), 'Inline-Style oder -Script (CSP)');
    for (const el of d.querySelectorAll('[src],link[href]')) {
      const u = el.getAttribute('src') || el.getAttribute('href');
      assert.ok(u.startsWith('/'), `fremde Quelle ${u}`);
      assert.ok(exists(u.slice(1).split('?')[0]), `${u} fehlt`);
    }
    assert.equal(d.querySelector('.tel').getAttribute('href'), 'tel:+41' + s.b.mobile.replace(/\s/g, '').slice(1));
    assert.ok(d.getElementById('ja').href.startsWith('https://wa.me/38978338208?text='));
    assert.ok(d.getElementById('ja-mail').href.startsWith('mailto:info@offertenmeister.ch?subject='));
    assert.ok(s.html.includes("CHF 190 / Monat") && s.html.includes("CHF 1'990") && s.html.includes('CHF 490'));
  }
});

test('Ohne Script: Richtpreis und WhatsApp-Link stehen schon im HTML', () => {
  const s = SEITEN[0];
  const d = new JSDOM(s.html).window.document;
  assert.equal(d.getElementById('preis').textContent, "CHF 1'920–2'720");
  assert.ok(d.getElementById('senden').href.startsWith('https://wa.me/41786090914?text='));
});

test('Rechner: Preis und WhatsApp-Anfrage gehen an die Nummer des Betriebs', (t) => {
  const s = SEITEN.find((x) => x.k === 'donato');
  const w = laden(s.html, s.k); t.after(() => w.close());
  const d = w.document;
  const a = d.getElementById('arbeit'), q = d.getElementById('qm');
  a.selectedIndex = 1; a.dispatchEvent(new w.Event('change'));
  q.value = '120'; q.dispatchEvent(new w.Event('input'));
  assert.equal(d.getElementById('qmout').textContent, '120 m²');
  assert.equal(d.getElementById('preis').textContent, "CHF 5'400–8'400");
  const href = d.getElementById('senden').href;
  assert.ok(href.startsWith('https://wa.me/41794490739?text='));
  const msg = decodeURIComponent(href.split('?text=')[1]);
  assert.ok(msg.includes('Grüezi Maler Donato') && msg.includes('Fassade streichen') && msg.includes('ca. 120 m²') && msg.includes('Ort: Chur'));
});

test('Eigene Leistungen, Orte, Farbe; HTML in Angaben wird entschärft; falsche Angaben brechen ab', () => {
  const v = read('tools/entwurf-vorlage.html');
  const html = seite('test', { firma: 'Müller & Söhne <b>AG</b>', ort: 'Thun', mobile: '079 111 22 33', leistungen: ['dekor', 'gips'], orte: ['Spiez', 'Steffisburg'], farbe: 'blau' }, v);
  const d = new JSDOM(html).window.document;
  assert.equal(d.body.className, 't-blau');
  assert.equal(d.body.dataset.firma, 'Müller & Söhne <b>AG</b>');
  assert.equal(d.querySelector('.logo b'), null);
  assert.deepEqual([...d.querySelectorAll('.grid4 h3')].map((e) => e.textContent), [LEISTUNGEN.dekor[0], LEISTUNGEN.gips[0]]);
  assert.deepEqual([...d.querySelectorAll('.orte li')].map((e) => e.textContent), ['Thun', 'Spiez', 'Steffisburg']);
  assert.equal(d.querySelectorAll('#arbeit option').length, 2);
  assert.throws(() => seite('x', { firma: 'A', ort: 'B', mobile: '+41 79 111 22 33' }, v), /mobile/);
  assert.throws(() => seite('x', { firma: 'A', ort: 'B', mobile: '079 111 22 33', leistungen: ['innen', 'dach'] }, v), /dach/);
  assert.throws(() => seite('Ä b', { firma: 'A', ort: 'B', mobile: '079 111 22 33' }, v), /Kürzel/);
});

test('Alte Links /entwurf.html?f=<kürzel> (verschickt am 27.11.2026) bleiben bestehen', () => {
  assert.ok(exists('entwurf.html') && exists('entwurf.js'));
  for (const s of SEITEN.slice(0, 8)) assert.ok(read('entwurf.js').includes(`"${s.k}"`));
});

test('Ortsseiten: jede ist aktuell, noindex, persönlich und im Entwurf verlinkt', () => {
  assert.ok(ORTE.length >= 8);
  for (const s of ORTE) {
    assert.ok(exists(s.datei), `${s.datei} fehlt`);
    assert.equal(read(s.datei), s.html, `${s.datei} ist veraltet (npm run entwurf)`);
    const d = new JSDOM(s.html).window.document;
    assert.equal(d.querySelector('meta[name=robots]').content, 'noindex');
    assert.equal(d.querySelector('meta[property="og:url"]').content, `https://offertenmeister.ch/e/${s.k}/${s.slug}/`);
    assert.equal(d.querySelector('h1').textContent, `Maler in ${s.ort}.`);
    assert.ok(d.title.includes(s.ort) && d.title.includes(s.b.firma));
    assert.equal(d.body.dataset.ort, s.ort);
    assert.ok(decodeURIComponent(d.getElementById('senden').href).includes(`Ort: ${s.ort}`));
    assert.ok(!/%[A-Z_]+%/.test(s.html) && !/\{\{|\{%/.test(s.html) && !/style="|<style|onclick=/.test(s.html));
    for (const el of d.querySelectorAll('[src],link[href]')) assert.ok(exists((el.getAttribute('src') || el.getAttribute('href')).slice(1).split('?')[0]));
  }
  for (const s of [...SEITEN, ...ORTE]) {
    const d = new JSDOM(s.html).window.document;
    const links = [...d.querySelectorAll('.orte a')].map((a) => a.getAttribute('href'));
    assert.equal(links.length, s.b.orte.length, `${s.datei}: Orte-Links`);
    for (const u of [...links, ...[...d.querySelectorAll('a[href^="/e/"]')].map((a) => a.getAttribute('href'))]) assert.ok(exists(u.slice(1) + 'index.html'), `${u} fehlt`);
  }
});

test('Daten für Google (JSON-LD HousePainter): Name, Telefon, Ort und Einsatzgebiet stimmen; nichts Erfundenes', () => {
  for (const s of [...SEITEN, ...ORTE]) {
    const j = ld(new JSDOM(s.html).window.document);
    assert.equal(j['@type'], 'HousePainter');
    assert.equal(j.name, s.b.firma);
    assert.equal(j.telephone, '+41' + s.b.mobile.replace(/\s/g, '').slice(1));
    assert.equal(j.url, `https://offertenmeister.ch/e/${s.k}/`);
    assert.equal(j.address.addressLocality, s.b.ort);
    assert.deepEqual(j.areaServed.map((x) => x.name), [s.b.ort, ...(s.b.orte || [])]);
    assert.equal(j.hasOfferCatalog.itemListElement.length, (s.b.leistungen || [1, 2, 3, 4]).length);
    for (const f of ['aggregateRating', 'review', 'openingHours', 'priceRange']) assert.equal(j[f], undefined, `${f} darf nicht erfunden werden`);
  }
});

test('Ortsnamen: Adresse der Ortsseite, Schutz vor HTML im Firmennamen, falsche Orte brechen ab', () => {
  assert.equal(ortSlug('Wangen bei Olten'), 'maler-wangen-bei-olten');
  assert.equal(ortSlug('Domat/Ems'), 'maler-domat-ems');
  assert.equal(ortSlug('Rüti ZH'), 'maler-rueti-zh');
  const v = read('tools/entwurf-vorlage.html');
  const html = seite('test', { firma: 'A </script><b>x', ort: 'Thun', mobile: '079 111 22 33', orte: ['Spiez'] }, v);
  const d = new JSDOM(html).window.document;
  assert.equal(ld(d).name, 'A </script><b>x');
  assert.equal(d.querySelectorAll('script').length, 2);
  assert.equal(d.querySelector('.orte a').getAttribute('href'), '/e/test/maler-spiez/');
  const b = { firma: 'A', ort: 'Thun', mobile: '079 111 22 33' };
  assert.throws(() => seite('x', { ...b, orte: ['Thun'] }, v), /Hauptort/);
  assert.throws(() => seite('x', { ...b, orte: ['Spiez', 'spiez'] }, v), /doppelt/);
  assert.throws(() => seite('x', { ...b, orte: ['1', '2', '3', '4', '5', '6', '7'] }, v), /höchstens 6/);
  assert.throws(() => seite('x', { ...b, orte: [' '] }, v), /leer/);
});
