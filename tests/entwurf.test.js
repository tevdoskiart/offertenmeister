// Persönliche Entwurf-Seiten /e/<kürzel>/ (tools/entwurf-bauen.js + tools/betriebe.json).
const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { read, exists } = require('./helpers');
const { alle, seite, LEISTUNGEN } = require('../tools/entwurf-bauen');

const SEITEN = alle();
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
