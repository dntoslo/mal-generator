# Designbeslutninger i Turposten

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

`OPPSETT[...].maks` angir hvor mange turer det er plass til per format. «Stor tekst» trekker fra én, men aldri under tre. Grensene er satt ved å teste visuelt i Claude Design, ikke regnet ut. Endrer du høyder (`heroH` i `beregnTurkalender()`), må grensene sjekkes på nytt.

| Oppsett | Innlegg | Historie |
|---|---|---|
| Bilde øverst (`topp`) | 8 | 8 |
| Stort bilde (`bakgrunn`) | 7 | 8 |

Fram til 25. september 2026 fantes også «Stort bilde» med beige flate under fotoet (5 og 7 turer) og «Stående til høyre» (7 og 8). De ble tatt ut for å gjøre valgene enklere. Det nye «Stort bilde» er det som før het «Bilde som bakgrunn», fordi det gir plass til flest turer og viser mest av fotoet.

Formatet kvadrat (1080 × 1080) fantes fram til 14. september 2026, men ble tatt ut fordi innlegg og historie dekker behovet i Facebook og Instagram.

## Hvorfor «Stor tekst» tar fra antall turer

Alternativet var å krympe luften i designet. Det gir en trangere plakat som bryter med DNTs rolige uttrykk. Turlag med mange seniorer er bedre tjent med to bilder enn én uleselig.

## Tittel som tilpasser seg

Tittelen skal helst stå på én linje. `tilpassStorrelse()` i app.js måler tekstbredden med canvas og skalerer skriften ned i steg på 2 px: fra 92 til 56 px i heroen (bredde minus 56 px marg og 170 px reservert til logoen). Får den fortsatt ikke plass på minste størrelse, brytes den. Overlinjen med turlagets navn og perioden («DNT BÆRUM   UKE 42, OKTOBER», med luft mellom) skaleres på samme måte fra 24 til 18 px. Målingen krever at fontene er lastet, så plakaten rendres på nytt når `document.fonts.ready` løser seg.

Bakgrunnen er at en tittel over to linjer på 92 px kolliderte med ukelinjen nederst i heroen i «Bilde øverst» i innlegg.

## Båndet nederst

Nettadressen i det røde båndet er sekundær informasjon og settes i 30 px medium (27 i kortet i «Stort bilde»), altså under turmålene (34 px) og klokkeslettene (36 px) i hierarkiet. Til venstre står DNT-logoen (`dnt-logo.png`) i en hvit sirkel på 48 px med logoen i 33 px, samme forhold som logoen oppe i fotoet (88 og 60 px). Den røde T-en ville ellers forsvinne mot det røde båndet. Fram til 25. september 2026 brukte båndet en egen hvit T (`dnt-t-ikon.png`) som var smalere enn T-en i logoen, bredde delt på høyde 0,75 mot 0,93, og som derfor så ut som en annen logo.

## Hvitt kort

Kortet i «Stort bilde» er helt hvitt som standard. Avkryssingen «Gjennomskinnelig kort» setter det til 88 % hvitt, så fotoet skinner svakt gjennom. Lavere enn det gjør brødteksten vanskelig å lese over mørke fotopartier. Frostet glass (uskarpt foto bak kortet) er utelukket fordi html2canvas ikke støtter uskarphetsfilter, og eksporten da ville avvike fra forhåndsvisningen.

## Logo og bånd

Den runde T-en i hvit sirkel oppe til høyre i fotoet og det røde båndet med nettadresse nederst er begge valgfrie, og av som standard fra 14. september 2026, fordi bildet gjør seg best i sosiale medier uten avsenderelementer. Heroteksten holder samme bredde uansett, så layouten ikke flytter seg. Når båndet er av, faller høyden 88 px bort: radene i «Bilde øverst» og flatene i arrangement og turtips fyller ned til kanten, og kortet i «Stort bilde» avsluttes etter listen. Nettadressefeltet i skjemaet vises bare når båndet er på.

## Turbo

