# Designbeslutninger i Turplakaten

Kort om det som ikke er opplagt fra koden. Leses ved behov.

## Størrelsestrinn

`TEKST` i `js/app.js` har to sett (normal og stor), hvert med fire trinn. Trinn 0 er romsligst og trinn 3 tettest. Trinnet velges i `beregn()` slik:

| Antall synlige turer | Trinn |
|---|---|
| 1 til 4 | 0 |
| 5 | 1 |
| 6 | 2 |
| 7 eller flere | 3 |

Deretter justeres det: pluss ett trinn hvis noen tur har detaljer (turleder, varighet, gradering eller påmelding), pluss ett hvis oppsettet ikke er «Bilde øverst» og det er mer enn fire turer, minus ett i historie-format fordi det er mer plass. Trinnet klemmes alltid til 0 til 3.

Minste tekst i plakaten er 24 px på trinn 3 i normal størrelse (`meta` og `detalj`). Det er nedre grense for lesbarhet på mobil, og skal ikke senkes.

## Maksgrenser per oppsett

`OPPSETT[...].maks` angir hvor mange turer det er plass til per format. «Stor tekst» trekker fra én, men aldri under tre. Grensene er satt ved å teste visuelt i Claude Design, ikke regnet ut. Endrer du høyder (`heroH`, `stortH`, `sideBredde` i `beregn()`), må grensene sjekkes på nytt.

| Oppsett | Innlegg | Historie |
|---|---|---|
| Bilde øverst | 8 | 8 |
| Stort bilde | 5 | 7 |
| Stående til høyre | 7 | 8 |
| Bilde som bakgrunn | 7 | 8 |

Formatet kvadrat (1080 × 1080) fantes fram til 14. september 2026, men ble tatt ut fordi innlegg og historie dekker behovet i Facebook og Instagram.

## Hvorfor «Stor tekst» tar fra antall turer

Alternativet var å krympe luften i designet. Det gir en trangere plakat som bryter med DNTs rolige uttrykk. Turlag med mange seniorer er bedre tjent med to bilder enn én uleselig.

## Tittel som tilpasser seg

Tittelen skal helst stå på én linje. `tilpassStorrelse()` i app.js måler tekstbredden med canvas og skalerer skriften ned i steg på 2 px: fra 92 til 56 px i heroen (bredde minus 56 px marg og 170 px reservert til logoen), fra 82 til 52 px i «Stående til høyre». Får den fortsatt ikke plass på minste størrelse, brytes den. Overlinjen «TURLAG · UKE · MÅNED» skaleres på samme måte fra 24 til 18 px. Målingen krever at fontene er lastet, så plakaten rendres på nytt når `document.fonts.ready` løser seg.

Bakgrunnen er at en tittel over to linjer på 92 px kolliderte med ukelinjen nederst i heroen i «Bilde øverst» i innlegg.

## Båndet nederst

Nettadressen i det røde båndet er sekundær informasjon og settes i 30 px medium (28 og 27 i kortvariantene), altså under turmålene (34 px) og klokkeslettene (36 px) i hierarkiet. Ikonet er 36 px høyt og beholder sine egne proporsjoner.

## Hvitt kort

Kortet i «Stort bilde» og «Bilde som bakgrunn» er helt hvitt som standard. Avkryssingen «Gjennomskinnelig kort» setter det til 88 % hvitt, så fotoet skinner svakt gjennom. Lavere enn det gjør brødteksten vanskelig å lese over mørke fotopartier. Frostet glass (uskarpt foto bak kortet) er utelukket fordi html2canvas ikke støtter uskarphetsfilter, og eksporten da ville avvike fra forhåndsvisningen.

## Logo og bånd

Den runde T-en i hvit sirkel oppe til høyre i fotoet og det røde båndet med nettadresse nederst er begge valgfrie, og av som standard fra 14. september 2026, fordi bildet gjør seg best i sosiale medier uten avsenderelementer. Heroteksten holder samme bredde uansett, så layouten ikke flytter seg. Når båndet er av, faller høyden 88 px bort: radene i «Bilde øverst» og flatene i arrangementsmalen fyller ned til kanten, fotokolonnen i «Stående til høyre» og fotoflaten i liggende «Foto og tekstfelt» går helt ned, og kortet i «Stort bilde» og «Bilde som bakgrunn» avsluttes etter listen. Nettadressefeltet i skjemaet vises bare når båndet er på.

## Turbo

Barnas Turlags maskot kan slås på med «Vis Turbo». Figuren er «Turbo med stor sekk» som transparent PNG (`assets/img/turbo.png`, 640 px høy), og står alltid i tillegg til DNT-logoen. Plassering: nede til høyre i heroen («Bilde øverst»), under logoen oppe til høyre der kortet dekker fotoets nedre del («Stort bilde», «Bilde som bakgrunn»), nederst i fotokolonnen («Stående til høyre»), og 24 px over det røde båndet nede til høyre i arrangementsmalen (over bunnkanten når båndet er av), der innholdet får høyre-padding så teksten ikke går under figuren. Størrelse 200 px (240 i liggende, 160 der figuren står under logoen eller i sidekolonnen).

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

## Arrangementsmalen

Lagt til 11. september 2026. Ett arrangement (tur, kurs eller dugnad) i tre oppsett og tre formater: innlegg, historie og liggende 1920 × 1080. Internt heter de fortsatt `feed`, `story` og `liggende`.

- **Oppsett:** «Stort foto» (foto fyller flaten, tekst i hvitt nederst), «Foto og tekstfelt» (foto øverst, eller til venstre i liggende, tekst på lys beige) og «Uten foto» (bare tekst på lys beige med en rød linje øverst).
- **Faste elementer:** datofelt med rødt dagbånd, stor dato og måned (`.a-chip`), tittel i Romek Bold som skaleres ned til én linje og brytes først under minste størrelse, undertittel, informasjon som etikett og verdi i to kolonner (`ARR_INFO` styrer rekkefølgen), kort tekst på maks 180 tegn, og det røde båndet med nettadresse.
- **Typene** bestemmer bare hvilke valgfrie felt som vises: tur har «Passer for» og «Påmelding», kurs har i tillegg «Pris» og «Påmeldingsfrist», dugnad har «Ta med» og «Servering». Felt som ikke hører til typen skjules i plakaten selv om de har innhold, så et bytte av type ikke sletter noe.
- **Størrelser:** tittel opptil 104 px i innlegg og historie, 120 i liggende, og litt større i «Uten foto» fordi flaten har plass. Brødtekst 30 px (31 i liggende). «Stor tekst» ganger informasjon og brødtekst med 1,12.
- **Plass:** i stedet for maksgrenser måler `sjekkPlass()` om innholdet flyter over etter rendering, og skjemaet advarer. Tekstfeltet er begrenset til 180 tegn for å holde plakaten lesbar.
