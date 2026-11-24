# Offertenmeister – Entwickler-Dokumentation

Technische Referenz für https://offertenmeister.ch. Projektregeln (Preise, Design, Ablauf beim Ändern) stehen in `CLAUDE.md`; diese Datei beschreibt, **wie der Code zusammenhängt**. Beide Dateien werden per `_config.yml` nicht veröffentlicht.

> **Es gibt keine Server-API.** Die Website ist statisch (GitHub Pages), ohne Backend, Datenbank, Cookies oder Tracking. Die einzigen «Schnittstellen» sind:
> 1. HTML-Attribute, die `js/site.js` liest (Abschnitt 3),
> 2. der WhatsApp-Link `wa.me` für Anfragen (Abschnitt 4),
> 3. strukturierte Daten für Google (Abschnitt 6),
> 4. die Daten-Arrays in den Demos (Abschnitt 7) und die Test-Hilfen (Abschnitt 8).

---

## 1. Dateien

| Pfad | Inhalt |
| --- | --- |
| `index.html` | Startseite Deutsch (`lang="de-CH"`) |
| `en/index.html` | Startseite Englisch (`lang="en"`), gleicher Aufbau wie DE |
| `css/site.css` | Gemeinsames Design beider Startseiten |
| `js/site.js` | Gemeinsames Script beider Startseiten |
| `404.html` | Fehlerseite DE + EN, eigenes kleines CSS |
| `demo/basic/index.html` | Demo «Basic» (hell), CSS und JS in der Datei, DE/EN umschaltbar |
| `demo/premium/index.html` | Demo «Premium» (dunkel, 3D), CSS und JS in der Datei, nur DE |
| `img/` | Bilder (WebP), Teilen-Bilder `og-de.jpg` / `og-en.jpg` (1200×630) |
| `fonts/` | Archivo (Startseiten), Inter, Inter Tight, JetBrains Mono (Demos) |
| `sitemap.xml`, `robots.txt`, `CNAME` | SEO und Domain |
| `_config.yml` | Jekyll: schliesst interne Dateien von der Website aus |
| `tests/`, `package.json` | Unit-Tests (nicht auf der Website) |
| `.github/workflows/tests.yml` | Führt `npm test` bei jedem Push aus |

**Cache:** `css/site.css` und `js/site.js` werden mit `?v=<zahl>` eingebunden. Nach jeder Änderung die Zahl in **beiden** Startseiten erhöhen. Ersetzte Bilder bekommen einen neuen Dateinamen.

---

## 2. Aufbau der Startseite

Abschnitte in dieser Reihenfolge (IDs sind Sprungziele im Menü und in DE/EN identisch; ein Test prüft das):

| ID | Abschnitt |
| --- | --- |
| `#top` | `<main>`, Hero mit `.hero-bild` |
| `#leistungen` | Website, Google-Profil, WhatsApp |
| `#wer` | Zitat «Ich bin selbst Maler» (Fassaden-Band) |
| `#ablauf` | 4 Schritte |
| `#demos` | Links zu den Demos |
| `#pakete` | Preiskarten Basic/Premium mit Schalter |
| `#social` | Social-Media-Angebot mit 4 Karten |
| `#faq` | Häufige Fragen (`<details>`) |
| `#kontakt` | Formular, das WhatsApp öffnet |
| `#impressum`, `#datenschutz` | im Footer |

---

## 3. HTML-Schnittstellen für `js/site.js`

`js/site.js` ist ein einzelner Block ohne globale Variablen. Er erwartet diese Elemente; fehlt eines, bricht das Script ab (die Tests merken es).

### 3.1 Sprache und Texte

```js
const EN = document.documentElement.lang.startsWith('en');
const TX = EN ? { … } : { … };
```

| Schlüssel | Typ | Zweck |
| --- | --- | --- |
| `TX.leer` | `string` | Fehlertext, wenn der Firmenname fehlt |
| `TX.nachricht(firma, ort, web, paket)` | `(string, string, string, string) => string` | Text der WhatsApp-Nachricht. Leeres `ort` → `-`, leeres `web` → `keine` / `none` |

Neue sprachabhängige Texte im Script immer in **beide** Zweige von `TX` schreiben.

### 3.2 Preis-Schalter (Monatlich / Einmalig)