Barnas Turlags maskot kan slås på med «Vis Turbo». Figuren er «Turbo med stor sekk» som transparent PNG (`assets/img/turbo.png`, 640 px høy), og står alltid i tillegg til DNT-logoen. Plassering: nede til høyre i heroen («Bilde øverst»), under logoen oppe til høyre der kortet dekker fotoets nedre del («Stort bilde»), og 24 px over det røde båndet nede til høyre i arrangement og turtips (over bunnkanten når båndet er av), der innholdet får høyre-padding så teksten ikke går under figuren. Størrelse 200 px (160 der figuren står under logoen).

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

## Fonter

Display-fonten er Whitman fra Font Bureau, fra 25. september 2026. Den erstattet Romek. Bare to filer brukes: `Whitman-RomanLF.ttf` (400) og `Whitman-BoldLF.ttf` (700). LF betyr linjetall, så tall i en tittel («Turer i 2026») står på linje. Med gammeldagse tall (OsF) ville sifrene hoppet opp og ned. Fra 28. september 2026 brukes Whitman bare i titler, ikke i datofeltene. Whitman har ingen Light-vekt, så vekt 300 faller tilbake til Roman. Resten av Whitman-filene (Italic, SmallCaps og OsF) ligger utenfor repoet i `original/`.

Titlene har sporing −0,02 em. Romek hadde −0,03 em, men Whitman er en tekstserif som blir for tett med det. Verdien står i `TITTELSPORING` i app.js og som `letter-spacing` på alle titler som måles: `.p-tittel`, `.a-tittel`, `.m-tittel`, `.s-navn` og `.k-tittel`. De må være like, ellers regner `tilpassStorrelse()` feil bredde.

## Arrangementsmalen

Lagt til 11. september 2026. Ett arrangement (tur, kurs eller dugnad) i to oppsett og to formater, innlegg og historie.

- **Oppsett:** «Stort foto» (foto fyller flaten, tekst i hvitt nederst) og «Foto og tekstfelt» (foto øverst, tekst på lys beige). Fra 14. oktober 2026 er de erstattet av tekstnivåene Merkelapp og Plakat, se «Turposten» under.
- **Fjernet 28. september 2026:** formatet liggende (1920 × 1080) og oppsettet «Uten foto», for å gjøre valgene enklere. Lagrede valg av dem faller tilbake til innlegg og «Stort foto».
- **Faste elementer:** datofelt med rødt dagbånd, stor dato og måned (`.a-chip`, se «Datofeltene» under), tittel i Whitman Bold som skaleres ned til én linje og brytes først under minste størrelse, undertittel, informasjon som etikett og verdi i to kolonner (`ARR_INFO` styrer rekkefølgen), kort tekst på maks 180 tegn, og det røde båndet med nettadresse.
- **Typene** bestemmer bare hvilke valgfrie felt som vises: tur har «Passer for» og «Påmelding», kurs har i tillegg «Pris» og «Påmeldingsfrist», dugnad har «Ta med» og «Servering». Felt som ikke hører til typen skjules i plakaten selv om de har innhold, så et bytte av type ikke sletter noe.
- **Størrelser:** tittel opptil 104 px, brødtekst 30 px. «Stor tekst» ganger informasjon og brødtekst med 1,12.
- **Plass:** i stedet for maksgrenser måler `sjekkPlass()` om innholdet flyter over etter rendering, og skjemaet advarer. Tekstfeltet er begrenset til 180 tegn for å holde plakaten lesbar.

## Turtips

Lagt til 25. september 2026. Ett turmål, i innlegg og historie, med de samme to fotooppsettene som arrangement: «Stort foto» og «Foto og tekstfelt». Koden deles med arrangement i `beregnEnkelt()` og `MALER_ARR`.

- **I stedet for datofelt** står en rød merkelapp med ordet TURTIPS over tittelen (`.a-merke`). Tittelen får derfor hele bredden også i «Foto og tekstfelt».
- **Fakta** (`TIPS_INFO`, i denne rekkefølgen): lengde, varighet, gradering, start, kollektivt, passer for, underveis (hytte eller rasteplass) og beste tid. Tomme felt vises ikke.
- **Gradering** vises som en prikk i graderingsfargen foran ordet (`.a-grad`). På foto får prikken hvit kant, så også blå og svart syns mot mørk bakgrunn.
- **Eksempelinnholdet** (Sognsvann rundt) viser fire fakta. Med seks fakta, altså tre rader, flyter «Foto og tekstfelt» i innlegg med stor tekst over med 20 px. Det er greit når brukeren selv fyller inn mye, for `sjekkPlass()` sier fra, men standardinnholdet skal aldri gi advarsel.

