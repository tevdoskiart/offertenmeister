// Verhalten von js/site.js auf der deutschen und der englischen Startseite.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSite } = require('./helpers');

const LANGS = [
  {
    file: 'index.html', lang: 'de',
    perMonth: 'pro Monat', once: 'einmalig',
    basicAbo: 'plus CHF 490 Start, monatlich kündbar, alle Änderungen inklusive',
    kaufNote: 'erstes Jahr inklusive, danach CHF 390 pro Jahr',
    emptyError: 'Bitte geben Sie Ihren Firmennamen ein.',
    msg: (f, o, web, p) => `Grüezi Herr Tevdoski\n\nFirma: ${f}\nOrt: ${o}\nWebsite: ${web}\nInteresse: ${p}\n\nBitte schicken Sie mir einen kostenlosen Website-Check.`,
    noWeb: 'keine', undecided: 'Weiss ich noch nicht',
  },
  {
    file: 'en/index.html', lang: 'en',
    perMonth: 'per month', once: 'one-time',
    basicAbo: 'plus CHF 490 setup, cancel monthly, all changes included',
    kaufNote: 'first year included, then CHF 390 per year',
    emptyError: 'Please enter your company name.',
    msg: (f, o, web, p) => `Hello Mr Tevdoski\n\nCompany: ${f}\nLocation: ${o}\nWebsite: ${web}\nInterested in: ${p}\n\nPlease send me a free website check.`,
    noWeb: 'none', undecided: 'Not sure yet',
  },
];

const decode = (url) => decodeURIComponent(url.split('?text=')[1]);

for (const L of LANGS) {
  test(`[${L.lang}] Preis-Schalter wechselt zwischen Monatlich und Einmalig`, (t) => {
    const w = loadSite(L.file); t.after(() => w.close());
    const d = w.document;
    const [abo, kauf] = d.querySelectorAll('.schalter button');
    const cards = d.querySelectorAll('.paket');
    const price = (i) => cards[i].querySelector('.preis span').textContent;
    const unit = (i) => cards[i].querySelector('.preis small').textContent;
    const note = (i) => cards[i].querySelector('.preis').nextElementSibling.textContent;

    assert.equal(price(0), 'CHF 190');
    assert.equal(price(1), 'CHF 290');
    assert.equal(unit(0), L.perMonth);
    assert.equal(note(0), L.basicAbo);

    kauf.click();
    assert.equal(price(0), "CHF 1'990");
    assert.equal(price(1), "CHF 2'990");
    assert.equal(unit(1), L.once);
    assert.equal(note(0), L.kaufNote);
    assert.equal(kauf.getAttribute('aria-pressed'), 'true');
    assert.equal(abo.getAttribute('aria-pressed'), 'false');

    abo.click();
    assert.equal(price(0), 'CHF 190');
    assert.equal(abo.getAttribute('aria-pressed'), 'true');
  });

  test(`[${L.lang}] Paket-Knöpfe füllen das Feld "Interesse"`, (t) => {
    const w = loadSite(L.file); t.after(() => w.close());
    const d = w.document;
    assert.equal(d.getElementById('paket').value, L.undecided);
    for (const plan of ['Basic', 'Premium', 'Social Media']) {
      d.querySelector(`[data-plan="${plan}"]`).click();
      assert.equal(d.getElementById('paket').value, plan);
    }
  });

  test(`[${L.lang}] Formular ohne Firmenname zeigt Fehler und öffnet kein WhatsApp`, (t) => {
    const w = loadSite(L.file); t.after(() => w.close());
    const d = w.document;
    d.getElementById('firma').value = '   ';
    d.querySelector('#f button[type=submit]').click();
    assert.equal(d.getElementById('hinweis').textContent, L.emptyError);
    assert.equal(d.activeElement, d.getElementById('firma'));
    assert.equal(w.__opened.length, 0);
  });

  test(`[${L.lang}] Formular öffnet WhatsApp mit allen Angaben`, (t) => {
    const w = loadSite(L.file); t.after(() => w.close());
    const d = w.document;
    d.getElementById('firma').value = '  Maler Muster AG ';
    d.getElementById('ort').value = 'Uster ZH';
    d.getElementById('web').value = 'www.maler-muster.ch';
    d.getElementById('paket').value = 'Premium';
    d.querySelector('#f button[type=submit]').click();
    assert.equal(w.__opened.length, 1);
    assert.ok(w.__opened[0].startsWith('https://wa.me/38978338208?text='));
    assert.equal(decode(w.__opened[0]), L.msg('Maler Muster AG', 'Uster ZH', 'www.maler-muster.ch', 'Premium'));
  });

  test(`[${L.lang}] Formular füllt leere Felder mit Platzhaltern`, (t) => {
    const w = loadSite(L.file); t.after(() => w.close());
    const d = w.document;
    d.getElementById('firma').value = 'Farb & Co. "Zürich"';
    d.querySelector('#f button[type=submit]').click();
    assert.equal(decode(w.__opened[0]), L.msg('Farb & Co. "Zürich"', '-', L.noWeb, L.undecided));
  });

  test(`[${L.lang}] E-Mail-Knopf: gleiche Nachricht an info@offertenmeister.ch, ohne Firmenname Fehler`, (t) => {
    const w = loadSite(L.file); t.after(() => w.close());
    const d = w.document;
    const m = d.getElementById('mail');
    const klick = () => { const e = new w.MouseEvent('click', { bubbles: true, cancelable: true }); m.dispatchEvent(e); return e; };
    assert.equal(klick().defaultPrevented, true);
    assert.equal(d.getElementById('hinweis').textContent, L.emptyError);
    d.getElementById('firma').value = 'Maler Muster AG';
    d.getElementById('ort').value = 'Uster ZH';
    assert.equal(klick().defaultPrevented, false);
    const href = m.getAttribute('href');
    assert.ok(href.startsWith('mailto:info@offertenmeister.ch?subject='));
    assert.ok(decodeURIComponent(href.split('subject=')[1].split('&body=')[0]).endsWith('Maler Muster AG'));
    assert.equal(decodeURIComponent(href.split('&body=')[1]), L.msg('Maler Muster AG', 'Uster ZH', L.noWeb, L.undecided));
    assert.equal(w.__opened.length, 0);
  });

  test(`[${L.lang}] Handy-Menü öffnet und schliesst`, (t) => {
    const w = loadSite(L.file); t.after(() => w.close());
    const d = w.document;
    const kopf = d.querySelector('.kopf');
    const burger = d.querySelector('.burger');
    assert.equal(burger.getAttribute('aria-controls'), 'hauptmenu');
    assert.ok(d.getElementById('hauptmenu'));

    burger.click();
    assert.ok(kopf.classList.contains('offen'));
    assert.equal(burger.getAttribute('aria-expanded'), 'true');

    d.querySelector('#hauptmenu a[href="#pakete"]').click();
    assert.ok(!kopf.classList.contains('offen'));
    assert.equal(burger.getAttribute('aria-expanded'), 'false');

    burger.click();
    d.querySelector('#hauptmenu a').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.ok(!kopf.classList.contains('offen'));
    assert.equal(d.activeElement, burger);

    burger.click(); burger.click();
    assert.equal(burger.getAttribute('aria-expanded'), 'false');
  });
}