```html
<div class="schalter" role="group">
  <button type="button" aria-pressed="true"  data-m="abo">Monatlich</button>
  <button type="button" aria-pressed="false" data-m="kauf">Einmalig</button>
</div>

<span data-abo="CHF 190" data-kauf="CHF 1'990">CHF 190</span>
```

| Attribut | Wo | Wirkung |
| --- | --- | --- |
| `data-m="abo"` / `data-m="kauf"` | Knöpfe in `.schalter` | Klick setzt `aria-pressed` und schreibt in **jedes** Element mit `data-abo` den Wert aus `data-<m>` |
| `data-abo`, `data-kauf` | beliebiges Element | Text für den jeweiligen Modus. Der Anfangstext im Element muss gleich `data-abo` sein |

Neue umschaltbare Texte: einfach `data-abo` und `data-kauf` setzen, kein JS nötig.

### 3.3 Paket-Knöpfe → Formular

```html
<a href="#kontakt" data-plan="Premium">Premium anfragen</a>
<select id="paket"><option>Noch offen</option><option>Basic</option><option>Premium</option><option>Social Media</option></select>
```

Klick auf ein Element mit `data-plan` setzt `#paket` auf diesen Wert. Der Wert muss genau einer `<option>` entsprechen (DE und EN verwenden dieselben Werte `Basic`, `Premium`, `Social Media`).

### 3.4 Kontaktformular

| Element | Pflicht | Verwendung |
| --- | --- | --- |
| `form#f` | ja | `submit` wird abgefangen, nichts wird gesendet oder gespeichert |
| `#firma` | ja | leer (nach `trim`) → `TX.leer` in `#hinweis`, Fokus zurück auf `#firma` |
| `#ort`, `#web`, `#paket` | nein | gehen in `TX.nachricht` |
| `#hinweis` | ja | `role="status"`, zeigt Fehler an |

### 3.5 Handy-Menü

```html
<header class="kopf">
  <nav class="menu">
    <div class="links" id="hauptmenu">…Links…<a class="sprache-m">English</a></div>
    <a class="sprache">EN</a>
    <a class="btn btn-rot" href="#kontakt">Gratis Entwurf</a>
    <button class="burger" aria-expanded="false" aria-controls="hauptmenu">…</button>
  </nav>
</header>
```

| Aktion | Ergebnis |
| --- | --- |
| Klick auf `.burger` | Klasse `offen` auf `.kopf` umschalten, `aria-expanded` setzen |
| Klick auf einen Link in `.links` | Menü schliessen |
| `Escape` im Kopf | Menü schliessen, Fokus auf `.burger` |

Sichtbarkeit regelt nur CSS: Burger ab `max-width:640px`, `.sprache` wandert unter `480px` als `.sprache-m` ins Menü.

### 3.6 Hero-Bewegung

`.hero-bild` bekommt nach dem Laden die Klasse `da` (startet die Wisch-Animation in CSS). Parallax per Maus und Scroll nur bei `min-width:901px`, feinem Zeiger und ohne `prefers-reduced-motion`. Gesteuert über die CSS-Variablen `--px` / `--py`.

---

## 4. WhatsApp-Anfrage

```
https://wa.me/38978338208?text=<encodeURIComponent(TX.nachricht(...))>
```

Geöffnet mit `window.open(url, '_blank', 'noopener')`. Beispiel (DE):

```
Grüezi Herr Tevdoski

Firma: Maler Muster AG
Ort: Uster ZH
Website: www.maler-muster.ch
Interesse: Premium

Bitte schicken Sie mir einen kostenlosen Website-Check.
```

Nummer ändern: in `js/site.js` (Link), im Kontakt-Text und Impressum beider Seiten und im JSON-LD (`telephone`).

---

## 5. CSS

**Farben** (`:root` in `css/site.css`): `--putz #F3ECE4`, `--rot #C8261B`, `--rot-dunkel #A31D14`, `--graphit #2B2723`, `--beton #CFC8BF`, `--weiss #FFFFFF`, `--text-2 #5A534C`.

**Bausteine:** `.wrap` (Breite 1240 px), `.teil` (Abschnitt mit Abstand), `.putz` / `.sozial` / `.kontakt` (Hintergründe), `.split` (+ `.umgekehrt`), `.btn` (+ `.btn-rot`, `.btn-weiss`), `.paket` (+ `.premium`), `.s-karten` (+ `li.top`), `.s-punkte`, `.bedingungen`.

