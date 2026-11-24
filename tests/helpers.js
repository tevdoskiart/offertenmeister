// Gemeinsame Hilfen für die Tests: Seiten in jsdom laden, Browser-Funktionen nachbilden.
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

// matchMedia: "reduce" ist aktiv, damit keine Animationen und Timer laufen.
function stubs(w) {
  w.matchMedia = (q) => ({
    matches: q.includes('prefers-reduced-motion:reduce'),
    media: q,
    addEventListener() {},
    removeEventListener() {},
  });
  w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.scrollTo = () => {};
}

// Hauptseite (DE oder EN) laden und js/site.js darin ausführen.
// window.open wird abgefangen, damit die WhatsApp-Links geprüft werden können.
function loadSite(rel) {
  const dom = new JSDOM(read(rel), {
    url: 'https://offertenmeister.ch/' + rel.replace('index.html', ''),
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const w = dom.window;
  stubs(w);
  w.__opened = [];
  w.open = (url) => { w.__opened.push(url); return null; };
  w.eval(read('js/site.js'));
  return w;
}

// Demo-Seite mit ihrem eingebetteten Script laden.
function loadDemo(rel) {
  const dom = new JSDOM(read(rel), {
    url: 'https://offertenmeister.ch/' + rel.replace('index.html', ''),
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse: stubs,
  });
  return dom.window;
}

// HTML nur lesen, ohne Script (für Inhalts-Prüfungen).
function parse(rel) {
  return new JSDOM(read(rel)).window.document;
}

// Gleiche Zahlenformatierung wie auf der Website (z. B. "CHF 1’200").
const chf = (n) => 'CHF ' + Math.round(n).toLocaleString('de-CH');

module.exports = { ROOT, read, exists, loadSite, loadDemo, parse, chf };
