# Offertenmeister – Projektregeln

Website für Malerbetriebe in der Deutschschweiz: https://offertenmeister.ch
Inhaber: Mihajlo Tevdoski. Mit ihm auf Mazedonisch (lateinische Schrift) sprechen, kurz und klar.
Alles, was Kunden sehen, ist Schweizer Hochdeutsch: Sie-Form, "ss" statt "ß", CHF, "Offerte", "Grüezi".

## Aufbau
- Technische Referenz (HTML-Schnittstellen, `TX`, WhatsApp-Link, Demo-Daten, Test-Hilfen, häufige Änderungen): `README.md`. Bei Änderungen am Code mitpflegen.
- Statische Seite auf GitHub Pages, Repo `tevdoskiart/offertenmeister`, Branch `main`, Domain über `CNAME`.
- Veröffentlichung über `.github/workflows/pipeline.yml`: Tests → Jekyll-Build → Deploy. Nur wenn alle Tests grün sind, geht die Seite online; sonst bleibt die letzte gute Version. Pages-Quelle = «GitHub Actions».
- Jekyll-Build mit `_config.yml`: `exclude` hält CLAUDE.md und andere interne Dateien von der Website fern. Kein `.nojekyll` mehr. Keine `{{`/`{%` in HTML mit Front Matter verwenden.
- `index.html` = Startseite DE, `en/index.html` = englische Version mit gleichem Aufbau. Inhalt (HTML-Text) immer in beiden Sprachen ändern.
- Gemeinsames Design in `css/site.css`, gemeinsames Script in `js/site.js` (Sprache aus `<html lang>`, Texte im Objekt `TX`). Beide Seiten binden sie mit `?v=<zahl>` ein: nach jeder Änderung die Zahl in BEIDEN Seiten erhöhen (Cache). `404.html` = eigene Fehlerseite (DE + EN).
- `demo/basic/` (hell, Preisrechner) und `demo/premium/` (dunkel, DRONE-HUD, 3D). Beide `noindex` (nicht in robots.txt sperren, sonst sieht Google das noindex nicht).
- Persönliche Entwurf-Seiten für die Akquise: `/e/<kürzel>/` (seit 28.11.2026). Neuer Betrieb = Eintrag in `tools/betriebe.json`, dann `npm run entwurf`, `npm test`, Push (README «Persönliche Entwurf-Seiten»). Die alte Form `/entwurf.html?f=<kürzel>` bleibt nur für die am 27.11.2026 verschickten Links. Seit 28.11.2026 hat jeder Entwurf Ortsseiten `/e/<kürzel>/maler-<ort>/` (Feld `orte`, Vorlage `tools/ort-vorlage.html`) und JSON-LD `HousePainter`; im JSON-LD nichts Erfundenes (keine Bewertungen, Zeiten, Preise). Design der Entwürfe (`entwurf.css`) folgt der Startseite: gleiche Schrift und Farben, Akzent Rot (Feld `farbe` für eine andere Akzentfarbe).
- Kontaktformular sendet per WhatsApp oder öffnet das E-Mail-Programm an info@offertenmeister.ch (kein Server, nichts gespeichert).
- Teilen-Bilder: `img/og-de-v3.jpg` und `img/og-en-v3.jpg` (1200×630).
- Handy-Menü: Burger-Knopf ab 640 px, Sprachwechsel unter 480 px im Menü.
- `img/` Bilder als WebP, `fonts/` Schriften lokal (keine Google Fonts, kein Tracking).

