# Malgenerator for turkalender

Nettside som lar frivillige i DNT Oslo og Omegns turlag lage ferdige bilder til Facebook og Instagram, låst til DNTs profil. To maler: turkalender (flere turer i liste) og arrangement (ett arrangement, også i liggende format). Ren HTML, CSS og JavaScript uten byggesteg, laget for GitHub Pages.

**Kjøre lokalt:** `python3 -m http.server 8765` i rotmappen, åpne http://127.0.0.1:8765/. Ikke åpne `index.html` direkte fra disk, da blokkerer nettleseren fonter og eksport.

**Hvor ting bor:** all logikk i `js/app.js` (tilstand, `beregn()` som velger `beregnTurkalender()` eller `beregnArrangement()`, plakatmaler i `MALER` og `MALER_ARR`, lagring, eksport i `lastNed()`). Konstantene `TEKST`, `OPPSETT`, `FORMATER`, `GRAD`, `ARR_OPPSETT`, `ARR_TYPER` og `ARR_INFO` øverst i samme fil styrer størrelsestrinn, maksgrenser, farger og hvilke felt arrangementsmalen viser. Skjemafelt som bare gjelder én mal er merket `data-mal`, felt som bare gjelder én arrangementstype er merket `data-arr-type`. Designtokens i `css/tokens.css`, alt annet i `css/app.css`. Begrunnelser bak trinn og grenser står i `docs/design.md`.

## Det du ikke kan lese deg til

- Plakaten (`#plakat`) rendres alltid i 1080 px bredde og skaleres kun visuelt med `transform`. All plakat-CSS må derfor være i px, aldri rem, vw eller prosent.
- Eksporten bruker html2canvas 1.4.1, som ikke støtter `object-fit`. Fotoet legges derfor som `background-image` med utregnet `background-size` i px (`bakgrunn()` i app.js). Bildeadressen settes direkte på elementet, ikke via CSS-variabel.
- Tittel og overlinje skaleres ned til én linje med canvas `measureText` (`tilpassStorrelse()`). Det krever lastede fonter, derfor rendres plakaten på nytt ved `document.fonts.ready`. Klipp ikke denne omrenderingen.
- Utsnitt (x, y, zoom) lagres per format, så feed, story og liggende kan ha ulikt utsnitt av samme bilde. Kvadrat (1080 × 1080) ble fjernet 14. september 2026, ikke legg det inn igjen uten avklaring.
- Turkalenderen har maksgrenser per oppsett. Arrangementsmalen har ingen grense, men `sjekkPlass()` måler etter rendering om innholdet flyter over, og viser advarsel. Formatet liggende finnes bare for arrangement.
- Skjemaet lagres i `localStorage` under nøkkelen `dnt-ukens-turer-v1`. Opplastede bilder lagres bevisst ikke.
- Fontene ABC Social, ABC Social Extended og Romek er lisensierte. De skal ligge lokalt i `assets/fonts`, ikke på et CDN, og ikke byttes ut uten avklaring.
- Logo, Turbo og det røde båndet nederst er alle av som standard (`visLogo`, `visTurbo`, `visBand`), fordi bildet skal fungere som ren SoMe-post. Turbo (`assets/img/turbo.png`, transparent PNG) står alltid i tillegg til DNT-logoen, aldri i stedet for. Plassering per oppsett i `malTurbo()`-kallene, størrelse via `--turbo-h`.
- Båndets høyde 88 px finnes bare som `band` i `beregn*()` og som `--band-h` i CSS. Når båndet er av er den 0, og fotokolonnen i «Stående til høyre», fotoflaten i liggende «Foto og tekstfelt», innholdet på foto i arrangement og Turbo over båndet følger med ned.
- Eksempelbildene i `assets/img/eksempler` er ekte foto med fotograf oppgitt i `EKSEMPELBILDER` i app.js. Ett liggende og ett stående trekkes tilfeldig ved hver åpning. Tre av de stående er beskjæringer av liggende foto. Ikke legg inn KI-genererte bilder. Det er et poeng med hele verktøyet.
- Fargene følger DNTs tidligere brandbook (fulle tonerekker) og er definert i `css/tokens.css`. Den nye, flate paletten ligger der også (`--ny-*`) og er tillatt i nye elementer. Bruk tokens, ikke egne toner. Graderingsfargene i `GRAD` følger DNTs graderingsstandard.

## Designrammer

Farger og fonter kommer fra `css/tokens.css`. Minste tekst i plakaten er 24 px. Ingen emoji i plakaten. Norsk bokmål i kode, kommentarer, commit-meldinger og grensesnitt, uten tankestrek.

## Pekere

- Profil og språk: skillene `dnt-profil` og `dnt-tone-of-voice`.
- Publisering på GitHub Pages: `README.md`.
- Original Claude Design-bundle ligger i `original/` (ignorert av git) hvis noe må sjekkes mot utgangspunktet.
