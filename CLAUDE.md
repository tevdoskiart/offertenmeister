# Offertenmeister – Projektregeln

Website für Malerbetriebe in der Deutschschweiz: https://offertenmeister.ch
Inhaber: Mihajlo Tevdoski. Mit ihm auf Mazedonisch (lateinische Schrift) sprechen, kurz und klar.
Alles, was Kunden sehen, ist Schweizer Hochdeutsch: Sie-Form, "ss" statt "ß", CHF, "Offerte", "Grüezi".

## Aufbau
- Statische Seite auf GitHub Pages, Repo `tevdoskiart/offertenmeister`, Branch `main`, Domain über `CNAME`.
- `index.html` = Startseite (CSS und JS stehen in der Datei). `404.html` = eigene Fehlerseite.
- `demo/basic/` (hell, Preisrechner) und `demo/premium/` (dunkel, DRONE-HUD, 3D). Beide `noindex`, in robots.txt gesperrt.
- `img/` Bilder als WebP, `fonts/` Schriften lokal (keine Google Fonts, kein Tracking).

## Design
- Schrift Archivo, Überschriften mit Breite 125 (`font-stretch:125%` + `"wdth" 125`).
- Farben: putz #F3ECE4, rot #C8261B, rot-dunkel #A31D14, graphit #2B2723, beton #CFC8BF, text-2 #5A534C.
- Maskottchen: weisse 3D-Ton-Figur mit Kappe und Latzhose, Schweizer Rot als Akzent.
- Bewegung sparsam und immer mit `prefers-reduced-motion` abschaltbar.

## Preise (überall gleich halten: Preiskarten, FAQ, Schema)
- Basic: CHF 990 Start + CHF 190 pro Monat, oder CHF 1'990 einmalig.
- Premium: CHF 1'490 Start + CHF 290 pro Monat, oder CHF 2'990 einmalig.
- Kostenloser Entwurf zuerst, 50 % bei Zusage, 50 % bei Übergabe.

## Regeln für Änderungen
- Jedes ersetzte Bild bekommt einen NEUEN Dateinamen (GitHub Pages cacht ca. 10 Minuten). Altes Bild mit `git rm` löschen.
- Bilder entstehen mit Higgsfield (`gpt_image_2_6`), Maskottchen-Referenz als `image_references`.
- Vor dem Push prüfen: JS-Syntax (`node --check`), Desktop 1366 px und Handy 390 px im Headless-Chrome, kein horizontales Scrollen.
- Commit-Identität: `tevdoskiart <tevdoskiart@users.noreply.github.com>`. Keine private E-Mail in Commits.
- Nach dem Push live prüfen, dem Inhaber den Link mit `?v=<zahl>` geben.
- Keine Passwörter eingeben. DNS- und Kontoänderungen nur nach ausdrücklichem "da".

## Offene Punkte
- info@offertenmeister.ch ist eingerichtet und überall eingetragen (Weiterleitung an Gmail).
- Erste echte Referenz mit Name und Ort.
- Google Search Console verbinden.