**Breakpoints:**

| Breite | Änderung |
| --- | --- |
| ≤ 980 px | Spalten untereinander |
| ≤ 900 px | Hero-Bild über dem Text |
| ≤ 640 px | Burger-Menü, Logo 40 px, Social-Karten einspaltig |
| ≤ 480 px | Sprachwechsel im Menü statt in der Leiste |
| ≤ 420 px | kleinerer Knopf «Gratis Entwurf» |

Jede Animation hat einen `prefers-reduced-motion: reduce`-Fall.

---

## 6. SEO-Daten (für Google)

| Was | Wo | Regel |
| --- | --- | --- |
| `ProfessionalService` (JSON-LD) | `<head>` | Name, URL, Logo, `telephone`, `email: info@offertenmeister.ch` |
| `FAQPage` (JSON-LD) | `<head>` | **Gleiche Fragen und Antworten, gleiche Reihenfolge** wie die sichtbaren `<details>` in `#faq` (Test prüft das Wort für Wort) |
| `canonical` | `<head>` | DE `/`, EN `/en/` |
| `hreflang` | `<head>` | `de-CH` → `/`, `en` → `/en/`, `x-default` → `/` (auf beiden Seiten gleich) |
| Open Graph | `<head>` | `og:image` = `og-de.jpg` / `og-en.jpg`, `og:locale`, `twitter:card` |
| `sitemap.xml` | Root | beide Seiten mit `xhtml:link`-Alternativen |
| Demos | `<meta name="robots" content="noindex">` | **nicht** in `robots.txt` sperren |

---

## 7. Daten in den Demos

Die Demos sind auch Vorlagen für Kunden-Websites. Inhalte stehen in Arrays am Anfang des Scripts; das HTML wird daraus erzeugt.

### 7.1 Preisrechner (beide Demos)

```js
// [kategorie, CHF min, CHF max, einheit]
// kategorie: 0 = Innen, 1 = Fassade, 2 = Fugenlos
// einheit:   0 = m² (im Rechner), 1 = Stk. (nur in der Preistabelle)
const P = [[0, 24, 34, 0], [0, 32, 45, 0], …];
```

- Rechner: `#seg` (Kategorie-Knöpfe `data-c`), `#cwork` (Arbeit), `#carea` (Fläche, Schieber 5–400 m²).
- Ergebnis in `#cres`: `CHF <min × m²>–<max × m²>`, Zahlen mit `toLocaleString('de-CH')`.
- `#ptab`: Preistabelle aus allen Einträgen von `P`.
- Positionsnamen: Basic in `T.de.prices` / `T.en.prices`, Premium in `PR` (gleiche Reihenfolge wie `P`).

### 7.2 Demo Basic: Texte `T`

```js
const T = { de: { h1: '…', prices: [...], wo: [...], steps: [...], tiles: [...], revs: [...], faq: [...], … },
            en: { …gleiche Schlüssel… } };
```

- Elemente mit `data-t="<schlüssel>"` bekommen den Text `T[L][schlüssel]` (51 Stellen).
- Listen: `prices` (Rechner/Tabelle), `wo` (Formular Schritt 1), `steps` `[titel, text]`, `tiles` `[titel, text]`, `revs` `[name, wann, text]`, `faq` `[frage, antwort]`.
- `thx(name, arbeit)` = Dankestext (Name wird vorher von `<>&"` befreit).
- Sprache wechseln: `.lang button[data-l="de|en"]`, setzt auch `<html lang>`.
- Weitere Daten: `PJ` (Vorher/Nachher-Bilder), Einsatzgebiet direkt in `$('areas')`.

### 7.3 Demo Premium

| Array | Format | Wofür |
| --- | --- | --- |
| `TW` | `[ort, x, y, farbe, 'start'|'end']` | Radar-Karte und Einsatzgebiet (erster Eintrag = Firmensitz) |
| `PR`, `P`, `U` | wie 7.1 | Rechner und Preistabelle |
| `BA` | `[vorher.webp, nachher.webp]` | Vorher/Nachher-Galerie |
| `MO` | `[svg-pfad, titel, text]` | Leistungs-Module |
| `ST` | `[titel, text]` | Ablauf |
| `RE` | `[name, wann, text]` | Bewertungen |
| `SS` | `{schlüssel: [label, farbe]}` | Status in der Anfragen-Übersicht (`neu`, `bes`, `off`, `auf`) |
| `D` | `[zeit, name, arbeit, ort, m², status]` | Beispiel-Anfragen im Dashboard |
| `FQ` | `[frage, antwort]` | FAQ |
| `WO` | `string[]` | Arbeiten im Formular, Schritt 1 |
| `BL` | `string[]` | Text der Start-Animation |