## Datofeltene

Strammet opp 28. september 2026, etter at Daniel valgte variant B blant fire skisser.

- **Arrangement** (`.a-chip`): 184 px (199 med stor tekst). Dagsnavnet står i rødt bånd i 24 px ABC Social Extended Bold med sporing 0,08 em. Tallet er 70 px ABC Social Extended Bold med linjehøyde 0,8. Måneden er 24 px ABC Social Medium med sporing 0,06 em, og en negativ høyremarg på 0,06 em så ordet står midt i feltet. Med stor tekst ganges alle tre med 1,12.
- **Turkalender** (`.p-chip`): feltstørrelsene i `TEKST` er uendret, så radhøyder og maksgrenser står som før. Dagsnavnet er minst 24 px på alle trinn, og tallet er ABC Social Extended Bold, omtrent 5 % større enn Whitman-tallet var.
- **Hvorfor:** Før var feltet 168 px med måneden i 20 px. «SEPTEMBER» gikk nesten ut til kantene, og det var 21 px luft over tallet mot 8 px under måneden. Måneden og turkalenderens dagsnavn (20 til 22 px) var under minstegrensen på 24 px. Whitman-tallet så lett og boklig ut i et lite ikon med sans rundt.
- **Plass:** Med 184 px har det lengste månedsnavnet (september) minst 14 px luft til kanten, også med stor tekst. Det lengste dagsnavnet (torsdag) har minst 24 px.
- **Balanse:** Linjehøyde 0,8 på tallet og 6 px ekstra luft nederst (2 px i turkalenderen) gjør at tallblokken står optisk midt under båndet.

## Turposten (14. oktober 2026)

Verktøyet ble utvidet til de 25 betjente hyttene og fikk navnet Turposten. Bakgrunnen er en kartlegging av hva hyttene poster i egne kanaler: mest ekte foto, karuseller og reels, der posteteksten bærer budskapet. Designede plakater var unntaket, blant annet en KI-generert påskeplakat. Verktøyet skal derfor dytte mot foto først og lite tekst. Skissene ligger i Claude Design (lenke i `CLAUDE.md`).

- **Avsender først.** Brukeren velger turlag eller betjent hytte, og deretter hva innlegget skal fortelle. Hver avsender ser bare sine maler (`MALVALG`). Hyttelenken `?hytte=<id>` velger hytta og starter i Sesong og booking, fordi det var den vanligste posttypen.
- **Tre tekstnivåer.** Postkort (bare signatur), Merkelapp (standard) og Plakat (all informasjon). Merkelapp viser merkelapp eller datofelt, tittel, undertittel og opptil to fakta med ikon. Kort tekst, meny og resten av informasjonen vises bare i Plakat. En gul tips-boks minner om at posteteksten kan bære mye av teksten.
- **Tittel på foto** kan gå over to linjer: først én linje ned til 96 px, ellers to linjer fra 112 px og ned til 64 px, med balansert linjeskift så «15. oktober» ikke deles.
- **Stempelet** (hvitt kort med logo, navn og høyde over havet) står øverst til venstre i Merkelapp, eller nederst når teksten står øverst. Det er den eneste logoen i de organiske innleggene. Den frittstående T-en i hvit sirkel ble droppet for enkeltmalene etter gjennomgang av skissene.
- **Postkortsignaturer.** A: «Hilsen fra» over navnet stort i Whitman, rett på fotoet (standard). B: stempelet med logo. C: fotoet med lys kant og signaturen under, som et postkort. Alle kan velges.
- **Variasjon.** Merkelappen kan være rød eller ha sesongfarge fra den nye paletten: vinter `--ny-bla`, påske `--ny-gul`, sommer `--ny-mork-gronn` (hvit tekst) og høst `--ny-oransje`. «Prøv en annen variant» velger en ny kombinasjon av farge og plassering (nederst, øverst, midtstilt) i Merkelapp, neste signatur i Postkort, neste farge i Plakat og det andre oppsettet i kalenderne.
- **Historie.** Instagram legger knapper over toppen og bunnen, så stempelet står 210 px ned og teksten 340 px over bunnen.
- **Målform.** Først fulgte faste ord og eksempeltekst hyttas målform. Valget ble tatt ut 15. oktober 2026, se «Justeringer 15. oktober 2026».
- **Forslag til posttekst.** To varianter per mal, på bokmål, med fotograf og @dntoslo for hyttene. Ingen utropstegn, ingen emoji.
- **Program** bruker turkalenderens oppsett og regler, med egen liste, tittel og periode, og hyttas navn i overlinjen.
- **Hyttebildene** er tre per hytte fra UT.no, 1800 px brede der originalen tillater det. Noen er bare 1200 px og kan bli myke i Historie.

