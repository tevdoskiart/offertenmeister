// Preisrechner, Formular und Sprachen der beiden Demo-Websites.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDemo, parse, chf } = require('./helpers');

// Gleiche Daten wie in den Demos: [Kategorie, CHF min, CHF max, Einheit 0=m² 1=Stk.]
const P = [[0, 24, 34, 0], [0, 32, 45, 0], [0, 30, 42, 0], [1, 38, 55, 0], [1, 14, 22, 0], [2, 170, 240, 0], [2, 160, 220, 0], [0, 220, 320, 1]];
const range = (i, a) => chf(P[i][1] * a) + '–' + Math.round(P[i][2] * a).toLocaleString('de-CH');

const DEMOS = ['demo/basic/index.html', 'demo/premium/index.html'];

for (const file of DEMOS) {
  const name = file.split('/')[1];

  test(`[${name}] Seite ist noindex und als Demo markiert`, () => {
    const d = parse(file);
    assert.equal(d.querySelector('meta[name=robots]').content, 'noindex');
  });

  test(`[${name}] Preisrechner rechnet Fläche × Preis`, (t) => {
    const w = loadDemo(file); t.after(() => w.close());
    const d = w.document;
    const work = d.getElementById('cwork');
    const area = d.getElementById('carea');
    assert.equal(d.getElementById('cres').textContent, range(+work.value, 60));

    work.value = '1';
    work.dispatchEvent(new w.Event('change'));
    area.value = '85';
    area.dispatchEvent(new w.Event('input'));
    assert.equal(d.getElementById('cres').textContent, range(1, 85));
    assert.equal(d.getElementById('careaV').textContent, '85 m²');
  });

  test(`[${name}] Kategorien zeigen nur ihre Arbeiten, keine Stück-Preise`, (t) => {
    const w = loadDemo(file); t.after(() => w.close());
    const d = w.document;
    for (const c of [0, 1, 2]) {
      d.querySelector(`#seg button[data-c="${c}"]`).click();
      const opts = [...d.getElementById('cwork').options].map((o) => +o.value);
      const expected = P.map((p, i) => (p[0] === c && !p[3] ? i : -1)).filter((i) => i >= 0);
      assert.deepEqual(opts, expected, `Kategorie ${c}`);
      assert.equal(d.getElementById('cres').textContent, range(expected[0], +d.getElementById('carea').value));
    }
  });

  test(`[${name}] Preistabelle zeigt alle Positionen`, (t) => {
    const w = loadDemo(file); t.after(() => w.close());
    const rows = w.document.querySelectorAll('#ptab tr');
    assert.equal(rows.length, P.length);
    assert.ok(rows[0].textContent.includes(chf(24)));
  });

  test(`[${name}] Anfrage-Formular: Schritte und Pflichtfelder`, (t) => {
    const w = loadDemo(file); t.after(() => w.close());
    const d = w.document;
    const ok = d.getElementById('ok');
    const next = d.getElementById('wnext');
    const page = () => [...d.querySelectorAll('#f .wiz-p')].findIndex((p) => p.classList.contains('on'));

    next.click();
    assert.ok(ok.classList.contains('show'), 'Fehler ohne Auswahl');
    assert.equal(page(), 0);

    d.querySelector('#wopts button[data-i="1"]').click();
    assert.equal(page(), 1);
    next.click();
    assert.equal(page(), 2);

    next.click();
    assert.ok(ok.classList.contains('show'), 'Fehler ohne Name und Telefon');
    assert.ok(!ok.querySelector('b'), 'noch kein Dank');

    d.getElementById('wback').click();
    assert.equal(page(), 1);
    next.click();

    d.getElementById('fname').value = '<img src=x onerror=alert(1)>Max';
    d.getElementById('ftel').value = '079 123 45 67';
    next.click();
    assert.ok(ok.classList.contains('show'));
    assert.equal(ok.querySelectorAll('img').length, 0, 'Name wird nicht als HTML eingefügt');
    assert.ok(ok.textContent.includes('Max'));
  });

  test(`[${name}] WhatsApp-Knöpfe öffnen in der Demo keinen Chat`, (t) => {
    const w = loadDemo(file); t.after(() => w.close());
    const d = w.document;
    const link = d.querySelector('.walink');
    assert.ok(link, 'WhatsApp-Knopf fehlt');
    link.click();
    assert.ok(d.getElementById('ok').classList.contains('show'));
  });
}

test('[basic] Sprachwechsel DE ↔ EN übersetzt die Seite', (t) => {
  const w = loadDemo('demo/basic/index.html'); t.after(() => w.close());
  const d = w.document;
  const h1 = () => d.querySelector('h1').textContent;
  assert.match(h1(), /Malerarbeiten/);
  assert.equal(d.documentElement.lang, 'de-CH');

  d.querySelector('.lang button[data-l="en"]').click();
  assert.match(h1(), /Painting/);
  assert.equal(d.documentElement.lang, 'en');
  assert.equal(d.getElementById('cres').textContent, range(+d.getElementById('cwork').value, +d.getElementById('carea').value));
  for (const el of d.querySelectorAll('[data-t]')) assert.ok(el.textContent.trim(), `leerer Text: ${el.dataset.t}`);

  d.querySelector('.lang button[data-l="de"]').click();
  assert.match(h1(), /Malerarbeiten/);
});

