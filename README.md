# Turposten

Et lite nettverktøy for turlag og betjente hytter i DNT Oslo og Omegn. Het Turplakaten fram til oktober 2026. Du velger hvem som poster og hva du vil fortelle, fyller inn, velger bilde og laster ned et ferdig bilde til Facebook og Instagram. Logo, farger, fonter og oppsett er låst til DNTs profil, så resultatet blir riktig uten designkunnskap, og uten KI-genererte bilder. Ved siden av bildet står et forslag til posttekst som kan kopieres.

Malene:

- **Turkalender** (turlag): flere turer i én liste, for uka eller måneden.
- **Program** (hytter): flere programpunkter i én liste, f.eks. påskeprogram.
- **Sesong og booking** (hytter): vi åpner, booking åpner, ledige senger, takk for sesongen eller vi søker folk.
- **Mat og meny** (hytter): dagens middag, gourmethelg eller pizzakveld.
- **Arrangement**: ett arrangement, som tur, kurs eller dugnad.
- **Turtips**: ett turmål med kort tekst og fakta som lengde, varighet og gradering.
- **Postkort**: et fint bilde med signatur og nesten ingen tekst.

## Slik brukes det

1. Velg hvem som poster: turlag eller betjent hytte. Hyttene kan få sin egen lenke, f.eks. `https://dntoslo.github.io/mal-generator/?hytte=leirvassbu`, der hytta er valgt på forhånd. Velg bokmål eller nynorsk.
2. Velg hva du vil fortelle, og format: Innlegg (1080 × 1350) eller Historie (1080 × 1920).
3. Velg hvor mye tekst som skal stå på bildet: Postkort, Merkelapp (standard) eller Plakat. Postkort har tre signaturer å velge mellom. Turkalender og program har bildeoppsett i stedet.
4. Last opp et eget foto, eller bruk eksempelbildet. Hyttene har tre egne bilder hver. Juster utsnittet med skyveknappene.
5. Fyll inn innholdet. Tomme felt vises ikke i bildet. Får ikke innholdet plass, sier skjemaet fra.
6. Trykk «Prøv en annen variant» for annen farge og plassering, så innleggene ikke blir like fra gang til gang.
7. Trykk «Last ned bildet», og kopier forslaget til posttekst.

Det du fyller inn huskes i nettleseren til neste gang. «Tøm skjemaet» nullstiller. Får du ikke lastet ned bildet, finnes en reserveløsning: en ferdig prompt som kan limes inn i Claude.

## Mappestruktur

```
index.html            skjema og forhåndsvisning
css/tokens.css        DNTs designtokens og fonter
css/app.css           stiler for skjema og plakat
js/app.js             all logikk
js/hytter.js          de 25 betjente hyttene med fakta og eksempelbilder
js/vendor/            html2canvas 1.4.1 (bildeeksport)
assets/fonts/         ABC Social, ABC Social Extended, Whitman (lisensierte)
assets/img/           DNT-logo og Turbo
assets/img/eksempler/ 29 eksempelfoto til turlagene
assets/img/hytter/    3 foto per hytte, hentet fra UT.no
docs/design.md        begrunnelser bak størrelser og grenser
CLAUDE.md             kontekst for videre arbeid med Claude Code
```

Ingen byggesteg, ingen avhengigheter utover det som ligger i repoet.

## Kjøre lokalt

Nettleseren blokkerer fonter og eksport når filen åpnes direkte fra disk, så start en enkel server i rotmappen:

```bash
python3 -m http.server 8765
```

Åpne deretter http://127.0.0.1:8765/ i nettleseren.

## Publisere på GitHub Pages

Koden ligger i det offentlige repoet [github.com/dntoslo/mal-generator](https://github.com/dntoslo/mal-generator). Nettsiden publiseres fra `main` til `https://dntoslo.github.io/mal-generator/`.

**Slå på Pages første gang:** i repoet på GitHub, gå til Settings, Pages. Under «Build and deployment» velg «Deploy from a branch», branch `main`, mappe `/ (root)`. Lagre. Etter et minutt eller to er siden oppe. Filen `.nojekyll` sørger for at GitHub serverer filene som de er.

**Publisere endringer senere:** commit lokalt og push til `main`. Pages bygger på nytt automatisk.

```bash
git add -A && git commit -m "Beskriv endringen" && git push
```

**Første innlogging:** GitHub godtar ikke passord over HTTPS. Når `git push` spør om passord, lim inn et personlig tilgangstoken (GitHub: Settings, Developer settings, Personal access tokens, med skrivetilgang til repoet). Alternativt installer GitHub CLI og kjør `gh auth login`. macOS husker innloggingen i nøkkelringen etterpå.

Verdt å vite:

- Repoet er offentlig inntil organisasjonen dntoslo får GitHub Team-lisens, og gjøres privat etter det (Settings, Danger zone, Change visibility). Pages fortsetter å virke fra privat repo på Team-planen. Nettsiden er uansett åpen for alle med lenken. DNT har lisens på fontene.
- Bruk repoet bare til Turposten. Ikke legg inn deltakerlister eller andre personopplysninger.

## Eksempelbilder

Når brukeren ikke har lastet opp eget foto, vises et eksempelbilde fra `assets/img/eksempler/`. Bildet trekkes tilfeldig ved hver åpning, aldri det samme to ganger på rad, og kan byttes med knappen «Nytt eksempelbilde». Skjemaet minner om å kreditere fotografen i posteteksten.

Legge til et bilde: skaler det til 1620 px bredde (liggende) eller 2160 px høyde (stående) som JPEG, legg det i mappen, og legg til én linje i `EKSEMPELBILDER` øverst i `js/app.js` med filnavn, fotograf og om det er stående. Bare ekte foto som DNT har rettighetene til.

Fotografer i dag: Daniel Jacobsen og Marius Dalseg. To bilder fra den opprinnelige prototypen har ukjent fotograf.

Hyttebildene ligger i `assets/img/hytter/` med fotograf i `js/hytter.js`. De ble hentet fra UT.no 14. oktober 2026, tre per hytte, med bilde nr. 1 av hytta i landskapet. Bytt gjerne ut med bilder fra vertskapet eller fra Fotoweb.

## Fonter og bilder

Fontene ABC Social (Dinamo) og Whitman (Font Bureau) er lisensierte og skal bare brukes i DNTs egne flater. Eksempelbildene er ekte foto. Verktøyet skal ikke bruke KI-genererte bilder.
