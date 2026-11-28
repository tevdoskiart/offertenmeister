// Sicherheit: Content-Security-Policy, keine fremden Ressourcen, kein unsicherer Code.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { read, parse } = require('./helpers');

const PAGES = ['index.html', 'en/index.html', '404.html', 'demo/basic/index.html', 'demo/premium/index.html', 'angebot/website/index.html', 'angebot/social/index.html', 'angebot/jetzt/index.html', 'e/grueter/index.html', 'e/ficorilli/index.html', 'e/grueter/maler-kriens/index.html'];
const MAIN = ['index.html', 'en/index.html'];
const DEMOS = ['demo/basic/index.html', 'demo/premium/index.html'];

const csp = (d) => {
  const m = d.querySelector('meta[http-equiv="Content-Security-Policy"]');
  assert.ok(m, 'CSP fehlt');
  return Object.fromEntries(m.content.split(';').map((p) => p.trim().split(/\s+/)).map(([k, ...v]) => [k, v]));
};
const sha = (s) => `'sha256-${crypto.createHash('sha256').update(s, 'utf8').digest('base64')}'`;

for (const file of PAGES) {
  test(`[${file}] CSP ist streng: nur eigene Quellen, keine Plugins, kein base-Trick`, () => {
    const d = parse(file);
    const c = csp(d);
    assert.deepEqual(c['default-src'], ["'self'"]);
    assert.deepEqual(c['object-src'], ["'none'"]);
    assert.deepEqual(c['base-uri'], ["'none'"]);
    assert.ok('upgrade-insecure-requests' in c);
    for (const v of c['script-src']) assert.ok(!["'unsafe-inline'", "'unsafe-eval'", '*', 'data:', 'https:'].includes(v), `script-src: ${v}`);
    // CSP muss vor allen Styles und Scripts stehen, sonst gilt sie für diese nicht
    const head = read(file).split('</head>')[0];
    const pos = head.indexOf('Content-Security-Policy');
    for (const tag of ['<style', '<link rel="stylesheet"', '<script']) {
      const i = head.indexOf(tag);
      if (i >= 0) assert.ok(pos < i, `CSP muss vor ${tag} stehen`);
    }
    assert.equal(d.querySelector('meta[name="referrer"]').content, 'strict-origin-when-cross-origin');
  });

  test(`[${file}] Keine Ressourcen von fremden Servern`, () => {
    const d = parse(file);
    for (const el of d.querySelectorAll('script[src], link[href], img[src], iframe, object, embed, source[src]')) {
      const url = el.getAttribute('src') || el.getAttribute('href');
      if (el.tagName === 'LINK' && ['canonical', 'alternate'].includes(el.getAttribute('rel'))) continue;
      assert.ok(!/^(https?:)?\/\//.test(url), `fremde Ressource: ${url}`);
    }
    assert.equal(d.querySelectorAll('iframe, object, embed').length, 0);
  });

  test(`[${file}] Kein javascript:-Link, keine Inline-Event-Handler`, () => {
    const html = read(file);
    assert.ok(!/href\s*=\s*["']\s*javascript:/i.test(html));
    assert.ok(!/<[^>]+\son[a-z]+\s*=/i.test(html.replace(/<script[\s\S]*?<\/script>/g, '')), 'onclick=… o. ä. im HTML');
    for (const a of parse(file).querySelectorAll('a[target="_blank"]')) assert.match(a.rel, /noopener/);
  });
}

for (const file of MAIN) {
  test(`[${file}] Hauptseite: kein Inline-Script, kein Inline-Style (CSP ohne unsafe-inline)`, () => {
    const d = parse(file);
    const c = csp(d);
    assert.deepEqual(c['script-src'], ["'self'"]);
    assert.deepEqual(c['style-src'], ["'self'"]);
    const inline = [...d.querySelectorAll('script:not([src])')].filter((s) => s.type !== 'application/ld+json');
    assert.equal(inline.length, 0, 'Inline-Script gefunden');
    assert.equal(d.querySelectorAll('style, [style]').length, 0, 'style-Tag oder style-Attribut gefunden');
  });
}

test('[js/site.js] Kein innerHTML, eval oder document.write', () => {
  const js = read('js/site.js');
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function/.test(js));
  assert.match(js, /window\.open\(.*'_blank','noopener'\)/);
  assert.match(js, /encodeURIComponent\(t\.msg\)/);
});

test('[404.html] Style-Hash in der CSP passt zum <style>', () => {
  const d = parse('404.html');
  const style = d.querySelector('style').textContent;
  assert.ok(csp(d)['style-src'].includes(sha(style)), 'Style geändert? Hash in der CSP neu berechnen');
});

for (const file of DEMOS) {
  test(`[${file}] Script-Hash in der CSP passt zum Inline-Script`, () => {
    const d = parse(file);
    const scripts = [...d.querySelectorAll('script:not([src])')].filter((s) => s.type !== 'application/ld+json');
    const allowed = csp(d)['script-src'];
    assert.equal(allowed.length, scripts.length);
    for (const s of scripts) {
      assert.ok(allowed.includes(sha(s.textContent)), 'Script geändert? Hash in der CSP neu berechnen (siehe README)');
    }
  });
}
