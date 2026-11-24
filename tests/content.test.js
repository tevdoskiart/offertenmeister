// Inhalt und Aufbau der Seiten: Preise, Sprachen, Links, Bilder, SEO.
// Preise hier und in CLAUDE.md gleich halten.
const test = require('node:test');
const assert = require('node:assert/strict');
const { read, exists, parse } = require('./helpers');

const PAGES = { de: 'index.html', en: 'en/index.html' };
const doc = { de: parse(PAGES.de), en: parse(PAGES.en) };
const html = { de: read(PAGES.de), en: read(PAGES.en) };

const PRICES = {
  basic: { start: 'CHF 490', month: 'CHF 190', once: "CHF 1'990" },
  premium: { start: 'CHF 790', month: 'CHF 290', once: "CHF 2'990" },
  perYear: 'CHF 390',
  social: ['CHF 390', 'CHF 690', 'CHF 350', 'CHF 990'],
};
const DISCOUNT = { de: '15 % Rabatt auf den ersten Monat', en: '15% off your first month' };
const OLD = ['CHF 990 Start', "CHF 1'490", 'Einführungspreis', 'Launch price', 'erste Bestellung', 'first order', 'gmail.com'];

const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();
const localPath = (url) => {
  const p = url.split(/[?#]/)[0];
  if (p === '/' ) return 'index.html';
  if (p.endsWith('/')) return p.slice(1) + 'index.html';
  return p.replace(/^\//, '');
};

for (const lang of ['de', 'en']) {
  const d = doc[lang];

  test(`[${lang}] Preiskarten zeigen die aktuellen Preise`, () => {
    const cards = d.querySelectorAll('.paket');
    assert.equal(cards.length, 2);
    for (const [i, key] of [[0, 'basic'], [1, 'premium']]) {
      const span = cards[i].querySelector('.preis span');
      assert.equal(span.dataset.abo, PRICES[key].month);
      assert.equal(span.dataset.kauf, PRICES[key].once);
      const note = cards[i].querySelector('[data-abo][data-kauf].klein');
      assert.ok(note.dataset.abo.includes(PRICES[key].start), `${key} Start`);
      assert.ok(note.dataset.kauf.includes(PRICES.perYear), `${key} Folgejahr`);
    }
  });

  test(`[${lang}] Social-Media-Karten zeigen die aktuellen Preise`, () => {
    const prices = [...d.querySelectorAll('.s-karten .s-preis')].map((p) => p.firstChild.textContent.trim());
    assert.deepEqual(prices, PRICES.social);
  });

  test(`[${lang}] Rabatt steht bei den Preisen und bei Social Media`, () => {
    assert.ok(text(d.querySelector('.bedingungen')).includes(DISCOUNT[lang]));
    assert.ok(text(d.querySelector('.s-punkte')).includes(DISCOUNT[lang]));
  });

  test(`[${lang}] Keine alten Preise, Angebote oder privaten Adressen`, () => {
    for (const old of OLD) assert.ok(!html[lang].includes(old), `gefunden: ${old}`);
    assert.ok(html[lang].includes('info@offertenmeister.ch'));
  });

  test(`[${lang}] FAQ und Schema stimmen überein`, () => {
    const blocks = [...d.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent));
    const faq = blocks.find((b) => b['@type'] === 'FAQPage');
    assert.ok(faq, 'FAQPage fehlt');
    const details = [...d.querySelectorAll('#faq details')];
    assert.equal(faq.mainEntity.length, details.length);
    faq.mainEntity.forEach((q, i) => {
      assert.equal(q.name, text(details[i].querySelector('summary')));
      assert.equal(q.acceptedAnswer.text, text(details[i].querySelector('p')));
    });
    const faqText = JSON.stringify(faq);
    for (const v of ['CHF 490', 'CHF 790', 'CHF 190', 'CHF 290', "CHF 1'990", "CHF 2'990"]) assert.ok(faqText.includes(v), v);
    const org = blocks.find((b) => b['@type'] === 'ProfessionalService');
    assert.equal(org.email, 'info@offertenmeister.ch');
  });

  test(`[${lang}] Alle Bilder haben alt, Breite und Höhe, und die Datei existiert`, () => {
    for (const img of d.querySelectorAll('img')) {
      const src = img.getAttribute('src');
      assert.ok(img.hasAttribute('alt'), `alt fehlt: ${src}`);
      assert.ok(img.getAttribute('width') && img.getAttribute('height'), `Grösse fehlt: ${src}`);
      assert.ok(exists(localPath(src)), `Datei fehlt: ${src}`);
      const srcset = img.getAttribute('srcset');
      if (srcset) {
        assert.ok(img.getAttribute('sizes'), `sizes fehlt: ${src}`);
        for (const part of srcset.split(',')) {
          const [url, w] = part.trim().split(/\s+/);
          assert.ok(exists(localPath(url)), `srcset-Datei fehlt: ${url}`);
          assert.match(w, /^\d+w$/, `Breite fehlt: ${url}`);
        }
      }
    }
  });

  test(`[${lang}] Grosse Bilder haben eine kleine Version fürs Handy`, () => {
    for (const img of d.querySelectorAll('main img')) {
      const w = +img.getAttribute('width');
      if (w >= 800) assert.ok(img.getAttribute('srcset'), `srcset fehlt: ${img.getAttribute('src')}`);
    }
    const pre = d.querySelector('link[rel=preload][as=image]');
    assert.equal(pre.getAttribute('fetchpriority'), 'high');
    assert.ok(pre.getAttribute('imagesrcset'));
  });

  test(`[${lang}] Interne Links und Anker führen ins Leere? Nein`, () => {
    for (const a of d.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href');
      if (/^(https?:|mailto:|tel:)/.test(href)) continue;
      if (href.startsWith('#')) {
        assert.ok(d.getElementById(href.slice(1)), `Anker fehlt: ${href}`);
      } else {
        assert.ok(exists(localPath(href)), `Seite fehlt: ${href}`);
      }
    }
    for (const el of d.querySelectorAll('[aria-controls]')) {
      assert.ok(d.getElementById(el.getAttribute('aria-controls')), 'aria-controls ohne Ziel');
    }
  });

  test(`[${lang}] Stylesheet, Script und Schriften existieren`, () => {
    for (const el of d.querySelectorAll('link[rel=stylesheet], link[rel=preload], link[rel=icon], script[src]')) {
      const url = el.getAttribute('href') || el.getAttribute('src');
      assert.ok(exists(localPath(url)), `fehlt: ${url}`);
    }
  });

  test(`[${lang}] Sprache, canonical und hreflang sind richtig`, () => {
    const base = 'https://offertenmeister.ch/';
    assert.equal(d.documentElement.lang, lang === 'de' ? 'de-CH' : 'en');
    assert.equal(d.querySelector('link[rel=canonical]').href, lang === 'de' ? base : base + 'en/');
    const alt = Object.fromEntries([...d.querySelectorAll('link[rel=alternate][hreflang]')].map((l) => [l.hreflang, l.href]));
    assert.deepEqual(alt, { 'de-CH': base, en: base + 'en/', 'x-default': base });
    assert.equal(d.querySelector('meta[property="og:image"]').content, `${base}img/og-${lang}-v2.jpg`);
    assert.equal(d.querySelector('meta[name="twitter:card"]').content, 'summary_large_image');
  });
}

test('DE und EN haben den gleichen Aufbau', () => {
  const ids = (d) => [...d.querySelectorAll('main [id]')].map((e) => e.id);
  assert.deepEqual(ids(doc.de), ids(doc.en));
  const imgs = (d) => [...d.querySelectorAll('img')].map((i) => i.getAttribute('src').replace(/-(de|en)(-v\d+)?\./, '$2.'));
  assert.deepEqual(imgs(doc.de), imgs(doc.en));
  const opts = (d) => [...d.querySelectorAll('#paket option')].slice(1).map((o) => o.textContent);
  assert.deepEqual(opts(doc.de), opts(doc.en));
});

test('DE und EN laden die gleiche Version von CSS und JS', () => {
  const v = (d, sel, attr) => d.querySelector(sel).getAttribute(attr);
  assert.equal(v(doc.de, 'link[rel=stylesheet]', 'href'), v(doc.en, 'link[rel=stylesheet]', 'href'));
  assert.equal(v(doc.de, 'script[src]', 'src'), v(doc.en, 'script[src]', 'src'));
  assert.match(v(doc.de, 'script[src]', 'src'), /\?v=\d+$/);
});

test('Sprachwechsel verlinkt die jeweils andere Seite', () => {
  assert.equal(doc.de.querySelector('.sprache').getAttribute('href'), '/en/');
  assert.equal(doc.de.querySelector('.sprache-m').getAttribute('href'), '/en/');
  assert.equal(doc.en.querySelector('.sprache').getAttribute('href'), '/');
  assert.equal(doc.en.querySelector('.sprache-m').getAttribute('href'), '/');
});

test('sitemap.xml, robots.txt und _config.yml', () => {
  const sitemap = read('sitemap.xml');
  assert.ok(sitemap.includes('<loc>https://offertenmeister.ch/</loc>'));
  assert.ok(sitemap.includes('<loc>https://offertenmeister.ch/en/</loc>'));
  const robots = read('robots.txt');
  assert.ok(!/Disallow:\s*\/demo/.test(robots), 'Demos nicht sperren, sonst wird noindex nicht gelesen');
  assert.ok(robots.includes('Sitemap: https://offertenmeister.ch/sitemap.xml'));
  const cfg = read('_config.yml');
  for (const f of ['CLAUDE.md', 'tests', 'package.json', 'package-lock.json', 'node_modules']) {
    assert.ok(cfg.includes(`- ${f}`), `${f} nicht in _config.yml exclude`);
  }
  assert.ok(!exists('.nojekyll'), '.nojekyll würde _config.yml ausschalten');
});

test('404-Seite hat Deutsch und Englisch', () => {
  const d = parse('404.html');
  assert.ok(d.querySelector('a[href="/"]'));
  assert.ok(d.querySelector('[lang="en"] a[href="/en/"]'));
  assert.equal(d.querySelector('meta[name=robots]').content, 'noindex');
});

test('Vergleich Portal / eigene Website in DE und EN', () => {
  for (const lang of ['de', 'en']) {
    const d = doc[lang];
    const v = d.getElementById('vergleich');
    assert.ok(v, `#vergleich fehlt (${lang})`);
    assert.equal(v.querySelectorAll('.v-portal li').length, 5);
    assert.equal(v.querySelectorAll('.v-eigen li').length, 6);
    assert.equal(v.querySelector('.v-eigen a').getAttribute('href'), '#kontakt');
  }
});
