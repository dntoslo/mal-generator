# Designbeslutninger i malgeneratoren

Kort om det som ikke er opplagt fra koden. Leses ved behov.

## Størrelsestrinn

`TEKST` i `js/app.js` har to sett (normal og stor), hvert med fire trinn. Trinn 0 er romsligst og trinn 3 tettest. Trinnet velges i `beregn()` slik:

| Antall synlige turer | Trinn |
|---|---|
| 1 til 4 | 0 |
| 5 | 1 |
| 6 | 2 |
| 7 eller flere | 3 |

Deretter justeres det: pluss ett trinn hvis noen tur har detaljer (turleder, varighet, gradering eller påmelding), pluss ett hvis oppsettet ikke er «Bilde øverst» og det er mer enn fire turer, minus ett i Story-format fordi det er mer plass. Trinnet klemmes alltid til 0 til 3.

Minste tekst i plakaten er 24 px på trinn 3 i normal størrelse (`meta` og `detalj`). Det er nedre grense for lesbarhet på mobil, og skal ikke senkes.

## Maksgrenser per oppsett

`OPPSETT[...].maks` angir hvor mange turer det er plass til per format. «Stor tekst» trekker fra én, men aldri under tre. Grensene er satt ved å teste visuelt i Claude Design, ikke regnet ut. Endrer du høyder (`heroH`, `stortH`, `sideBredde` i `beregn()`), må grensene sjekkes på nytt.

| Oppsett | Feed | Kvadrat | Story |
|---|---|---|---|
| Bilde øverst | 8 | 6 | 8 |
| Stort bilde | 5 | 4 | 7 |
| Stående til høyre | 7 | 5 | 8 |
| Bilde som bakgrunn | 7 | 5 | 8 |

## Hvorfor «Stor tekst» tar fra antall turer

Alternativet var å krympe luften i designet. Det gir en trangere plakat som bryter med DNTs rolige uttrykk. Turlag med mange seniorer er bedre tjent med to bilder enn én uleselig.

## Tittel som tilpasser seg

Tittelen skal helst stå på én linje. `tilpassStorrelse()` i app.js måler tekstbredden med canvas og skalerer skriften ned i steg på 2 px: fra 92 til 56 px i heroen (bredde minus 56 px marg og 170 px reservert til logoen), fra 82 til 52 px i «Stående til høyre». Får den fortsatt ikke plass på minste størrelse, brytes den. Overlinjen «TURLAG · UKE · MÅNED» skaleres på samme måte fra 24 til 18 px. Målingen krever at fontene er lastet, så plakaten rendres på nytt når `document.fonts.ready` løser seg.

Bakgrunnen er at en tittel over to linjer på 92 px kolliderte med ukelinjen nederst i heroen i «Bilde øverst» (feed og kvadrat).

## Båndet nederst

Nettadressen i det røde båndet er sekundær informasjon og settes i 30 px medium (28 og 27 i kortvariantene), altså under turmålene (34 px) og klokkeslettene (36 px) i hierarkiet. Ikonet er 36 px høyt og beholder sine egne proporsjoner.

## Hvitt kort

Kortet i «Stort bilde» og «Bilde som bakgrunn» er helt hvitt som standard. Avkryssingen «Gjennomskinnelig kort» setter det til 88 % hvitt, så fotoet skinner svakt gjennom. Lavere enn det gjør brødteksten vanskelig å lese over mørke fotopartier. Frostet glass (uskarpt foto bak kortet) er utelukket fordi html2canvas ikke støtter uskarphetsfilter, og eksporten da ville avvike fra forhåndsvisningen.

## Logo

T-ikonet i det røde båndet nederst er alltid med som avsender. Den runde T-en i hvit sirkel oppe til høyre i fotoet kan skrus av med «Vis DNT-logo i bildet», for kanaler der avsenderen allerede er tydelig. Heroteksten holder samme bredde uansett, så layouten ikke flytter seg.

## Eksempelbilder

Når ingen laster opp eget bilde vises et eksempelbilde fra `assets/img/eksempler/`. Ved hver åpning trekkes ett liggende og ett stående bilde tilfeldig. Forrige trekk huskes i nettleseren (`dnt-ukens-turer-eksempel`) og unngås, så det aldri blir samme bilde to ganger på rad. Knappen «Nytt eksempelbilde» trekker på nytt.

Hvilket av de to som vises avgjøres av fotoflatens proporsjoner: liggende hvis flaten er bredere enn 1,15:1, ellers stående. Eget bilde brukes alltid uansett flate. Bildene er eksempler, ikke et utvalg å velge fra, og skal helst byttes ut med turlagets eget foto.

Plakaten viser ingen fotokreditering. I stedet minner skjemaet om å kreditere fotografen i posteteksten, med navnet fra `EKSEMPELBILDER`. To bilder fra prototypen (skog-liggende, sti-staaende) har ukjent fotograf.

## Farger

To paletter er tillatt, begge definert som tokens i `css/tokens.css`. Plakaten bruker den tidligere brandbooken, som har fulle tonerekker. Eier valgte 10. september 2026 å gå tilbake til dette designet etter en runde med den nye, flate paletten, fordi det så bedre ut.

**Tidligere brandbook (i bruk):**

| Bruk i plakaten | Token | HEX |
|---|---|---|
| Dagbånd i datofelt, klokkeslett, påmelding, bånd nederst | `--dnt-rod` | #D82D20 |
| Plakatbakgrunn, datofelt i hvitt kort, skjemabokser | `--beige-lys` | #F8F2E4 |
| Annenhver rad, knapper, sidebakgrunn | `--beige` | #F2E6D0 |
| Datofelt på hvite rader | `--beige-mork` | #E8D7B6 |
| Annenhver rad, kort, logo-sirkel | `--hvit` | #FFFFFF |
| Tekst, aktiv knapp | `--sort` | #0F0F0F |

Tonerekkene for rød, grønn, blå, gul og oransje (`--rod-2`, `--gronn-3` osv.) og `--beige-hvit` ligger i tokens for senere bruk.

**Ny palett (2026, tillatt i nye elementer):** `--ny-dnt-rod` #D6001C, `--ny-lys-rod` #FFC8C3, `--ny-lys-gronn` #EDF2E4, `--ny-mork-gronn` #597E61, `--ny-bla` #C5DCEA, `--ny-gul` #FFF097, `--ny-oransje` #FFB674, `--ny-beige` #F8F2E4.

Prototypen fra Claude Design brukte tonene #FFF7E9, #F2EDE3, #E8DFCC og #E7E3DA, som ikke står i noen av palettene. De er erstattet med nærmeste tone fra brandbooken.

Graderingsfargene i `GRAD` (Enkel grønn `#2E6B3E`, Middels blå `#316095`, Krevende DNT rød, Ekspert sort) følger DNTs graderingsstandard for turer og skal gjenkjennes som gradering, ikke som merkevarefarger.
