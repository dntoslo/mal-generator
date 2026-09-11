# Malgenerator for turkalender

Nettside som lar frivillige i DNT Oslo og Omegns turlag lage et ferdig bilde med ukens eller månedens turer til Facebook og Instagram, låst til DNTs profil. Ren HTML, CSS og JavaScript uten byggesteg, laget for GitHub Pages.

**Kjøre lokalt:** `python3 -m http.server 8765` i rotmappen, åpne http://127.0.0.1:8765/. Ikke åpne `index.html` direkte fra disk, da blokkerer nettleseren fonter og eksport.

**Hvor ting bor:** all logikk i `js/app.js` (tilstand, `beregn()`, plakatmaler i `MALER`, lagring, eksport i `lastNed()`). Konstantene `TEKST`, `OPPSETT`, `FORMATER` og `GRAD` øverst i samme fil styrer størrelsestrinn, maksgrenser og farger. Designtokens i `css/tokens.css`, alt annet i `css/app.css`. Begrunnelser bak trinn og grenser står i `docs/design.md`.

## Det du ikke kan lese deg til

- Plakaten (`#plakat`) rendres alltid i 1080 px bredde og skaleres kun visuelt med `transform`. All plakat-CSS må derfor være i px, aldri rem, vw eller prosent.
- Eksporten bruker html2canvas 1.4.1, som ikke støtter `object-fit`. Fotoet legges derfor som `background-image` med utregnet `background-size` i px (`bakgrunn()` i app.js). Bildeadressen settes direkte på elementet, ikke via CSS-variabel.
- Tittel og overlinje skaleres ned til én linje med canvas `measureText` (`tilpassStorrelse()`). Det krever lastede fonter, derfor rendres plakaten på nytt ved `document.fonts.ready`. Klipp ikke denne omrenderingen.
- Utsnitt (x, y, zoom) lagres per format, så feed, kvadrat og story kan ha ulikt utsnitt av samme bilde.
- Skjemaet lagres i `localStorage` under nøkkelen `dnt-ukens-turer-v1`. Opplastede bilder lagres bevisst ikke.
- Fontene ABC Social, ABC Social Extended og Romek er lisensierte. De skal ligge lokalt i `assets/fonts`, ikke på et CDN, og ikke byttes ut uten avklaring.
- Eksempelbildene i `assets/img/eksempler` er ekte foto med fotograf oppgitt i `EKSEMPELBILDER` i app.js. Ett liggende og ett stående trekkes tilfeldig ved hver åpning. Ikke legg inn KI-genererte bilder. Det er et poeng med hele verktøyet.
- Fargene følger DNTs tidligere brandbook (fulle tonerekker) og er definert i `css/tokens.css`. Den nye, flate paletten ligger der også (`--ny-*`) og er tillatt i nye elementer. Bruk tokens, ikke egne toner. Graderingsfargene i `GRAD` følger DNTs graderingsstandard.

## Designrammer

Farger og fonter kommer fra `css/tokens.css`. Minste tekst i plakaten er 24 px. Ingen emoji i plakaten. Norsk bokmål i kode, kommentarer, commit-meldinger og grensesnitt, uten tankestrek.

## Pekere

- Profil og språk: skillene `dnt-profil` og `dnt-tone-of-voice`.
- Publisering på GitHub Pages: `README.md`.
- Original Claude Design-bundle ligger i `original/` (ignorert av git) hvis noe må sjekkes mot utgangspunktet.