## Karusell (15. oktober 2026)

Kartleggingen viste at hyttene bruker karuseller mye, og påskeprogrammet til Geiterygghytta var for langt for ett bilde. Karusell er derfor et eget format for turkalender og program, i innleggsformat 1080 × 1350.

- **Forsiden** er bygget som Merkelapp: foto over hele flaten, stempelet, perioden i merkelappen («PÅSKEN 2027»), tittelen og «Bla videre» nede til høyre. Undertittel er valgfri. Farge og plassering varieres med «Prøv en annen variant».
- **Listesidene** har logo og navn øverst, sidetall («2 / 4»), tittelen i Whitman og én blokk per dag: datofelt med dagbånd og dato, og under hverandre klokkeslett i rødt, aktivitet og sted. Punkter med samme dag og dato etter hverandre samles i én blokk. Blokkene veksler mellom hvit og lys beige som i turkalenderen.
- **Fordelingen** måles, ikke regnes ut: alle dagene rendres i et skjult element med samme stiler, og så fylles hver side til det ikke er plass til neste dag. 48 px luft nederst. En dag deles aldri på to bilder. Er én dag høyere enn en hel side, sier skjemaet fra.
- **«Godt å vite»** er siste side når feltet er fylt ut: et annet foto av hytta øverst (540 px), tittel og opptil fem punkter med ikon i beige sirkel. Ikonet velges ut fra ordene i linjen (`ikonFor()`), med i-ikon når ingenting passer.
- **Nedlasting.** Bildene lages ett for ett fra forhåndsvisningen, så de blir identiske med det man ser. Datamaskin: lastes ned etter hverandre, og nettleseren kan spørre om lov til flere filer. Mobil med delingsark: første trykk lager bildene, andre trykk åpner delingsarket, fordi delingsarket krever et ferskt trykk. Filnavnene er nummerert i rekkefølgen de skal lastes opp.
- **Posttekst** får linjen «Bla gjennom bildene for hele programmet», og begge fotografene når forsiden og «Godt å vite» har ulike bilder.

## Justeringer 15. oktober 2026

- **Bare bokmål.** Valget mellom bokmål og nynorsk er tatt ut. Eksempeltekst, faste ord og forslaget til posttekst er på bokmål. Den som vil skrive nynorsk, gjør det i feltene.
- **Bare normal tekst for hyttene.** «Stor tekst» er for turlag med mange seniorer. Hyttene får ikke valget, og plakaten bruker alltid normal størrelse.
- **Ingen midtprikk som skilletegn.** Den tynne prikken (·) mellom høyde og område, i perioden og i lengde og varighet virket KI-generert. Nå står det «1405 moh i Jotunheimen» (eller «på Hardangervidda», «Ved Oslofjorden»), «UKE 42, OKTOBER» (ikke «I», som ser ut som en strek i versaler med sporing), «3,3 km, 1 time» og luft mellom navn og periode i overlinjen.
- **Postkort C med lange titler.** Signaturen med lys kant ble laget for hyttenavn med høyde og område til høyre. I Turtips og Sesong står tittelen og undertittelen der, og de kolliderte. Nå måles begge: får de ikke plass side om side med navnet i minst 72 px, står undertittelen under navnet, og navnet får hele bredden (900 px, ned til 56 px, ellers to linjer). En test av alle hytter, maler, nivåer, signaturer, formater, varianter og karusellsider fant ingen kollisjoner etterpå.
- **Vinterbilder til påske.** Hyttebildene er merket vinter, sommer eller inne. Handler innlegget om påske, vinter eller ski, brukes et vinterbilde. Handler det om sommer eller fiske, brukes et sommerbilde. Sju hytter som er åpne i påsken, manglet vinterbilde og fikk ett fra UT.no.