test('[premium] Neue Anfrage erscheint in der Anfragen-Übersicht', (t) => {
  const w = loadDemo('demo/premium/index.html'); t.after(() => w.close());
  const d = w.document;
  const rows = () => d.querySelectorAll('#dtab tr').length;
  const before = rows();

  d.querySelector('#wopts button[data-i="0"]').click();
  d.getElementById('wnext').click();
  d.getElementById('fplz').value = '8610 Uster';
  d.getElementById('farea').value = '85';
  d.getElementById('wnext').click();
  d.getElementById('fname').value = 'Anna <b>F</b>';
  d.getElementById('ftel').value = '079 000 00 00';
  d.getElementById('wnext').click();

  assert.equal(rows(), before + 1);
  const first = d.querySelector('#dtab tr');
  assert.ok(first.textContent.includes('Anna bF/b'), 'Name ohne HTML-Zeichen');
  assert.ok(first.textContent.includes('8610 Uster'));
  assert.ok(first.textContent.includes('85 m²'));
  assert.equal(first.querySelectorAll('b').length, 0);
});

test('[premium] Filter zeigt nur Anfragen mit diesem Status', (t) => {
  const w = loadDemo('demo/premium/index.html'); t.after(() => w.close());
  const d = w.document;
  const all = d.querySelectorAll('#dtab tr').length;
  d.querySelector('#flt button[data-f="neu"]').click();
  const pills = [...d.querySelectorAll('#dtab .pill')].map((p) => p.textContent);
  assert.ok(pills.length > 0 && pills.length < all);
  assert.ok(pills.every((p) => p === 'NEU'));
  d.querySelector('#flt button[data-f="all"]').click();
  assert.equal(d.querySelectorAll('#dtab tr').length, all);
});

test('[premium] 3D-Explosionsansicht öffnet und schliesst per Klick', (t) => {
  const w = loadDemo('demo/premium/index.html'); t.after(() => w.close());
  const d = w.document;
  const xp = d.getElementById('xp');
  assert.equal(xp.tagName, 'BUTTON', 'muss ein echter Knopf sein (Tastatur, Touch)');
  assert.ok(xp.getAttribute('aria-label'));
  const img = d.querySelector('#xp img');
  assert.ok(img && img.getAttribute('alt'), 'Bild mit alt-Text');
  assert.ok(img.getAttribute('srcset') && img.getAttribute('sizes'), 'kleine Version fürs Handy');
  assert.deepEqual([...d.querySelectorAll('#xp .xp-tag')].map((x) => x.textContent).sort(), ['01 BODEN', '02 WÄNDE', '03 DECKE', '04 DACH']);
  assert.equal(d.querySelectorAll('#schichten .xp-list li').length, 4);
  assert.equal(xp.getAttribute('aria-pressed'), 'false');
  xp.click();
  assert.equal(xp.getAttribute('aria-pressed'), 'true');
  xp.click();
  assert.equal(xp.getAttribute('aria-pressed'), 'false');
});

test('[premium] 3D-Raum im Rechner folgt Fläche und Kategorie', (t) => {
  const w = loadDemo('demo/premium/index.html'); t.after(() => w.close());
  const d = w.document;
  const rk = d.getElementById('rk');
  const room = rk.querySelector('.rk-room');
  const area = d.getElementById('carea');
  const set = (v) => { area.value = String(v); area.dispatchEvent(new w.Event('input')); };

  assert.equal(rk.getAttribute('aria-hidden'), 'true', 'nur Dekoration, Werte stehen im Rechner');
  set(100);
  assert.equal(d.getElementById('rkM2').textContent, '100 m²');
  assert.equal(d.getElementById('rkDim').textContent, '≈ 10.0 × 10.0 M');
  const s100 = parseFloat(room.style.getPropertyValue('--s'));
  set(25);
  assert.ok(parseFloat(room.style.getPropertyValue('--s')) < s100, 'kleinere Fläche = kleinerer Boden');
  set(400);
  assert.ok(parseFloat(room.style.getPropertyValue('--s')) <= 200, 'Boden bleibt im Rahmen');

  const art = ['INNEN · WÄNDE STREICHEN', 'FASSADE · AUSSENANSTRICH', 'FUGENLOS · MIKROZEMENT'];
  for (const c of [1, 2, 0]) {
    d.querySelector(`#seg button[data-c="${c}"]`).click();
    assert.equal(rk.dataset.cat, String(c));
    assert.equal(d.getElementById('rkArt').textContent, art[c]);
  }
  d.querySelector('#seg button[data-c="1"]').click();
  assert.ok(parseFloat(room.style.getPropertyValue('--s')) <= 150, 'Fassade kleiner, damit Haus mit Dach passt');
  assert.ok(parseFloat(room.style.getPropertyValue('--h')) >= 60, 'Fassade höher als Innenwand');
});

test('[premium] Leistungs-Module haben 3D-Icons aus 8 Ebenen', (t) => {
  const w = loadDemo('demo/premium/index.html'); t.after(() => w.close());
  const mods = [...w.document.querySelectorAll('#mods .mod')];
  assert.equal(mods.length, 6);
  for (const m of mods) {
    const ico = m.querySelector('.i3d');
    assert.equal(ico.getAttribute('aria-hidden'), 'true', 'Icon ist Dekoration');
    const layers = ico.querySelectorAll('svg');
    assert.equal(layers.length, 8);
    const d = layers[0].querySelector('path').getAttribute('d');
    assert.ok([...layers].every((l) => l.querySelector('path').getAttribute('d') === d), 'alle Ebenen gleiche Form');
  }
  const forms = new Set(mods.map((m) => m.querySelector('.i3d path').getAttribute('d')));
  assert.equal(forms.size, 6, 'jedes Modul eigenes Icon');
});
