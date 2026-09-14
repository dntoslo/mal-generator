# Bestilling: la malgeneratoren hente bilder fra bildearkiv.dnt.no

Til den som administrerer FotoWare (bildearkiv.dnt.no) i DNT.

## Hva vi ønsker

DNT Oslo og Omegn har laget et lite nettverktøy der turlagene lager bilder til Facebook og Instagram i DNTs profil: https://dntoslo.github.io/mal-generator/ (kildekode på github.com/dntoslo/mal-generator). I dag laster brukerne opp foto fra egen maskin. Vi vil at de som har bruker i bildearkivet skal kunne logge inn derfra i verktøyet, søke, og velge et bilde direkte, med samme tilgang som de har i arkivet i dag. Ingen nye brukere eller rettigheter, og ingen server hos oss: verktøyet er en statisk nettside som snakker direkte med FotoWare fra nettleseren.

## Det vi trenger fra dere

1. **Registrer en applikasjon i FotoWare** (Site Configuration, Integrations, Applications):
   - Navn: Malgenerator turlag (DNT Oslo og Omegn)
   - Type: offentlig klient (nettleser), OAuth 2.0 med PKCE, uten klienthemmelighet
   - Redirect-URI: `https://dntoslo.github.io/mal-generator/`
   - Rettigheter: lesing (søk og nedlasting av bilder brukeren allerede har tilgang til)
   - Send oss klient-id-en som blir opprettet.

2. **Tillat kall fra nettsiden vår** (Site Configuration, Security, Cross-Origin Resource Sharing, «Allowed origins»): legg til `https://dntoslo.github.io`. Uten dette nekter nettleseren verktøyet å lese søkeresultater og bildefiler, selv om brukeren er logget inn.

3. **Bekreft** hvilke arkiver som skal være søkbare fra verktøyet, om dere vil begrense det til for eksempel «Godkjent for sosiale medier».

## Hva det ikke innebærer

- Ingen endring i hvem som har tilgang til hva. Innloggingen skjer med brukerens egen FotoWare-bruker.
- Ingen kopi av arkivet. Bildet lastes ned til brukerens nettleser bare når det velges, som ved vanlig nedlasting.
- Ingen kostnad. GitHub Pages og FotoWare-API-et er inkludert i det vi allerede har.

## Kontakt

Daniel Jacobsen, DNT Oslo og Omegn, daniel.jacobsen@dnt.no
