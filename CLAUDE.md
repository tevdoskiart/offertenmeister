# Offertenmeister – Projektregeln

Website für Malerbetriebe in der Deutschschweiz: https://offertenmeister.ch
Inhaber: Mihajlo Tevdoski. Mit ihm auf Mazedonisch (lateinische Schrift) sprechen, kurz und klar.
Alles, was Kunden sehen, ist Schweizer Hochdeutsch: Sie-Form, "ss" statt "ß", CHF, "Offerte", "Grüezi".

## Aufbau
- Statische Seite auf GitHub Pages, Repo `tevdoskiart/offertenmeister`, Branch `main`, Domain über `CNAME`.
- Jekyll-Build mit `_config.yml`: `exclude` hält CLAUDE.md und andere interne Dateien von der Website fern. Kein `.nojekyll` mehr. Keine `{{`/`{%` in HTML mit Front Matter verwenden.
- `index.html` = Startseite DE, `en/index.html` = englische Version mit gleichem Aufbau. Inhalt (HTML-Text) immer in beiden Sprachen ändern.
- Gemeinsames Design in `css/site.css`, gemeinsames Script in `js/site.js` (Sprache aus `<html lang>`, Texte im Objekt `TX`). Beide Seiten binden sie mit `?v=<zahl>` ein: nach jeder Änderung die Zahl in BEIDEN Seiten erhöhen (Cache). `404.html` = eigene Fehlerseite (DE + EN).
- `demo/basic/` (hell, Preisrechner) und `demo/premium/` (dunkel, DRONE-HUD, 3D). Beide `noindex` (nicht in robots.txt sperren, sonst sieht Google das noindex nicht).
- Teilen-Bilder: `img/og-de.jpg` und `img/og-en.jpg` (1200×630).
- Handy-Menü: Burger-Knopf ab 640 px, Sprachwechsel unter 480 px im Menü.
- `img/` Bilder als WebP, `fonts/` Schriften lokal (keine Google Fonts, kein Tracking).

## Design
- Schrift Archivo, Überschriften mit Breite 125 (`font-stretch:125%` + `"wdth" 125`).
- Farben: putz #F3ECE4, rot #C8261B, rot-dunkel #A31D14, graphit #2B2723, beton #CFC8BF, text-2 #5A534C.
- Maskottchen: weisse 3D-Ton-Figur mit Kappe und Latzhose, Schweizer Rot als Akzent.
- Bewegung sparsam und immer mit `prefers-reduced-motion` abschaltbar.

## Preise (überall gleich halten: Preiskarten, FAQ, Schema)
- Basic: CHF 490 Start + CHF 190 pro Monat, oder CHF 1'990 einmalig.
- Premium: CHF 790 Start + CHF 290 pro Monat, oder CHF 2'990 einmalig.
- Einmalig: erstes Jahr inklusive, danach CHF 390 pro Jahr.
- Social Media: Start CHF 390/Mt., Plus CHF 690/Mt., Werbung CHF 350/Mt. (+ Budget direkt an Meta), Kombi Plus + Werbung CHF 990/Mt. Einrichtung CHF 290 (Werbung CHF 390), für Website-Kunden gratis. Monatlich kündbar.
- 15 % Rabatt auf den ersten Monat (Abo-Monatspreis, nicht Start oder Einmalpreis; ersetzt den früheren «Einführungspreis für die ersten 3 Betriebe»).
- Kostenloser Entwurf zuerst, 50 % bei Zusage, 50 % bei Übergabe.

## Regeln für Änderungen
- Jedes ersetzte Bild bekommt einen NEUEN Dateinamen (GitHub Pages cacht ca. 10 Minuten). Altes Bild mit `git rm` löschen.
- Bilder entstehen mit Higgsfield (`gpt_image_2_6`), Maskottchen-Referenz als `image_references`.
- Vor dem Push prüfen: JS-Syntax (`node --check js/site.js`), Desktop 1366 px und Handy 390 px im Headless-Chrome, kein horizontales Scrollen.
- Commit-Identität: `tevdoskiart <tevdoskiart@users.noreply.github.com>`. Keine private E-Mail in Commits.
- Nach dem Push live prüfen, dem Inhaber den Link mit `?v=<zahl>` geben.
- Keine Passwörter eingeben. DNS- und Kontoänderungen nur nach ausdrücklichem "da".

## Offene Punkte
- info@offertenmeister.ch ist eingerichtet und überall eingetragen (Weiterleitung an Gmail).
- Erste echte Referenz mit Name und Ort.
- Google Search Console verbinden.