Eine abgeschickte Demo-Anfrage wird vorne in `D` eingefügt und erscheint im Dashboard (Eingaben werden von `<>&"` befreit).

### 7.4 Demo → Kunden-Website (Kurzanleitung)

1. Demo-Ordner kopieren, `noindex` und den Demo-Hinweis entfernen.
2. Firmenname, Telefon, Adresse, Zeiten im HTML ersetzen.
3. `P` mit den Preisen des Kunden füllen, Namen in `prices` / `PR`.
4. Einsatzgebiet (`areas` / `TW`), Bewertungen (`revs` / `RE`), Fotos (`PJ` / `BA`) ersetzen.
5. WhatsApp-Knöpfe (`.walink`) und Formular auf die Nummer des Kunden umstellen, statt der Demo-Meldung.

---

## 8. Tests

```bash
npm install   # einmal (installiert jsdom)
npm test      # node --test tests/*.test.js
```

| Datei | Prüft |
| --- | --- |
| `tests/site.test.js` | `js/site.js` auf DE und EN: Schalter, Paket-Knöpfe, Formular, WhatsApp-Text, Menü |
| `tests/content.test.js` | Preise (`PRICES`), Rabatt, keine alten Angebote, FAQ = JSON-LD, Bilder, Links, hreflang, sitemap/robots/_config |
| `tests/demo.test.js` | Rechner, Kategorien, Preistabelle, Formular-Schritte, HTML-Schutz, Sprachwechsel, Dashboard |

### Hilfen in `tests/helpers.js`

| Funktion | Rückgabe | Zweck |
| --- | --- | --- |
| `loadSite(rel)` | `window` | Startseite laden und `js/site.js` ausführen. `window.open` ist ersetzt: geöffnete URLs stehen in `window.__opened` |
| `loadDemo(rel)` | `window` | Demo mit ihrem eigenen Script laden (`prefers-reduced-motion` aktiv, keine Animationen) |
| `parse(rel)` | `document` | HTML ohne Script, für Inhalts-Prüfungen |
| `read(rel)` / `exists(rel)` | `string` / `boolean` | Datei lesen / prüfen |
| `chf(n)` | `string` | `'CHF ' + n` im Schweizer Zahlenformat, wie auf der Website |

Neuer Test, Beispiel:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSite } = require('./helpers');

test('Social-Media-Knopf füllt das Formular', (t) => {
  const w = loadSite('index.html'); t.after(() => w.close());
  w.document.querySelector('[data-plan="Social Media"]').click();
  assert.equal(w.document.getElementById('paket').value, 'Social Media');
});
```

GitHub Actions («Tests») führt alle Tests bei jedem Push auf `main` aus.

---

## 9. Häufige Änderungen

| Aufgabe | Wo ändern |
| --- | --- |
| **Preis ändern** | Preiskarten (`data-abo` / `data-kauf` und Anfangstext), FAQ-Antwort und `FAQPage`-JSON-LD, Social-Karten – in `index.html` **und** `en/index.html`; dazu `CLAUDE.md` und `PRICES` in `tests/content.test.js` |
| **Neue FAQ-Frage** | `<details>` in `#faq` und gleicher Eintrag im `FAQPage`-JSON-LD, beide Sprachen |
| **Text im Formular-Script** | `TX` in `js/site.js` (beide Sprachen), Version `?v=` erhöhen |
| **Design** | `css/site.css`, Version `?v=` in beiden Seiten erhöhen |
| **Neuer Menüpunkt** | Link in `.links` beider Seiten, Ziel-ID muss existieren |
| **Bild ersetzen** | neue Datei mit neuem Namen in `img/`, alte mit `git rm` löschen, `width`/`height`/`alt` setzen |
| **Neue Option «Interesse»** | `<option>` in `#paket` (beide Sprachen, gleicher Wert) und ggf. `data-plan` |

Vor jedem Push: `npm test` grün, Desktop 1366 px und Handy 390 px ansehen, kein horizontales Scrollen.