## Gjennomgang 16. oktober 2026

En gjennomgang av design, foto, kode og brukervennlighet. Første runde er feilrettinger som ikke endrer hvordan plakatene ser ut.

- **Turlagsfeltet er tomt som standard.** Før sto instruksjonen «Fyll inn turlag» som verdi, og den havnet i overlinjen og filnavnet. Nå står det en plassholder i feltet, og overlinjen utelates til navnet er fylt inn. Lagret «Fyll inn turlag» blir tomt.
- **Fokus og kontrast i skjemaet.** Alt som kan nås med tastatur har synlig fokus (rød ring, eller rød kant på tekstfelt). Etiketter og hjelpetekst er minst 0,6 sort, som gir over 4,5:1. Bildeopplastingen kan åpnes med tastatur. Feltene i turlisten er 16 px, så iPhone ikke zoomer inn.
- **Valg uten virkning skjules.** Tekststørrelse vises ikke på Postkort-nivået, og «Detaljer i bildet» vises ikke for postkortet med lys kant (C), som verken har bånd eller Turbo.
- **Deling av lenken.** Open Graph-tagger gir bilde og tekst når lenken (også `?hytte=`) deles i Messenger og e-post. Bildet er Leirvassbu, tatt av Daniel Jacobsen.
- **Ytelse.** `beregn()` kjøres én gang per render og deles av skjemaet og plakaten. Skriving og glidere samles til én render per skjermbilde (`oppdaterSnart()`). Egne bilder er objektadresser (`blob:`), ikke data-URL.
- **Fargetokens i plakaten** kan ikke være `color-mix()`, fordi html2canvas 1.4.1 ikke forstår det. Derfor har plakaten egne hex- og rgba-verdier, og `--foto-bakgrunn` er hex.

Resten av funnene (mobilflyt, fokuspunkt og oppløsning i bildene, tekststørrelser, kodestruktur) er anbefalinger som tas én og én. Bildene er tatt i «Bildekvalitet» under.

## Bildekvalitet (16. oktober 2026)

Fotografens del av gjennomgangen. Midtutsnittet kuttet ofte motivet: på Fannaråkhytta-3 står personen ved 78 til 98 % av bredden, men Innlegg viste bare 27 til 73 %, og på Leirvassbu-1 ble skiløperne kuttet i Historie. Standardzoom på 115 % kuttet og forstørret i tillegg.

