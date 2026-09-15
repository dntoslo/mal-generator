# Turplakaten

Et lite nettverktøy for frivillige i DNT Oslo og Omegns turlag. Du velger mal (turkalender eller arrangement), fyller inn innhold, velger bilde og laster ned et ferdig bilde til Facebook og Instagram. Logo, farger, fonter og oppsett er låst til DNTs profil, så resultatet blir riktig uten designkunnskap, og uten KI-genererte bilder.

To maler:

- **Turkalender**: flere turer i én liste, for uka eller måneden.
- **Arrangement**: ett arrangement, som tur, kurs eller dugnad, med tittel, dato, tid, sted, kort tekst og valgfrie felt som pris, påmeldingsfrist eller hva man skal ta med. Kan også lastes ned liggende (1920 × 1080) til Facebook-arrangement og skjerm.

## Slik brukes det

1. Velg mal, og deretter format: Innlegg (1080 × 1350), Historie (1080 × 1920) eller, for arrangement, Liggende (1920 × 1080).
2. Velg tekststørrelse. «Stor» er for turlag med mange seniorer og gir plass til én tur mindre.
3. Velg bildeoppsett og last opp et eget foto fra turlaget. Juster utsnittet med skyveknappene.
4. Fyll inn tittel, turlag, periode (for eksempel «UKE 38 · SEPTEMBER» eller «SEPTEMBER 2026») og eventuelt nettadresse. Det røde båndet med nettadresse nederst, DNT-logoen oppe til høyre og Turbo (Barnas Turlags maskot) nede til høyre er alle av som standard, fordi bildet gjør seg best i sosiale medier uten. Kryss av for det du vil ha med. Standardadressen er dnt.no/oslo, bytt gjerne til turlagets egen side, f.eks. dnt.no/lorenskog. Adressen kan ikke klikkes i sosiale medier, så bruk en kort adresse som er lett å huske.
5. Turkalender: legg inn turene. Dag, dato, klokkeslett, turmål og startsted vises alltid. Turleder, lengde, gradering og påmelding er valgfritt. Arrangement: velg type (tur, kurs eller dugnad) og fyll inn feltene. Tomme felt vises ikke i plakaten. Får ikke innholdet plass, sier skjemaet fra.
6. Trykk «Last ned bildet».

Det du fyller inn huskes i nettleseren til neste gang. «Tøm skjemaet» nullstiller. Får du ikke lastet ned bildet, finnes en reserveløsning: en ferdig prompt med turene dine som kan limes inn i Claude.

## Mappestruktur

```
index.html            skjema og forhåndsvisning
css/tokens.css        DNTs designtokens og fonter
css/app.css           stiler for skjema og plakat
js/app.js             all logikk
js/vendor/            html2canvas 1.4.1 (bildeeksport)
assets/fonts/         ABC Social, ABC Social Extended, Romek (lisensierte)
assets/img/           DNT-logo og T-ikon
assets/img/eksempler/ 29 eksempelfoto som rullerer
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
- Bruk repoet bare til Turplakaten. Ikke legg inn deltakerlister eller andre personopplysninger.

## Eksempelbilder

Når den frivillige ikke har lastet opp eget foto, vises et eksempelbilde fra `assets/img/eksempler/`. Bildet trekkes tilfeldig ved hver åpning, aldri det samme to ganger på rad, og kan byttes med knappen «Nytt eksempelbilde». Skjemaet minner om å kreditere fotografen i posteteksten.

Legge til et bilde: skaler det til 1620 px bredde (liggende) eller 2160 px høyde (stående) som JPEG, legg det i mappen, og legg til én linje i `EKSEMPELBILDER` øverst i `js/app.js` med filnavn, fotograf og om det er stående. Bare ekte foto som DNT har rettighetene til.

Fotografer i dag: Daniel Jacobsen og Marius Dalseg. To bilder fra den opprinnelige prototypen har ukjent fotograf.

## Fonter og bilder

Fontene ABC Social (Dinamo) og Romek (The Designers Foundry) er lisensierte og skal bare brukes i DNTs egne flater. Eksempelbildene er ekte foto. Verktøyet skal ikke bruke KI-genererte bilder.