## Design
- Schrift Archivo, Überschriften mit Breite 125 (`font-stretch:125%` + `"wdth" 125`).
- Farben: putz #F3ECE4, rot #C8261B, rot-dunkel #A31D14, graphit #2B2723, beton #CFC8BF, text-2 #5A534C.
- Maskottchen: realistische 3D-Ton-Figur mit lächelndem Gesicht in Fanta-Orange (#FF8200, seit 27.11.2026, Wunsch des Inhabers), schwarzer Sonnenbrille, weisser Kappe und weisser Latzhose mit roten, gelben und blauen Farbspritzern, weisse Handschuhe und Schuhe, Schweizer Rot als Akzent. Referenz: `img/social-maler-v2.webp`. Gilt für alle Bilder der Startseite; Logo seit 28.11.2026 ebenfalls mit Fanta-Orange: `logo-v3.webp` (Icon `logo-icon-v3.webp` aus Higgsfield, Schriftzug aus `logo-v2.webp` übernommen), dazu `favicon-192-v3.png` und `apple-touch-icon-v3.png`. Seit 28.11.2026 auch `favicon.ico`, die Teilen-Bilder (`og-*-v3.jpg`) und die Angebotsbilder (`angebot/angebot-*-v2.jpg` + `-720.webp`): mit PIL aus den v1/v2-Bildern gebaut, nur Logo und Bildfläche ersetzt (Quellen: `hero-3d-maler-v3`, `demo-geraete-v4`, `social-maler-v2`), Texte und Preise unverändert. Die Demos zeigen das Maskottchen nicht. Alte og-v2- und angebot-v1-Dateien bleiben als Reserve (ab 05.12.2026 löschbar). Die v2-Logo-Dateien bleiben als Reserve (ab 05.12.2026 löschbar).
- Kopfzeile (seit 28.11.2026): roter Streifen oben, Logo 70 px (Handy 46/42 px), beim Laden springt das Logo herein, das Menü rutscht nach und der Knopf «Gratis Entwurf» pulsiert zweimal. Nur Transform, keine opacity, und nur ohne `prefers-reduced-motion`.
- Hero (`img/hero-3d-maler-v3.webp`): echtes Foto als Hintergrund (Zimmer, Maler auf der Leiter). Über dem Bild liegt links ein heller Verlauf (`.hero::after` in `css/site.css`), damit die Überschrift lesbar bleibt; auf dem Handy aus.
- Bild-Videos (Treppe, Demo-Geräte, Pakete): kurze MP4 ohne Ton über einem Standbild, Klasse `stufen-video`, Start in `js/site.js` (siehe README). Videos entstehen mit Higgsfield `seedance_2_0`, mode `fast` (Plan Basic), Start- und Endbild.
- Bewegung sparsam und immer mit `prefers-reduced-motion` abschaltbar.

## Preise (überall gleich halten: Preiskarten, FAQ, Schema)
- Basic: CHF 490 Start + CHF 190 pro Monat, oder CHF 1'990 einmalig.
- Premium: CHF 790 Start + CHF 290 pro Monat, oder CHF 2'990 einmalig.
- Einmalig: erstes Jahr inklusive, danach CHF 390 pro Jahr.
- Social Media: Start CHF 390/Mt., Plus CHF 690/Mt. (Reels auch auf TikTok), Werbung CHF 350/Mt. (+ Budget direkt an Meta), Kombi Plus + Werbung CHF 990/Mt. Einrichtung CHF 290 (Werbung CHF 390), für Website-Kunden gratis. Monatlich kündbar.
- 15 % Rabatt auf den ersten Monat (Abo-Monatspreis, nicht Start oder Einmalpreis; ersetzt den früheren «Einführungspreis für die ersten 3 Betriebe»).
- Kostenloser Entwurf zuerst, 50 % bei Zusage, 50 % bei Übergabe.

## Regeln für Änderungen
- Jedes ersetzte Bild bekommt einen NEUEN Dateinamen (GitHub Pages cacht ca. 10 Minuten). Das alte Bild NICHT im gleichen Push löschen: Besucher mit einer gespeicherten Seite (vor allem iPhone/Safari) laden sonst die alte Seite mit gelöschten Bildern und sehen leere Felder (so passiert am 27.11.2026). Alte Bilder frühestens eine Woche später mit `git rm` entfernen. Am 27.11.2026 ersetzt und noch als Reserve im Ordner: `hero-3d-maler-v2`, `anfrage-offerte-v2`, `fassade-schweiz-v2`, `sieben-stufen-v2`, `demo-geraete-v3`, `paket-basic-v2`, `paket-premium-v2`, `social-maler`, `faq-maler-v2`, `kontakt-whatsapp-v2`, `intro-banner-990` (ab 05.12.2026 löschbar).
- Grosse Bilder (Breite ≥ 800 px) brauchen eine kleine Version fürs Handy: `name-720.webp` (bzw. 600/640/800, siehe README) mit `srcset` und `sizes`. Test prüft das. Hero-Preload mit `fetchpriority="high"` und `imagesrcset`.
- Bilder entstehen mit Higgsfield (`gpt_image_2_6`), Maskottchen-Referenz als `image_references`.
- Tests: `npm install` einmal, dann `npm test` (node:test + jsdom, Ordner `tests/`). Prüfen Script-Verhalten DE/EN, Preise, Links, Bilder, SEO und die Demo-Rechner. Laufen automatisch in der Pipeline (Actions «Pipeline») und blockieren die Veröffentlichung, wenn einer rot ist. Preise ändern = auch `PRICES` in `tests/content.test.js` ändern.
- Leistung (Stand 24.11.2026, Lighthouse Handy): Performance 99, Barrierefreiheit 100, LCP ≈ 2.2 s, 255 KB. Archivo-Subset lohnt nicht (nur −10 KB).
- Sicherheit: jede Seite hat eine CSP als `<meta>`. Startseiten ohne Inline-Style/-Script (alles in `css/site.css` / `js/site.js`). Demo-Script oder 404-Style geändert → SHA-256-Hash in der CSP neu berechnen (README 8a), `tests/security.test.js` prüft es.
- Vor dem Push prüfen: `npm test` grün, JS-Syntax (`node --check js/site.js`), Desktop 1366 px und Handy 390 px im Headless-Chrome, kein horizontales Scrollen.
- Commit-Identität: `tevdoskiart <tevdoskiart@users.noreply.github.com>`. Keine private E-Mail in Commits.
- Nach dem Push live prüfen, dem Inhaber den Link mit `?v=<zahl>` geben.
- Keine Passwörter eingeben. DNS- und Kontoänderungen nur nach ausdrücklichem "da".

## Offene Punkte
- info@offertenmeister.ch ist eingerichtet und überall eingetragen (Weiterleitung an Gmail).
- Erste echte Referenz mit Name und Ort.
- Google Search Console verbinden.