- **Fokuspunkt.** Hvert eksempelbilde har `fokus: [x, y]`, motivets plass i prosent fra venstre og ovenfra. Punktene ble satt ved å se på alle 172 bildene med rutenett, og kontrollert med utsnittene for Innlegg, Historie, Plakat og kalenderens fotobånd tegnet inn. Der to motiver ikke får plass i Historie (f.eks. to grupper i hver sin kant), er det tydeligste valgt.
- **Fokuspunktet legges midt i flaten.** Standardutsnittet har `x` og `y` lik `null`, og da regner `bakgrunn()` ut posisjonen som legger fokuspunktet i midten, så langt bildet rekker (`fraFokus()`). Et motiv helt ute i kanten havner ved kanten av flaten i stedet for å forsvinne. Å sette gliderne lik fokuspunktet ville ikke virket: gliderne er prosent av det som stikker utenfor flaten, som `background-position`, så punktet havner på samme prosent av flaten og ikke i midten. Regnestykket må kjenne både flaten og bildet, og gjøres derfor ved hver render. Da passer samme fokuspunkt i alle formater og oppsett.
- **Gliderne** viser utsnittet som faktisk brukes. Flytter brukeren en glider, blir den aksen fast, mens den andre fortsatt følger fokuspunktet. Egne bilder har ikke fokuspunkt og midtstilles.
- **Zoom 100 %.** Standard og «Midtstill» er 100 %, så hele komposisjonen er med og bildet ikke forstørres mer enn flaten krever. «Midtstill» går tilbake til fokuspunktet. Lagret utsnitt med de gamle standardverdiene (50, 50, 115) blir det nye.
- **Oppløsningsvarsel.** `bakgrunn()` regner ut forstørrelsen, dekning × zoom, der 1 er ett bildepunkt per punkt i det ferdige bildet. Over 1,5 (`MAKS_FORSTORRELSE`) viser utsnittsboksen hvor mye bildet forstørres og hvor stort det bør være på lengste side. Ved zoom over 100 % foreslås mindre zoom først. Hyttebildene er 1800 × 1200 eller mindre og forstørres 1,6 ganger eller mer i Historie, så varselet vises der til bildene byttes til større originaler.
- **Bilderolle.** Tilfeldig valg ga feil stemning, f.eks. Leirvassbu-2 (mørk blåtime) til «Booking åpner». Hyttebildene har derfor `rolle`: oversikt (hytta eller landskapet), folk, inne eller detalj. `MAL_ROLLE` sier hva malen helst vil ha: Sesong og booking oversikt, Mat og meny inne og Arrangement folk. Sesongen går foran rollen, så påske gir fortsatt vinterbilde, men bilder innefra passer alle årstider, så Mat og meny får stua også i påsken. Byttes malen, byttes bildet hvis rollen ikke passer. «Nytt bilde fra hytta» blar i fast rekkefølge, først bildene med malens rolle og så resten fra sesongen, så alle bildene kan nås med knappen.

## Turforslag fra UT.no (15. oktober 2026)

Turtips for en hytte starter med et ekte turforslag fra hytta, i stedet for turlagenes «Sognsvann rundt». Det treffer bedre, og vertskapet får en lenke til UT.no å legge i posteteksten.

- **Kilde.** Turforslag på UT.no innen cirka 3 km fra hytta, med DNT-forening eller turlag som eier. Ikke turer fra privatpersoner eller andre organisasjoner. Helst én sommer-dagstur og én ski-dagstur. Har hytta ingen i nærheten, brukes et turforslag som går til eller gjennom hytta, eller en merket DNT-rute fra hytta.
- **Tekst.** Tittel, undertittel og tekst er skrevet ut fra UT-beskrivelsen, uten å legge til noe som ikke står der. Lengde, varighet, gradering, start, kollektivt og beste tid kommer fra UT. Graderingen mappes til `GRAD`: Enkel og Tilrettelagt blir Enkel, Middels krevende blir Middels, Krevende blir Krevende og Ekstra krevende blir Ekspert.
- **Foto.** Turens eget foto fra UT.no, med fotograf, i `assets/img/hytter/turer/`. Knappen «Nytt eksempelbilde» skjules så lenge turens foto brukes. Bytter man til en annen mal, kommer hyttas egne bilder tilbake.
- **Valg av tur.** Ingen liste. Turtips velger turen som passer dagens måned (`maneder`), og «Nytt turforslag» bytter til hyttas neste. Som ellers byttes bare felt som fortsatt har forrige eksempeltekst, så det vertskapet har skrevet selv blir stående.
- **Posttekst.** Linjen «Les mer på ut.no/turforslag/<id>» kommer med så lenge tittel eller tekst fortsatt er turens egen. Skriver vertskapet om begge, kan det være en annen tur, og lenken faller bort.
- **Turlag** er uendret. Bytter man fra hytte til turlag, kommer Sognsvann-eksempelet tilbake.
- **Omfang.** 67 turer for de 25 hyttene, 61 med eget foto. Seks turer mangler brukbart foto i UT (eller fotografen er ukjent) og bruker hyttas bilde fra samme sesong. Ruter har ikke sesong i UT, så månedene er utledet fra kvisteperioden eller hyttas åpningstid. Fire tekster og én kollektivlinje er kortet litt ned, så ingen tur gir plassadvarsel i Plakat.
