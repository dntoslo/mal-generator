/* =========================================================
   Turposten (DNT Oslo og Omegn), tidligere Turplakaten
   Ren JavaScript uten byggesteg. Én tilstand, to renderfunksjoner:
   renderSkjema() oppdaterer venstre kolonne, renderPlakat() bygger
   plakaten i høyre kolonne. Eksport skjer med html2canvas fra en
   skjult 1:1-klone av plakaten.
   Avsenderen (turlag eller betjent hytte) velges først. Hyttene,
   med fakta og eksempelbilder, ligger i js/hytter.js.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Konstanter ---------- */

  var LAGRINGSNOKKEL = "dnt-ukens-turer-v1";
  var MAKS_TURER = 8;
  var HYTTER = window.HYTTER || [];
  var HYTTEMAPPE = "assets/img/hytter/";

  // Graderingsfargene følger DNTs graderingsstandard (grønn, blå, rød, sort),
  // ikke merkevarepaletten. Rød er likevel DNT Rød fra paletten.
  var GRAD = {
    "Enkel":    "#2E6B3E",
    "Middels":  "#316095",
    "Krevende": "#D82D20",
    "Ekspert":  "#0F0F0F"
  };

  // To tekststørrelser. «Stor» er for turlag med mange seniorer blant deltakerne,
  // og tar plassen fra antall turer, ikke fra luften i designet.
  // Hver liste har fire trinn: trinn 0 er romsligst, trinn 3 er tettest.
  // Dagsnavnet i datofeltet er aldri under 24 px. Datotallet er i ABC Social Extended Bold.
  var TEKST = {
    normal: {
      chip: [116, 106, 96, 88], chipSmal: [100, 94, 88, 84],
      dag: [24, 24, 24, 24], dato: [46, 42, 38, 35], datoSmal: [42, 39, 36, 33],
      title: [34, 31, 28, 26], titleSmal: [31, 29, 27, 25],
      meta: [26, 25, 24, 24], detalj: 24, tid: [36, 33, 30, 28]
    },
    stor: {
      chip: [136, 124, 110, 98], chipSmal: [118, 110, 100, 92],
      dag: [26, 25, 24, 24], dato: [56, 50, 45, 40], datoSmal: [50, 46, 42, 38],
      title: [44, 39, 34, 30], titleSmal: [39, 35, 31, 28],
      meta: [32, 30, 27, 25], detalj: 26, tid: [46, 41, 36, 32]
    }
  };

  var FORMATER = {
    // Nøklene er interne og lagres i skjemaet. Navnene er dem Facebook og Instagram bruker på norsk.
    feed:     { navn: "Innlegg",  bredde: 1080, hoyde: 1350, tekst: "1080 × 1350 px" },
    story:    { navn: "Historie", bredde: 1080, hoyde: 1920, tekst: "1080 × 1920 px" }
    // Liggende (1920 × 1080) ble fjernet 28. september 2026. Lagret «liggende» blir Innlegg i hent().
  };

  // Malene. Turkalender er den opprinnelige, arrangement kom til 11. september 2026,
  // turtips 25. september 2026 og hyttemalene 14. oktober 2026. «avsender» sier hvem
  // som ser malen: tom betyr både turlag og hytter. Turkalender og program deler
  // beregnTurkalender(), resten deler beregnEnkelt() og MALER_ARR.
  var MALVALG = {
    turkalender: { avsender: "turlag", hjelp: "Flere turer i én liste, for uka eller måneden." },
    program:     { avsender: "hytte",  hjelp: "Flere programpunkter i én liste, f.eks. påskeprogram eller ukeprogram." },
    sesong:      { avsender: "hytte",  hjelp: "Vi åpner, booking åpner, ledige senger, takk for sesongen eller vi søker folk." },
    meny:        { avsender: "hytte",  hjelp: "Dagens middag, gourmethelg eller pizzakveld." },
    arrangement: { avsender: "",       hjelp: "Ett arrangement: tur, kurs eller dugnad." },
    turtips:     { avsender: "",       hjelp: "Tips om ett turmål, med lengde, gradering og hvordan du kommer deg dit." },
    postkort:    { avsender: "",       hjelp: "Et fint bilde med signatur og nesten ingen tekst. Budskapet skriver du i posteteksten." }
  };

  // Tittelfonten. Sporingen må være lik letter-spacing på .p-tittel, .a-tittel,
  // .m-tittel og .s-navn i app.css, ellers regner tilpassStorrelse() feil bredde.
  var TITTELFONT = '700 {px}px "Whitman"';
  var TITTELSPORING = -0.02;

  // Hvor mye tekst som står på bildet. Gjelder arrangement, turtips, sesong og meny.
  // Postkort-malen bruker alltid postkortnivået. Merkelapp er standard.
  // «Stort foto» ble til Merkelapp og «Foto og tekstfelt» til Plakat 14. oktober 2026.
  var NIVAA = {
    postkort:  { tekst: "Bare fotoet og en signatur. Budskapet skriver du i posteteksten.",
                 prompt: "foto over hele flaten med en signatur: liten tekst i versaler over navnet, navnet stort i Whitman Bold, og høyde og område under. Ingen annen tekst." },
    merkelapp: { tekst: "Fotoet fyller flaten, med merkelapp, kort tittel og opptil to fakta.",
                 prompt: "foto over hele flaten med mørk gradient, et hvitt stempel med DNT-logo, navn og høyde øverst til venstre, og nederst en avrundet merkelapp, tittel i Whitman Bold, undertittel og opptil to fakta med ikon i hvit sirkel." },
    plakat:    { tekst: "Foto øverst og all informasjonen på lys beige flate under.",
                 prompt: "foto øverst, og all tekst på lys beige flate: merkelapp eller datofelt ved siden av tittelen, undertittel, informasjon i to kolonner med små etiketter, og kort tekst." }
  };

  // Tre postkortsignaturer. A er standard (14. oktober 2026). Bare stempelet (B) har logo.
  var SIGNATURER = {
    a: { navn: "Stor", tekst: "Stor signatur rett på fotoet." },
    b: { navn: "Stempel", tekst: "Lite hvitt stempel med logo, navn og høyde." },
    c: { navn: "Postkort", tekst: "Fotoet med lys kant, som et postkort." }
  };

  // Fargen på merkelappen. Sesongfargene er fra den nye paletten og godkjent 14. oktober 2026.
  var FARGER = {
    rod:    { navn: "Rød",    beskrivelse: "rød",          bg: "var(--dnt-rod)",        fg: "var(--hvit)" },
    vinter: { navn: "Vinter", beskrivelse: "vinterblå",    bg: "var(--ny-bla)",         fg: "var(--sort)" },
    paske:  { navn: "Påske",  beskrivelse: "påskegul",     bg: "var(--ny-gul)",         fg: "var(--sort)" },
    sommer: { navn: "Sommer", beskrivelse: "sommergrønn",  bg: "var(--ny-mork-gronn)",  fg: "var(--hvit)" },
    host:   { navn: "Høst",   beskrivelse: "høstoransje",  bg: "var(--ny-oransje)",     fg: "var(--sort)" }
  };

  // Plassering av teksten i Merkelapp. Byttes med «Prøv en annen variant».
  var PLASSERINGER = { nede: "teksten nederst", oppe: "teksten øverst", midt: "teksten midtstilt" };

  var ARR_TYPER = {
    arrangement: { hjelp: "Tur eller annet enkelt arrangement. Feltene «Passer for» og «Påmelding» er valgfrie." },
    kurs:        { hjelp: "Kurs med pris og påmeldingsfrist. Tomme felt vises ikke i plakaten." },
    dugnad:      { hjelp: "Dugnad med hva folk skal ta med og hva som serveres. Tomme felt vises ikke." }
  };

  // Feltene som vises som etikett og verdi i plakaten, i denne rekkefølgen.
  var ARR_INFO = [
    ["arrTid", "Tid"], ["arrSted", "Sted"], ["arrPasserFor", "Passer for"], ["arrPris", "Pris"],
    ["arrFrist", "Påmeldingsfrist"], ["arrTaMed", "Ta med"], ["arrServering", "Servering"], ["arrPamelding", "Påmelding"]
  ];
  var ARR_FELT = ["arrTittel", "arrUnder", "arrDag", "arrDato", "arrMaaned", "arrTid", "arrSted", "arrTekst",
                  "arrPasserFor", "arrPris", "arrFrist", "arrTaMed", "arrServering", "arrPamelding"];

  // Faktafeltene i turtips, i denne rekkefølgen. Gradering vises med prikk i graderingsfargen.
  var TIPS_INFO = [
    ["tipsLengde", "Lengde"], ["tipsVarighet", "Varighet"], ["tipsGrad", "Gradering"], ["tipsStart", "Start"],
    ["tipsKollektiv", "Kollektivt"], ["tipsPasserFor", "Passer for"], ["tipsUnderveis", "Underveis"], ["tipsSesong", "Beste tid"]
  ];
  var TIPS_FELT = ["tipsTittel", "tipsUnder", "tipsTekst", "tipsLengde", "tipsVarighet", "tipsGrad", "tipsStart",
                   "tipsKollektiv", "tipsPasserFor", "tipsUnderveis", "tipsSesong"];

  // Sesong og booking. Typen bestemmer eksempelteksten og etikett og ikon på de to faktaene.
  var SESONG_TYPER = {
    apner:   { hjelp: "Når hytta åpner for sesongen.",
               fakta: [["Åpent", "Ope", "kalender"], ["Bestilling", "Bestilling", "seng"]] },
    booking: { hjelp: "Når bookingen åpner. Datofeltet vises i Plakat.",
               fakta: [["Periode", "Periode", "kalender"], ["Bestilling", "Bestilling", "post"]] },
    ledig:   { hjelp: "Ledige senger i en periode.",
               fakta: [["Periode", "Periode", "kalender"], ["Bestilling", "Bestilling", "seng"]] },
    takk:    { hjelp: "Takk for sesongen, med dato for neste sesong.",
               fakta: [["Neste sesong", "Neste sesong", "kalender"], ["Bestilling", "Bestilling", "seng"]] },
    soker:   { hjelp: "Rekruttering av sesongansatte.",
               fakta: [["Søknadsfrist", "Søknadsfrist", "kalender"], ["Søknad", "Søknad", "post"]] }
  };
  var SESONG_FELT = ["sesongMerke", "sesongTittel", "sesongUnder", "sesongTekst", "sesongFakta1", "sesongFakta2",
                     "sesongDag", "sesongDato", "sesongMaaned"];
  var MENY_FELT = ["menyMerke", "menyTittel", "menyUnder", "menyLinjer", "menyTid", "menyPris"];
  var POST_FELT = ["postOverlinje", "postNavn", "postMeta"];
  var PROGRAM_FELT = ["programTittel", "programPeriode"];

  // Ord og etiketter i plakaten som skrives annerledes på nynorsk.
  // Alt som ikke står her, er likt på bokmål og nynorsk.
  var NYNORSK = {
    "Sted": "Stad", "Passer for": "Passar for", "Varighet": "Varigheit", "Underveis": "Undervegs",
    "Krevende": "Krevjande", "Turleder": "Turleiar", "Hilsen fra": "Helsing frå",
    "Mandag": "Måndag", "Tirsdag": "Tysdag", "Lørdag": "Laurdag", "Søndag": "Sundag",
    "MAN": "MÅN", "TIR": "TYS", "LØR": "LAU", "SØN": "SUN"
  };

  // Ikonene er fra Lucide (MIT), som i designsystemet Hyttebestilling. Streken er
  // satt til sort direkte, fordi html2canvas tegner SVG uten å arve currentColor.
  var IKON_STI = {
    kalender: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    post:     '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    seng:     '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    klokke:   '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    sted:     '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    bestikk:  '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    rute:     '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>'
  };

  var OPPSETT = {
    topp:     { tekst: "Bildet som bånd øverst. Mest plass til turene.", maks: { feed: 8, story: 8 },
                prompt: "foto med mørk gradient øverst med overskriften over, turlagsnavnet over den og uke/måned nederst i fotoet. Deretter én rad per tur som veksler mellom hvit og beige bakgrunn, med et kvadratisk datofelt (rødt dagbånd med TIR/ONS osv. øverst, dato under), turmål, startsted, og klokkeslettet i rødt til høyre." },
    // Vises som «Stort bilde». «Stort bilde» med beige under fotoet og «Stående til høyre»
    // ble fjernet 25. september 2026, lagrede valg av dem blir til bakgrunn i hent().
    bakgrunn: { tekst: "Bildet fyller hele flaten, turene står i et hvitt kort nederst.", maks: { feed: 7, story: 8 },
                prompt: "foto som fyller hele flaten med mørk gradient, overskriften i hvitt øverst, og turene samlet i et hvitt kort med runde hjørner nederst. Hver tur har et kvadratisk datofelt (rødt dagbånd øverst, dato under), turmål, startsted og klokkeslett i rødt til høyre." }
  };

  // Eksempelbilder som vises når ingen laster opp eget foto. Ett liggende og
  // ett stående trekkes tilfeldig ved hver åpning, aldri samme to ganger på rad.
  // Legg til et bilde: legg filen i assets/img/eksempler/ og én linje her.
  // Alle er ekte foto med kjent rettighetshaver. Ingen KI-genererte bilder.
  // Hyttene har egne eksempelbilder i js/hytter.js.
  var EKSEMPELMAPPE = "assets/img/eksempler/";
  var EKSEMPELBILDER = [
    { fil: "vardedugnad-sulebu.jpg",           fotograf: "Daniel Jacobsen", staaende: false },
    { fil: "snellingen.jpg",                   fotograf: "Daniel Jacobsen", staaende: false },
    { fil: "myrsetra-1.jpg",                   fotograf: "Daniel Jacobsen", staaende: false },
    { fil: "myrsetra-2.jpg",                   fotograf: "Daniel Jacobsen", staaende: false },
    { fil: "fuglemyrhytta.jpg",                fotograf: "Daniel Jacobsen", staaende: false },
    { fil: "fiskepinner-katnosdammen.jpg",     fotograf: "Daniel Jacobsen", staaende: false },
    { fil: "seniorbrosjyre-2026.jpg",          fotograf: "Daniel Jacobsen", staaende: true },
    { fil: "femundsmarka-turlederkurs-1.jpg",  fotograf: "Marius Dalseg",   staaende: false },
    { fil: "femundsmarka-turlederkurs-2.jpg",  fotograf: "Marius Dalseg",   staaende: false },
    { fil: "ostmarka.jpg",                     fotograf: "Marius Dalseg",   staaende: false },
    { fil: "huldreheim.jpg",                   fotograf: "Marius Dalseg",   staaende: false },
    { fil: "bovelstad.jpg",                    fotograf: "Marius Dalseg",   staaende: false },
    { fil: "losbyvassdraget.jpg",              fotograf: "Marius Dalseg",   staaende: false },
    { fil: "skog-liggende.jpg",                fotograf: null,              staaende: false },
    { fil: "sti-staaende.jpg",                 fotograf: null,              staaende: true },
    // Lagt til 11. september 2026
    { fil: "vettakollen-utsikt.jpg",           fotograf: "Daniel Jacobsen", staaende: false },
    { fil: "vettakollen-to.jpg",               fotograf: "Daniel Jacobsen", staaende: false },
    { fil: "vettakollen-par.jpg",              fotograf: "Daniel Jacobsen", staaende: false },
    { fil: "gressholmen.jpg",                  fotograf: "Daniel Jacobsen", staaende: false },
    { fil: "kobberhaughytta-stue.jpg",         fotograf: "Daniel Jacobsen", staaende: false },
    { fil: "myrsetra-skog.jpg",                fotograf: "Daniel Jacobsen", staaende: false },
    { fil: "fjorden-par.jpg",                  fotograf: "Daniel Jacobsen", staaende: false },
    { fil: "liastua-utsikt.jpg",               fotograf: "Daniel Jacobsen", staaende: false },
    { fil: "turbotur-liastua.jpg",             fotograf: "Daniel Jacobsen", staaende: false },
    { fil: "ulsrudvann.jpg",                   fotograf: "Daniel Jacobsen", staaende: false },
    { fil: "vannhuset.jpg",                    fotograf: "Daniel Jacobsen", staaende: false },
    // Stående beskjæringer av liggende foto, så de stående oppsettene får variasjon
    { fil: "vettakollen-utsikt-staaende.jpg",  fotograf: "Daniel Jacobsen", staaende: true },
    { fil: "myrsetra-skog-staaende.jpg",       fotograf: "Daniel Jacobsen", staaende: true },
    { fil: "ulsrudvann-staaende.jpg",          fotograf: "Daniel Jacobsen", staaende: true }
  ];
  var EKSEMPELNOKKEL = "dnt-ukens-turer-eksempel";
  var LOGO = "assets/img/dnt-logo.png";
  var TURBO = "assets/img/turbo.png";

  var MANEDER = ["JANUAR", "FEBRUAR", "MARS", "APRIL", "MAI", "JUNI", "JULI", "AUGUST", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];

  /* ---------- Tilstand ---------- */

  function nyTur(dag, dato, tid, tittel, sted) {
    return { dag: dag || "TIR", dato: dato || "", tid: tid || "", tittel: tittel || "", sted: sted || "",
             turleder: "", varighet: "", grad: "", pamelding: false };
  }

  function nyttUtsnitt() {
    return { feed: { x: 50, y: 50, z: 115 }, story: { x: 50, y: 50, z: 115 } };
  }

  // ISO-ukenummer, slik at «UKE 38 · SEPTEMBER» stemmer med dagens dato.
  function gjeldendePeriode() {
    var d = new Date();
    var dato = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var dag = dato.getUTCDay() || 7;
    dato.setUTCDate(dato.getUTCDate() + 4 - dag);
    var aarStart = new Date(Date.UTC(dato.getUTCFullYear(), 0, 1));
    var uke = Math.ceil(((dato - aarStart) / 86400000 + 1) / 7);
    return "UKE " + uke + " · " + MANEDER[d.getMonth()];
  }

  // Eksempeltekst for sesong og booking. Avhenger av type, målform og hytte (e-post).
  // Alle typene fyller alle feltene, så et typebytte tømmer det forrige eksempelet.
  function sesongPreset(type, mf, h) {
    var nn = mf === "nn";
    var epost = h && h.epost ? h.epost : "Bestilling på e-post";
    var bestill = "hyttebestilling.dnt.no";
    var p = {
      apner: {
        sesongMerke: "Vintersesongen",
        sesongTittel: nn ? "Vi opnar 26. februar" : "Vi åpner 26. februar",
        sesongUnder: nn ? "Velkomen til fjells" : "Velkommen til fjells",
        sesongTekst: nn ? "Vi gler oss til å ta imot deg att. Hugs å bestille i god tid." : "Vi gleder oss til å ta imot deg igjen. Husk å bestille i god tid.",
        sesongFakta1: "26. februar til 2. mai", sesongFakta2: bestill
      },
      booking: {
        sesongMerke: nn ? "Påska 2027" : "Påsken 2027",
        sesongTittel: nn ? "Booking opnar 15. oktober" : "Booking åpner 15. oktober",
        sesongUnder: "",
        sesongTekst: nn ? "Send oss ønskt periode, kor mange de er og kontaktinformasjon, så stadfestar vi og sender lenkje til betaling."
                        : "Send oss ønsket periode, antall personer og kontaktinformasjon, så bekrefter vi og sender lenke til betaling.",
        sesongFakta1: "19. til 28. mars", sesongFakta2: epost,
        sesongDag: "Torsdag", sesongDato: "15", sesongMaaned: "oktober"
      },
      ledig: {
        sesongMerke: nn ? "Påska 2027" : "Påsken 2027",
        sesongTittel: nn ? "Ledige senger i påska" : "Ledige senger i påsken",
        sesongUnder: nn ? "Det er framleis plass til deg" : "Det er fortsatt plass til deg",
        sesongTekst: "", sesongFakta1: "25. til 29. mars", sesongFakta2: bestill
      },
      takk: {
        sesongMerke: "Takk for sesongen",
        sesongTittel: nn ? "Vi sjåast att 5. mars" : "Vi ses igjen 5. mars",
        sesongUnder: nn ? "Tusen takk til alle som tok turen til oss i sommar" : "Tusen takk til alle som tok turen til oss i sommer",
        sesongTekst: "", sesongFakta1: "5. mars", sesongFakta2: bestill
      },
      soker: {
        sesongMerke: "Ledig stilling",
        sesongTittel: nn ? "Vil du jobbe hjå oss?" : "Vil du jobbe hos oss?",
        sesongUnder: nn ? "Vi søkjer sesongtilsette til sommaren" : "Vi søker sesongansatte til sommeren",
        sesongTekst: nn ? "Vi treng folk på kjøkenet, i resepsjonen og til reinhald." : "Vi trenger folk på kjøkkenet, i resepsjonen og til renhold.",
        sesongFakta1: "1. mai", sesongFakta2: epost
      }
    }[type] || {};
    var ut = {};
    SESONG_FELT.forEach(function (k) { ut[k] = p[k] || ""; });
    return ut;
  }

  function menyPreset(mf) {
    var nn = mf === "nn";
    return {
      menyMerke: "Dagens middag",
      menyTittel: nn ? "Eigenfiska aure" : "Egenfisket aure",
      menyUnder: nn ? "Frå vatna rett ved hytta" : "Fra vannene rett ved hytta",
      menyLinjer: nn ? "Rømmesaus og agurksalat\nNypoteter med dill\nMultekrem til dessert" : "Rømmesaus og agurksalat\nNypoteter med dill\nMultekrem til dessert",
      menyTid: nn ? "Kl. 19.00 i spisesalen" : "Kl. 19.00 i spisesalen",
      menyPris: ""
    };
  }

  // Det som lagres i nettleseren og nullstilles av «Tøm skjemaet».
  function standardSkjema() {
    return Object.assign({
      avsender: "turlag",
      hytte: "",
      malform: "nb",
      mal: "turkalender",
      nivaa: "merkelapp",
      signatur: "a",
      farge: "rod",
      plassering: "nede",
      visMerke: true,
      arrType: "arrangement",
      arrTittel: "Høsttur til Kikutstua",
      arrUnder: "Fellestur for alle",
      arrDag: "Søndag",
      arrDato: "27",
      arrMaaned: "september",
      arrTid: "10:00 til 15:00",
      arrSted: "Sognsvann, ved bommen",
      arrTekst: "Vi går rundt Sognsvann og innover til Kikut. Ta med mat og drikke, vi tar en lang pause ved hytta.",
      arrPasserFor: "Alle som er vant til å gå 15 km",
      arrPris: "Gratis for medlemmer, 100 kr for andre",
      arrFrist: "Torsdag 24. september",
      arrTaMed: "Arbeidshansker og gode sko",
      arrServering: "Vi serverer suppe og kaffe",
      arrPamelding: "Ingen påmelding, bare møt opp",
      tipsTittel: "Sognsvann rundt",
      tipsUnder: "En enkel tur for hele familien",
      tipsTekst: "En flat runde rundt vannet, med benker, badeplasser og bålplasser underveis. Fin som første tur i Nordmarka.",
      tipsLengde: "3,3 km",
      tipsVarighet: "1 time",
      tipsGrad: "Enkel",
      tipsStart: "Sognsvann T-banestasjon",
      tipsKollektiv: "",
      tipsPasserFor: "",
      tipsUnderveis: "",
      tipsSesong: "",
      sesongType: "booking",
      postOverlinje: "Hilsen fra",
      postNavn: "",
      postMeta: "",
      programTittel: "Påskeprogram",
      programPeriode: "PÅSKEN 2027",
      programRader: [
        nyTur("TOR", "25", "10:00", "Guidet tur til toppen", "Fra hytta"),
        nyTur("TOR", "25", "14:00", "Påskehopprenn for alle", "Bakken ved hytta"),
        nyTur("FRE", "26", "21:00", "Påskequiz i peisestua", "Peisestua"),
        nyTur("LØR", "27", "14:00", "Påskeskirenn for hele familien", "Ved hytta"),
        nyTur("LØR", "27", "19:00", "Påskebuffet", "Spisesalen")
      ],
      oppsett: "topp",
      format: "feed",
      tekst: "normal",
      tittel: "Ukens turer",
      turlag: "Fyll inn turlag",
      lenke: "dnt.no/oslo",
      periode: gjeldendePeriode(),
      visLogo: false,
      visBand: false,
      visTurbo: false,
      kortGlass: false,
      utsnitt: nyttUtsnitt(),
      turer: [
        nyTur("TIR", "15", "10:30", "Trilletur til Lilloseter", "Ammerud utfartsparkering"),
        nyTur("TIR", "15", "11:00", "Tirsdagstur fra SNØ, Gjelleråsen og Mortens kro", "Fra SNØ"),
        nyTur("ONS", "16", "18:00", "Kveldstur med utsikt fra Marikollslottet og Bjønnåsen", "Sandbekken fotballbane"),
        nyTur("SØN", "20", "10:00", "Søndagstur over Lutåsen til Sarabråten", "Fra Marihøltet P")
      ]
    }, sesongPreset("booking", "nb", null), menyPreset("nb"));
  }

  var state = Object.assign(standardSkjema(), {
    bilde: "",
    bildeStaaende: "",
    eksempel: { liggende: null, staaende: null },
    egetBilde: false,
    bildenavn: "Ingen fil valgt, bruker et eksempelbilde fra DNT",
    visPrompt: false,
    postVariant: 0,
    laster: false
  });

  /* ---------- Hjelpere ---------- */

  var $ = function (sel, rot) { return (rot || document).querySelector(sel); };
  var $$ = function (sel, rot) { return Array.prototype.slice.call((rot || document).querySelectorAll(sel)); };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function slug(s) {
    return String(s || "").toLowerCase()
      .replace(/æ/g, "ae").replace(/ø/g, "oe").replace(/å/g, "aa")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "turlag";
  }

  function erKalender(mal) { return mal === "turkalender" || mal === "program"; }

  // Postkort-malen er alltid på postkortnivået. Kalenderne har oppsett i stedet for nivå.
  function aktivtNivaa() {
    if (state.mal === "postkort") return "postkort";
    return erKalender(state.mal) ? "" : state.nivaa;
  }

  function tillattMal(mal, avsender) {
    var a = MALVALG[mal] && MALVALG[mal].avsender;
    return !a || a === avsender;
  }

  function finnHytte(id) {
    return HYTTER.filter(function (h) { return h.id === id; })[0] || null;
  }

  function valgtHytte() {
    return state.avsender === "hytte" ? finnHytte(state.hytte) : null;
  }

  // Navnet som står i stempelet, overlinjen og signaturen.
  function avsenderNavn() {
    if (state.avsender === "hytte") { var h = valgtHytte(); return h ? h.kortnavn : ""; }
    var t = (state.turlag || "").trim();
    return t === "Fyll inn turlag" ? "" : t;
  }

  // Overlinjen i turkalenderen og plakaten. Turlagets navn vises som før, også eksempelteksten.
  function overlinjeNavn() {
    if (state.avsender === "hytte") { var h = valgtHytte(); return h ? h.kortnavn : "Velg hytte"; }
    return state.turlag || "";
  }

  // Høyde og område under hyttenavnet, f.eks. «1405 moh · Jotunheimen».
  function avsenderMeta() {
    var h = valgtHytte();
    if (!h) return "";
    return [h.moh ? h.moh + " moh" : "", h.omrade].filter(Boolean).join(" · ");
  }

  function paaMalform(tekst) {
    return state.malform === "nn" && NYNORSK[tekst] ? NYNORSK[tekst] : tekst;
  }

  function ikon(navn) {
    return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F0F0F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (IKON_STI[navn] || IKON_STI.kalender) + '</svg>';
  }

  // Turkalenderen og programmet bruker samme oppsett, men hver sin liste og tittel.
  function listeNokkel() { return state.mal === "program" ? "programRader" : "turer"; }

  function kalenderData() {
    var program = state.mal === "program";
    return {
      tittel: program ? state.programTittel : state.tittel,
      periode: program ? state.programPeriode : state.periode,
      navn: overlinjeNavn(),
      liste: state[listeNokkel()]
    };
  }

  function synligeTurer() {
    return state[listeNokkel()].filter(function (t) {
      return (t.tittel || "").trim() || (t.sted || "").trim() || (t.dato || "").trim();
    });
  }

  function detaljerFor(t) {
    return [t.turleder ? paaMalform("Turleder") + " " + t.turleder : "", t.varighet].filter(Boolean).join(" · ");
  }

  // Felt som fortsatt har eksempelteksten byttes når type, målform eller hytte endres.
  // Det brukeren har skrevet selv, blir stående.
  function byttEksempeltekst(gammel, ny) {
    var patch = {};
    Object.keys(ny).forEach(function (k) {
      var naa = state[k] == null ? "" : String(state[k]);
      var var_ = gammel[k] == null ? "" : String(gammel[k]);
      if (naa === "" || naa === var_) patch[k] = ny[k];
    });
    return patch;
  }

  /* ---------- Eksempelbilder ---------- */

  function hytteBilder() {
    var h = valgtHytte();
    return h && h.bilder && h.bilder.length ? h.bilder : null;
  }

  // Trekker ett liggende og ett stående eksempelbilde. Forrige trekk huskes i
  // nettleseren og unngås, så det aldri blir samme bilde to ganger på rad.
  // En valgt hytte bruker sine egne bilder, samme bilde i alle flater.
  function trekkEksempelbilder() {
    var forrige = {};
    try { forrige = JSON.parse(localStorage.getItem(EKSEMPELNOKKEL) || "{}") || {}; } catch (e) { /* ignorer */ }
    var valg;
    var hb = hytteBilder();
    if (hb) {
      var andre = hb.filter(function (b) { return b.fil !== forrige.hytte; });
      var liste = andre.length ? andre : hb;
      var b = liste[Math.floor(Math.random() * liste.length)];
      var bilde = { fil: b.fil, fotograf: b.fotograf || null, mappe: HYTTEMAPPE };
      valg = { liggende: bilde, staaende: bilde };
      forrige.hytte = b.fil;
    } else {
      var trekk = function (staaende) {
        var kandidater = EKSEMPELBILDER.filter(function (b) { return b.staaende === staaende; });
        var uten = kandidater.filter(function (b) { return b.fil !== forrige[staaende ? "staaende" : "liggende"]; });
        var l = uten.length ? uten : kandidater;
        return l[Math.floor(Math.random() * l.length)] || null;
      };
      valg = { liggende: trekk(false), staaende: trekk(true) };
      forrige.liggende = valg.liggende && valg.liggende.fil;
      forrige.staaende = valg.staaende && valg.staaende.fil;
    }
    try { localStorage.setItem(EKSEMPELNOKKEL, JSON.stringify(forrige)); } catch (e) { /* ignorer */ }
    return valg;
  }

  function bildeAdresse(b) { return b ? (b.mappe || EKSEMPELMAPPE) + b.fil : ""; }

  function brukEksempelbilder() {
    var valg = trekkEksempelbilder();
    return {
      eksempel: valg,
      bilde: bildeAdresse(valg.liggende),
      bildeStaaende: bildeAdresse(valg.staaende),
      egetBilde: false,
      bildenavn: hytteBilder() ? "Ingen fil valgt, bruker et bilde fra hytta" : "Ingen fil valgt, bruker et eksempelbilde fra DNT",
      utsnitt: nyttUtsnitt()
    };
  }

  /* ---------- Lokal lagring ---------- */

  var LAGRES = ["avsender", "hytte", "malform", "mal", "nivaa", "signatur", "farge", "plassering", "visMerke",
                "arrType", "sesongType", "oppsett", "format", "tekst", "tittel", "turlag", "lenke", "periode",
                "visLogo", "visBand", "visTurbo", "kortGlass", "utsnitt", "turer", "programRader"];

  var lagreTimer = null;
  function lagre() {
    clearTimeout(lagreTimer);
    lagreTimer = setTimeout(function () {
      try {
        var data = {};
        LAGRES.concat(ARR_FELT, TIPS_FELT, SESONG_FELT, MENY_FELT, POST_FELT, PROGRAM_FELT)
          .forEach(function (k) { data[k] = state[k]; });
        localStorage.setItem(LAGRINGSNOKKEL, JSON.stringify(data));
      } catch (e) { /* privat modus eller full lagring: vi lever fint uten */ }
    }, 300);
  }

  function hent() {
    try {
      var raa = localStorage.getItem(LAGRINGSNOKKEL);
      if (!raa) return;
      var d = JSON.parse(raa);
      if (!d || typeof d !== "object") return;
      if (d.avsender === "turlag" || d.avsender === "hytte") state.avsender = d.avsender;
      if (typeof d.hytte === "string" && finnHytte(d.hytte)) state.hytte = d.hytte;
      if (d.malform === "nb" || d.malform === "nn") state.malform = d.malform;
      if (MALVALG[d.mal]) state.mal = d.mal;
      if (!tillattMal(state.mal, state.avsender)) state.mal = state.avsender === "hytte" ? "sesong" : "turkalender";
      if (NIVAA[d.nivaa]) state.nivaa = d.nivaa;
      // Før 14. oktober 2026 hadde arrangement og turtips «Stort foto» og «Foto og tekstfelt».
      else if (d.arrOppsett === "kort" || d.tipsOppsett === "kort") state.nivaa = "plakat";
      if (SIGNATURER[d.signatur]) state.signatur = d.signatur;
      if (FARGER[d.farge]) state.farge = d.farge;
      if (PLASSERINGER[d.plassering]) state.plassering = d.plassering;
      if (ARR_TYPER[d.arrType]) state.arrType = d.arrType;
      if (SESONG_TYPER[d.sesongType]) state.sesongType = d.sesongType;
      ARR_FELT.concat(TIPS_FELT, SESONG_FELT, MENY_FELT, POST_FELT, PROGRAM_FELT)
        .forEach(function (k) { if (typeof d[k] === "string") state[k] = d[k]; });
      if (OPPSETT[d.oppsett]) state.oppsett = d.oppsett;
      else if (d.oppsett === "stort" || d.oppsett === "side") state.oppsett = "bakgrunn";
      // Lagret «liggende» og «flate» finnes ikke lenger og faller tilbake til Innlegg og Merkelapp.
      if (FORMATER[d.format]) state.format = d.format;
      if (TEKST[d.tekst]) state.tekst = d.tekst;
      ["tittel", "turlag", "lenke", "periode"].forEach(function (k) {
        if (typeof d[k] === "string") state[k] = d[k];
      });
      if (state.lenke === "Fyll inn lenke til turkalender" || state.lenke === "Fyll inn nettadresse, f.eks. dnt.no/oslo") state.lenke = standardSkjema().lenke;
      ["visLogo", "visBand", "visTurbo", "kortGlass", "visMerke"].forEach(function (k) {
        if (typeof d[k] === "boolean") state[k] = d[k];
      });
      if (d.utsnitt && typeof d.utsnitt === "object") {
        var u = nyttUtsnitt();
        Object.keys(u).forEach(function (f) {
          if (d.utsnitt[f]) u[f] = Object.assign(u[f], d.utsnitt[f]);
        });
        state.utsnitt = u;
      }
      ["turer", "programRader"].forEach(function (k) {
        if (Array.isArray(d[k])) {
          state[k] = d[k].slice(0, MAKS_TURER).map(function (t) { return Object.assign(nyTur(), t || {}); });
        }
      });
    } catch (e) { /* ugyldig lagret data ignoreres */ }
  }

  function tomLagring() {
    try { localStorage.removeItem(LAGRINGSNOKKEL); } catch (e) { /* ignorer */ }
  }

  // Lenken ?hytte=leirvassbu velger hytta på forhånd. Hytta og målformen huskes etterpå.
  function lesLenke() {
    var id = "";
    try { id = (new URLSearchParams(window.location.search).get("hytte") || "").toLowerCase(); } catch (e) { return; }
    var h = finnHytte(id);
    if (!h) return;
    var forrige = valgtHytte();
    var ny = state.hytte !== h.id || state.avsender !== "hytte";
    var patch = { avsender: "hytte", hytte: h.id };
    if (ny && h.malform) patch.malform = h.malform;
    Object.assign(state, patch);
    Object.assign(state, byttEksempeltekst(sesongPreset(state.sesongType, "nb", forrige), sesongPreset(state.sesongType, state.malform, h)));
    Object.assign(state, byttEksempeltekst(menyPreset("nb"), menyPreset(state.malform)));
    Object.assign(state, byttEksempeltekst({ postOverlinje: "Hilsen fra" }, { postOverlinje: paaMalform("Hilsen fra") }));
    // Den vanligste posten fra hyttene er sesong og booking, så lenken starter der.
    if (!tillattMal(state.mal, "hytte")) state.mal = "sesong";
  }

  /* ---------- Beregninger ---------- */

  // Måler naturlig størrelse på et bilde én gang, og husker den.
  var bildeMal = {};
  function malBilde(src) {
    if (bildeMal[src] !== undefined) return bildeMal[src];
    bildeMal[src] = null;
    var img = new Image();
    img.onload = function () {
      bildeMal[src] = { w: img.naturalWidth, h: img.naturalHeight };
      renderPlakat();
    };
    img.onerror = function () { bildeMal[src] = { w: 1, h: 1 }; };
    img.src = src;
    return null;
  }

  // Regner ut bakgrunnsstørrelse og -posisjon slik at bildet dekker flaten
  // uten å strekkes, med zoom og panorering lagt på. html2canvas støtter ikke
  // object-fit, derfor gjøres dette med background-size i px.
  function bakgrunn(src, boksB, boksH, u) {
    var d = malBilde(src);
    if (!d || !d.w || !d.h) return { bgStr: "cover", bgPos: "50% 50%" };
    var dekning = Math.max(boksB / d.w, boksH / d.h) * (u.z / 100);
    var bw = d.w * dekning, bh = d.h * dekning;
    var px = (boksB - bw) * (u.x / 100), py = (boksH - bh) * (u.y / 100);
    return { bgStr: Math.round(bw) + "px " + Math.round(bh) + "px", bgPos: Math.round(px) + "px " + Math.round(py) + "px" };
  }

  // Standardbildet velges etter fotoflatens proporsjoner. Eget bilde brukes alltid.
  function kildeBilde(boksB, boksH) {
    if (state.egetBilde) return state.bilde;
    return erStaaendeFlate(boksB, boksH) ? state.bildeStaaende : state.bilde;
  }

  function erStaaendeFlate(boksB, boksH) { return (boksB / boksH) < 1.15; }

  // Fotografen bak eksempelbildet som vises nå, eller null ved eget bilde.
  function aktivtEksempel(boksB, boksH) {
    if (state.egetBilde) return null;
    return erStaaendeFlate(boksB, boksH) ? state.eksempel.staaende : state.eksempel.liggende;
  }

  // Finner største skriftstørrelse mellom minPx og maksPx som får teksten på
  // én linje innenfor maksBredde. Måler med canvas, så fontene må være lastet.
  // Før det returneres maksPx, og plakaten rendres på nytt når fontene er klare.
  var maaleCtx = null, maaleCache = {};
  var fonterKlare = false;
  function tilpassStorrelse(tekst, fontMal, sporing, maksBredde, maksPx, minPx) {
    tekst = String(tekst || "");
    if (!tekst || !fonterKlare) return { px: maksPx, bryt: false };
    var nokkel = [tekst, fontMal, sporing, maksBredde, maksPx, minPx].join("|");
    if (maaleCache[nokkel]) return maaleCache[nokkel];
    if (!maaleCtx) maaleCtx = document.createElement("canvas").getContext("2d");
    var px = maksPx, bredde;
    for (; px >= minPx; px -= 2) {
      maaleCtx.font = fontMal.replace("{px}", px);
      bredde = maaleCtx.measureText(tekst).width + tekst.length * sporing * px;
      if (bredde <= maksBredde) break;
    }
    var res = px < minPx ? { px: minPx, bryt: true } : { px: px, bryt: false };
    maaleCache[nokkel] = res;
    return res;
  }

  // Titler på foto kan gå over to linjer. Først prøves én linje ned til 96 px,
  // så to linjer fra maksPx og ned. To linjer er et anslag (1,8 ganger bredden),
  // og sjekkPlass() sier fra hvis teksten likevel ikke får plass.
  function tilpassToLinjer(tekst, maksBredde, maksPx, minPx) {
    var en = tilpassStorrelse(tekst, TITTELFONT, TITTELSPORING, maksBredde, maksPx, Math.min(96, maksPx));
    if (!en.bryt) return en;
    var to = tilpassStorrelse(tekst, TITTELFONT, TITTELSPORING, maksBredde * 1.8, maksPx, minPx);
    return { px: to.px, bryt: true };
  }

  function beregn() {
    return erKalender(state.mal) ? beregnTurkalender() : beregnEnkelt();
  }

  // Innholdet i enkeltplakaten, samlet så malene ikke trenger å vite hvilken mal det er.
  // info er etikett og verdi til Plakat, fakta er opptil to linjer med ikon til Merkelapp.
  function innholdArrangement() {
    var s = state;
    var info = ARR_INFO.filter(function (par) {
      var verdi = (s[par[0]] || "").trim();
      if (!verdi) return false;
      // Feltene som ikke hører til typen skjules, selv om de har innhold fra før.
      var felt = par[0];
      if (felt === "arrPris" || felt === "arrFrist") return s.arrType === "kurs";
      if (felt === "arrTaMed" || felt === "arrServering") return s.arrType === "dugnad";
      if (felt === "arrPasserFor") return s.arrType !== "dugnad";
      return true;
    }).map(function (par) { return { etikett: paaMalform(par[1]), verdi: s[par[0]].trim() }; });
    var fakta = [];
    if ((s.arrTid || "").trim()) fakta.push({ ikon: "klokke", verdi: s.arrTid.trim() });
    if ((s.arrSted || "").trim()) fakta.push({ ikon: "sted", verdi: s.arrSted.trim() });
    return {
      tittel: s.arrTittel, under: s.arrUnder, tekst: s.arrTekst, info: info, fakta: fakta, meny: [],
      dato: { dag: s.arrDag, dato: s.arrDato, maaned: s.arrMaaned }, merke: ""
    };
  }

  function innholdTurtips() {
    var s = state;
    var info = TIPS_INFO.filter(function (par) { return (s[par[0]] || "").trim(); })
      .map(function (par) {
        var verdi = s[par[0]].trim();
        var grad = par[0] === "tipsGrad";
        return { etikett: paaMalform(par[1]), verdi: grad ? paaMalform(verdi) : verdi, farge: grad ? (GRAD[verdi] || "") : "" };
      });
    var fakta = [];
    var lengde = [(s.tipsLengde || "").trim(), (s.tipsVarighet || "").trim()].filter(Boolean).join(" · ");
    if (lengde) fakta.push({ ikon: "rute", verdi: lengde });
    if ((s.tipsGrad || "").trim()) fakta.push({ prikk: GRAD[s.tipsGrad] || "", verdi: paaMalform(s.tipsGrad) });
    return { tittel: s.tipsTittel, under: s.tipsUnder, tekst: s.tipsTekst, info: info, fakta: fakta, meny: [], dato: null, merke: "Turtips" };
  }

  function innholdSesong() {
    var s = state;
    var nn = s.malform === "nn";
    var def = SESONG_TYPER[s.sesongType].fakta;
    var info = [], fakta = [];
    [s.sesongFakta1, s.sesongFakta2].forEach(function (v, i) {
      v = (v || "").trim();
      if (!v) return;
      info.push({ etikett: nn ? def[i][1] : def[i][0], verdi: v });
      fakta.push({ ikon: def[i][2], verdi: v });
    });
    var dato = (s.sesongDag && (s.sesongDato || "").trim()) ? { dag: s.sesongDag, dato: s.sesongDato.trim(), maaned: s.sesongMaaned } : null;
    return { tittel: s.sesongTittel, under: s.sesongUnder, tekst: s.sesongTekst, info: info, fakta: fakta, meny: [], dato: dato, merke: (s.sesongMerke || "").trim() };
  }

  function innholdMeny() {
    var s = state;
    var info = [], fakta = [];
    if ((s.menyTid || "").trim()) { info.push({ etikett: "Servering", verdi: s.menyTid.trim() }); fakta.push({ ikon: "klokke", verdi: s.menyTid.trim() }); }
    if ((s.menyPris || "").trim()) { info.push({ etikett: "Pris", verdi: s.menyPris.trim() }); fakta.push({ ikon: "bestikk", verdi: s.menyPris.trim() }); }
    var meny = String(s.menyLinjer || "").split("\n").map(function (l) { return l.trim(); }).filter(Boolean).slice(0, 6);
    return { tittel: s.menyTittel, under: s.menyUnder, tekst: "", info: info, fakta: fakta, meny: meny, dato: null, merke: (s.menyMerke || "").trim() };
  }

  function innholdFor(mal) {
    if (mal === "arrangement") return innholdArrangement();
    if (mal === "turtips") return innholdTurtips();
    if (mal === "sesong") return innholdSesong();
    if (mal === "meny") return innholdMeny();
    return { tittel: "", under: "", tekst: "", info: [], fakta: [], meny: [], dato: null, merke: "" };
  }

  // Teksten i postkortsignaturen. Postkort-malen bruker hyttas navn, høyde og område
  // når feltene er tomme. De andre malene bruker merkelapp, tittel og undertittel.
  function signaturFor(inn) {
    if (state.mal === "postkort") {
      return {
        over: (state.postOverlinje || "").trim(),
        navn: (state.postNavn || "").trim() || avsenderNavn() || (state.avsender === "hytte" ? "Velg hytte" : "Stedsnavn"),
        meta: (state.postMeta || "").trim() || avsenderMeta()
      };
    }
    var over = inn.merke ? (inn.merke === "Turtips" ? "Turtips" : inn.merke)
      : (inn.dato ? [paaMalform(inn.dato.dag), inn.dato.dato ? inn.dato.dato + "." : "", inn.dato.maaned].filter(Boolean).join(" ") : "");
    var meta = (inn.under || "").trim() || (inn.fakta[0] ? inn.fakta[0].verdi : "");
    return { over: over, navn: inn.tittel, meta: meta };
  }

  // Enkeltplakaten: arrangement, turtips, sesong, meny eller postkort, på tre
  // tekstnivåer (postkort, merkelapp og plakat) i innlegg og historie.
  function beregnEnkelt() {
    var s = state;
    var nivaa = aktivtNivaa();
    var fmt = FORMATER[s.format];
    var story = s.format === "story";
    var stor = s.tekst === "stor";
    var k = stor ? 1.12 : 1;
    var pad = 64;
    // Båndet nederst er valgfritt. Høyden brukes bare her og som --band-h i CSS.
    var band = s.visBand ? 88 : 0;
    var innhold = innholdFor(s.mal);
    var sig = nivaa === "postkort" ? signaturFor(innhold) : null;
    var farge = FARGER[s.farge] || FARGER.rod;

    // Fotoflaten. Plakat har foto øverst, postkort C har foto med lys kant, resten fyller flaten.
    var fotoH = story ? 1080 : 620;
    var cTopp = story ? 180 : 44, cBunn = 266, cLuft = story ? 200 : 0;
    var cFotoH = fmt.hoyde - cTopp - cBunn - cLuft;
    var fotoFlate = nivaa === "plakat" ? [fmt.bredde, fotoH]
      : (nivaa === "postkort" && s.signatur === "c") ? [fmt.bredde - 88, cFotoH]
      : [fmt.bredde, fmt.hoyde];
    var u = s.utsnitt[s.format];
    var bilde = kildeBilde(fotoFlate[0], fotoFlate[1]);
    var bg = bakgrunn(bilde, fotoFlate[0], fotoFlate[1], u);

    // Datofeltet er 184 px, så hele månedsnavnet får plass i 24 px (se docs/design.md).
    var tekstBredde = fmt.bredde - 2 * pad;
    var chip = Math.round(184 * (stor ? 1.08 : 1));
    var tittel, sigNavnPx = 0;
    if (nivaa === "plakat") {
      // Datofeltet står ved siden av tittelen, så bredden er mindre. Uten datofelt får tittelen hele bredden.
      var tittelBredde = innhold.dato ? tekstBredde - chip - 36 : tekstBredde;
      tittel = tilpassStorrelse(innhold.tittel, TITTELFONT, TITTELSPORING, tittelBredde, 104, 60);
    } else if (nivaa === "merkelapp") {
      tittel = tilpassToLinjer(innhold.tittel, tekstBredde - (s.visTurbo ? 300 : 0), 112, 64);
    } else {
      if (s.signatur === "b") tittel = tilpassStorrelse(sig.navn, TITTELFONT, TITTELSPORING, 740, 46, 32);
      else if (s.signatur === "c") tittel = tilpassStorrelse(sig.navn, TITTELFONT, TITTELSPORING, sig.meta ? 640 : 900, 112, 60);
      else tittel = tilpassToLinjer(sig.navn, tekstBredde - (s.visTurbo ? 300 : 0), 132, 72);
      sigNavnPx = tittel.px;
    }

    return {
      mal: s.mal, nivaa: nivaa, oppsett: nivaa, fmt: fmt, opp: NIVAA[nivaa], u: u, stor: stor, forMange: false, synlige: [], maks: 0,
      bilde: bilde,
      eksempel: aktivtEksempel(fotoFlate[0], fotoFlate[1]),
      tittelBryt: tittel.bryt,
      innhold: innhold,
      info: innhold.info,
      sig: sig,
      vars: {
        "--bredde": fmt.bredde + "px", "--hoyde": fmt.hoyde + "px",
        "--a-pad": pad + "px", "--a-chip": chip + "px",
        "--a-dag-size": Math.round(24 * k) + "px",
        "--a-dato-size": Math.round(70 * k) + "px",
        "--a-maaned-size": Math.round(24 * k) + "px",
        "--a-merke-size": Math.round(26 * k) + "px",
        "--a-tittel-size": tittel.px + "px",
        "--a-under-size": Math.round(34 * k) + "px",
        "--a-etikett-size": Math.round(22 * k) + "px",
        "--a-verdi-size": Math.round(30 * k) + "px",
        "--a-tekst-size": Math.round(30 * k) + "px",
        "--a-foto-h": fotoH + "px",
        "--merke-bg": farge.bg, "--merke-fg": farge.fg,
        "--m-tittel-size": tittel.px + "px",
        "--m-under-size": Math.round(36 * k) + "px",
        "--m-fakta-size": Math.round(34 * k) + "px",
        // Instagram legger knapper over toppen og bunnen av en historie, derfor mer luft der.
        "--m-topp": (story ? 210 : 56) + "px",
        "--m-bunn": ((story ? 340 : 76) + band) + "px",
        "--m-innhold-topp": (story ? 230 : 72) + "px",
        "--m-stempel-bunn": ((story ? 300 : 56) + band) + "px",
        "--s-navn-size": sigNavnPx + "px",
        "--s-bunn": ((story ? 340 : 72) + band) + "px",
        "--s-bunn-b": ((story ? 300 : 56) + band) + "px",
        "--s-c-topp": cTopp + "px", "--s-c-foto-h": cFotoH + "px",
        "--turbo-h": "200px", "--band-h": band + "px",
        "--bg-str": bg.bgStr, "--bg-pos": bg.bgPos
      }
    };
  }

  function beregnTurkalender() {
    var s = state;
    var fmt = FORMATER[s.format];
    var opp = OPPSETT[s.oppsett];
    var kal = kalenderData();
    var synlige = synligeTurer();
    var n = Math.max(synlige.length, 1);
    var stor = s.tekst === "stor";
    var T = stor ? TEKST.stor : TEKST.normal;
    var maks = Math.max(opp.maks[s.format] - (stor ? 1 : 0), 3);
    var harDetaljer = kal.liste.some(function (t) { return t.turleder || t.varighet || t.grad || t.pamelding; });
    var romslig = s.format === "story";
    var kompakt = s.oppsett !== "topp";
    var trinn = n <= 4 ? 0 : (n === 5 ? 1 : (n === 6 ? 2 : 3));
    if (harDetaljer) trinn = Math.min(trinn + 1, 3);
    if (kompakt && n > 4) trinn = Math.min(trinn + 1, 3);
    if (romslig) trinn = Math.max(trinn - 1, 0);

    var heroH = s.format === "story" ? 780 : 330;
    var band = state.visBand ? 88 : 0;

    var fotoFlate = s.oppsett === "topp" ? [fmt.bredde, heroH] : [fmt.bredde, fmt.hoyde];
    var u = s.utsnitt[s.format];
    var bilde = kildeBilde(fotoFlate[0], fotoFlate[1]);
    var bg = bakgrunn(bilde, fotoFlate[0], fotoFlate[1], u);

    // Tittel og overlinje skal helst stå på én linje. 170 px er reservert til
    // logoen uansett om den vises, så layouten ikke hopper.
    var SOCIAL_EXT = '500 {px}px "ABC Social Extended"';
    var tittelHero = tilpassStorrelse(kal.tittel, TITTELFONT, TITTELSPORING, fmt.bredde - 56 - 170, 92, 56);
    var overlinje = tilpassStorrelse((kal.navn || "").toUpperCase() + " · " + kal.periode, SOCIAL_EXT, 0.18, fmt.bredde - 56 - 170, 24, 18);

    return {
      mal: s.mal, kal: kal,
      fmt: fmt, opp: opp, synlige: synlige, maks: maks, stor: stor, trinn: trinn, u: u,
      forMange: synlige.length > maks,
      bilde: bilde,
      eksempel: aktivtEksempel(fotoFlate[0], fotoFlate[1]),
      tittelBryt: tittelHero.bryt,
      vars: {
        "--bredde": fmt.bredde + "px", "--hoyde": fmt.hoyde + "px",
        "--hero-h": heroH + "px",
        "--chip": T.chip[trinn] + "px", "--chip-smal": T.chipSmal[trinn] + "px",
        "--dag-size": T.dag[trinn] + "px", "--dato-size": T.dato[trinn] + "px", "--dato-size-smal": T.datoSmal[trinn] + "px",
        "--title-size": T.title[trinn] + "px", "--title-size-smal": T.titleSmal[trinn] + "px",
        "--meta-size": T.meta[trinn] + "px", "--detalj-size": T.detalj + "px", "--tid-size": T.tid[trinn] + "px",
        "--kort-gap": [20, 16, 13, 11][trinn] + "px", "--kort-pad": "32px",
        "--bg-str": bg.bgStr, "--bg-pos": bg.bgPos,
        "--tittel-size": tittelHero.px + "px",
        "--overlinje-size": overlinje.px + "px",
        "--turbo-h": "200px", "--band-h": band + "px"
      }
    };
  }

  /* ---------- Plakatmaler: turkalender og program ---------- */

  function malRad(t, visTid, stedOgTid) {
    var detaljer = detaljerFor(t);
    var harDetaljer = Boolean(detaljer || t.grad || t.pamelding);
    var sted = stedOgTid ? [t.sted, t.tid ? "kl. " + t.tid : ""].filter(Boolean).join(" · ") : t.sted;
    var html = '<div class="p-rad">' +
      '<div class="p-chip"><div class="p-chip__dag">' + esc(paaMalform(t.dag)) + '</div><div class="p-chip__dato">' + esc(t.dato) + '</div></div>' +
      '<div class="p-info">' +
        '<div class="p-info__tittel">' + esc(t.tittel) + '</div>' +
        '<div class="p-info__sted">' + esc(sted) + '</div>';
    if (harDetaljer) {
      html += '<div class="p-detaljer">';
      if (detaljer) html += '<span class="p-detaljer__tekst">' + esc(detaljer) + '</span>';
      if (t.grad) html += '<span class="p-grad" style="color:' + (GRAD[t.grad] || "#0F0F0F") + '"><span class="p-grad__prikk"></span><span>' + esc(paaMalform(t.grad)) + '</span></span>';
      if (t.pamelding) html += '<span class="p-pamelding">Påmelding</span>';
      html += '</div>';
    }
    html += '</div>';
    if (visTid) html += '<div class="p-tid">' + esc(t.tid) + '</div>';
    return html + '</div>';
  }

  // Den runde T-en kan skrus av, uavhengig av båndet nederst. Logoen er alltid
  // dnt-logo.png, kvadratisk og uendret, i en hvit sirkel. Brukes bare i turkalender
  // og program. De andre malene har logoen i stempelet i stedet (14. oktober 2026).
  function malLogo(klasse) {
    if (!state.visLogo) return "";
    return '<div class="p-logo ' + (klasse || "") + '"><img src="' + LOGO + '" alt="DNT"></div>';
  }

  // Turbo, Barnas Turlags maskot. Valgfri, står alltid i tillegg til DNT-logoen.
  function malTurbo(klasse) {
    if (!state.visTurbo) return "";
    return '<img class="p-turbo ' + (klasse || "") + '" src="' + TURBO + '" alt="Turbo">';
  }

  // Det røde båndet med nettadresse nederst. Valgfritt, av som standard.
  // Logoen står i hvit sirkel også her, siden den røde T-en ellers forsvinner mot rødt.
  function malBunn(klasse) {
    if (!state.visBand) return "";
    return '<div class="p-bunn ' + (klasse || "") + '"><span class="p-bunn__logo"><img src="' + LOGO + '" alt="DNT"></span>' +
      '<span class="p-bunn__lenke">' + esc(state.lenke) + '</span></div>';
  }

  var MALER = {
    topp: function (b) {
      return '<div class="p-flate">' +
        '<div class="p-hero">' +
          '<div class="p-foto" data-foto></div><div class="p-scrim p-scrim--topp"></div>' +
          '<div class="p-hero__tekst"><span class="p-overlinje p-overlinje--topp">' + esc(b.kal.navn.toUpperCase()) + '</span><span class="p-tittel' + (b.tittelBryt ? " p-tittel--bryt" : "") + '">' + esc(b.kal.tittel) + '</span></div>' +
          malLogo() + malTurbo("p-turbo--hero") +
          '<div class="p-periode">' + esc(b.kal.periode) + '</div>' +
        '</div>' +
        '<div class="p-rader">' + b.synlige.map(function (t) { return malRad(t, true, false); }).join("") + '</div>' +
        malBunn() +
      '</div>';
    },
    bakgrunn: function (b) {
      return '<div class="p-flate p-flate--bakgrunn">' +
        '<div class="p-foto p-foto--fyll" data-foto></div><div class="p-scrim p-scrim--bakgrunn"></div>' +
        '<div class="p-hero__tekst p-hero__tekst--lav"><span class="p-overlinje">' + esc(b.kal.navn.toUpperCase()) + ' · ' + esc(b.kal.periode) + '</span><span class="p-tittel' + (b.tittelBryt ? " p-tittel--bryt" : "") + '">' + esc(b.kal.tittel) + '</span></div>' +
        malLogo("p-logo--lav") + malTurbo("p-turbo--underlogo") +
        '<div class="p-kort' + (state.kortGlass ? " p-kort--glass" : "") + '">' +
          '<div class="p-kort__liste p-kort__liste--bakgrunn">' + b.synlige.map(function (t) { return malRad(t, true, false); }).join("") + '</div>' +
          malBunn("p-bunn--tett") +
        '</div>' +
      '</div>';
    }
  };

  /* ---------- Plakatmaler: enkeltplakatene ---------- */

  function malChip(d) {
    return '<div class="a-chip">' +
      '<div class="a-chip__dag">' + esc(paaMalform(d.dag)) + '</div>' +
      '<div class="a-chip__dato"><span class="a-chip__tall">' + esc(d.dato) + '</span><span class="a-chip__maaned">' + esc(d.maaned) + '</span></div>' +
    '</div>';
  }

  function malMerke(tekst) {
    return tekst ? '<div class="a-merke">' + esc(tekst) + '</div>' : "";
  }

  function malArrTittel(b) {
    var inn = b.innhold;
    return '<div class="a-tittel' + (b.tittelBryt ? " a-tittel--bryt" : "") + '">' + esc(inn.tittel) + '</div>' +
      (inn.under ? '<div class="a-under">' + esc(inn.under) + '</div>' : "");
  }

  function malArrInfo(b) {
    if (!b.info.length) return "";
    return '<div class="a-info">' + b.info.map(function (r) {
      var prikk = r.farge ? '<span class="a-grad" style="background:' + r.farge + '"></span>' : "";
      return '<div class="a-info__rad"><span class="a-info__etikett">' + esc(r.etikett) + '</span><span class="a-info__verdi">' + prikk + esc(r.verdi) + '</span></div>';
    }).join("") + '</div>';
  }

  function malArrTekst(b) {
    return b.innhold.tekst ? '<div class="a-tekst">' + esc(b.innhold.tekst) + '</div>' : "";
  }

  function malMeny(b) {
    if (!b.innhold.meny.length) return "";
    return '<div class="a-meny">' + b.innhold.meny.map(function (l) {
      return '<div class="a-meny__rad"><span class="a-meny__prikk"></span><span>' + esc(l) + '</span></div>';
    }).join("") + '</div>';
  }

  // Toppen av Plakat. Med dato står datofeltet ved siden av merkelapp og tittel,
  // uten dato står merkelappen over tittelen.
  function malArrTopp(b) {
    var inn = b.innhold;
    if (inn.dato) {
      return '<div class="a-topp">' + malChip(inn.dato) +
        '<div class="a-topp__tekst">' + malMerke(inn.merke) + malArrTittel(b) + '</div></div>';
    }
    return '<div class="a-topp a-topp--merke">' + malMerke(inn.merke) + '<div class="a-topp__tekst">' + malArrTittel(b) + '</div></div>';
  }

  // Stempelet med logo, avsenderens navn og høyde. Står øverst til venstre i Merkelapp,
  // eller nederst når teksten står øverst. Den eneste logoen i de organiske innleggene.
  function malStempel(klasse) {
    var navn = avsenderNavn();
    if (!state.visMerke || !navn) return "";
    var meta = avsenderMeta();
    return '<div class="m-stempel ' + (klasse || "") + '"><img src="' + LOGO + '" alt="DNT">' +
      '<div class="m-stempel__tekst"><span class="m-stempel__navn">' + esc(navn) + '</span>' +
      (meta ? '<span class="m-stempel__meta">' + esc(meta) + '</span>' : "") + '</div></div>';
  }

  function malIkonFakta(b) {
    var fakta = b.innhold.fakta.slice(0, 2);
    if (!fakta.length) return "";
    return '<div class="m-fakta">' + fakta.map(function (f) {
      var merke = f.ikon ? '<span class="m-ikon">' + ikon(f.ikon) + '</span>'
        : '<span class="m-prikk" style="background:' + (f.prikk || "#0F0F0F") + '"></span>';
      return '<div class="m-fakta__rad">' + merke + '<span>' + esc(f.verdi) + '</span></div>';
    }).join("") + '</div>';
  }

  function malBandNede() {
    return state.visBand ? '<div class="m-band">' + malBunn() + '</div>' : "";
  }

  var MALER_ARR = {
    merkelapp: function (b) {
      var pl = PLASSERINGER[state.plassering] ? state.plassering : "nede";
      var inn = b.innhold;
      var topp = inn.merke ? malMerke(inn.merke) : (inn.dato ? malChip(inn.dato) : "");
      return '<div class="m-flate">' +
        '<div class="p-foto p-foto--fyll" data-foto></div>' +
        '<div class="m-scrim m-scrim--' + (pl === "oppe" ? "oppe" : "nede") + '"></div>' +
        malStempel(pl === "oppe" ? "m-stempel--nede" : "") +
        malTurbo("p-turbo--band") +
        '<div class="m-innhold m-innhold--' + pl + (state.visTurbo ? " m-innhold--turbo" : "") + '">' +
          topp +
          '<div class="m-tittel' + (b.tittelBryt ? " m-tittel--bryt" : "") + '">' + esc(inn.tittel) + '</div>' +
          (inn.under ? '<div class="m-under">' + esc(inn.under) + '</div>' : "") +
          malIkonFakta(b) +
        '</div>' +
        malBandNede() +
      '</div>';
    },
    plakat: function (b) {
      return '<div class="a-flate">' +
        '<div class="a-foto a-foto--topp">' +
          '<div class="p-foto" data-foto></div><div class="a-scrim a-scrim--topp"></div>' +
          '<div class="a-overlinje">' + esc(overlinjeNavn().toUpperCase()) + '</div>' + malTurbo("p-turbo--fotoflate") +
        '</div>' +
        '<div class="a-innhold a-innhold--fyll a-innhold--midt">' + malArrTopp(b) + malMeny(b) + malArrInfo(b) + malArrTekst(b) + '</div>' +
        malBunn() +
      '</div>';
    },
    postkort: function (b) {
      var s = b.sig;
      var v = SIGNATURER[state.signatur] ? state.signatur : "a";
      if (v === "c") {
        var meta = s.meta ? '<div class="s-c__meta">' + s.meta.split(" · ").map(function (x) { return '<span>' + esc(x) + '</span>'; }).join("") + '</div>' : "";
        return '<div class="s-flate s-flate--c">' +
          '<div class="s-c__foto"><div class="p-foto" data-foto></div></div>' +
          '<div class="s-c__bunn"><div class="s-c__venstre">' +
            (s.over ? '<span class="s-over s-over--rod s-over--liten">' + esc(s.over) + '</span>' : "") +
            '<span class="s-navn s-navn--c">' + esc(s.navn) + '</span></div>' + meta +
          '</div>' +
        '</div>';
      }
      if (v === "b") {
        return '<div class="s-flate">' +
          '<div class="p-foto p-foto--fyll" data-foto></div>' +
          '<div class="s-b"><img src="' + LOGO + '" alt="DNT"><div class="s-b__tekst">' +
            (s.over ? '<span class="s-over s-over--rod s-over--liten">' + esc(s.over) + '</span>' : "") +
            '<span class="s-navn s-navn--b">' + esc(s.navn) + '</span>' +
            (s.meta ? '<span class="s-meta s-meta--b">' + esc(s.meta) + '</span>' : "") +
          '</div></div>' +
          malTurbo("p-turbo--band") + malBandNede() +
        '</div>';
      }
      return '<div class="s-flate">' +
        '<div class="p-foto p-foto--fyll" data-foto></div><div class="s-scrim"></div>' +
        '<div class="s-a' + (state.visTurbo ? " m-innhold--turbo" : "") + '">' +
          (s.over ? '<span class="s-over">' + esc(s.over) + '</span>' : "") +
          '<span class="s-navn s-navn--a' + (b.tittelBryt ? " s-navn--bryt" : "") + '">' + esc(s.navn) + '</span>' +
          (s.meta ? '<span class="s-meta">' + esc(s.meta) + '</span>' : "") +
        '</div>' +
        malTurbo("p-turbo--band") + malBandNede() +
      '</div>';
    }
  };

  /* ---------- Forslag til posttekst ---------- */

  // Setter punktum på slutten hvis setningen mangler det.
  function setning(t) {
    t = String(t || "").trim();
    if (!t) return "";
    return /[.!?:]$/.test(t) ? t : t + ".";
  }

  var AVSLUTNING = {
    apner:   { nb: ["Vi gleder oss til å se deg.", "Velkommen til fjells."], nn: ["Vi gler oss til å sjå deg.", "Velkomen til fjells."] },
    booking: { nb: ["Bestill tidlig, det blir fort fullt.", "Vi gleder oss til å ta imot deg."], nn: ["Bestill tidleg, det blir fort fullt.", "Vi gler oss til å ta imot deg."] },
    ledig:   { nb: ["Velkommen til fjells.", "Vi har god plass til deg og turfølget ditt."], nn: ["Velkomen til fjells.", "Vi har god plass til deg og turfylgjet ditt."] },
    takk:    { nb: ["Takk for i år, vi gleder oss til neste sesong.", "Takk til alle gjester, frivillige og samarbeidspartnere."], nn: ["Takk for i år, vi gler oss til neste sesong.", "Takk til alle gjester, frivillige og samarbeidspartnarar."] },
    soker:   { nb: ["Send oss en e-post hvis du er interessert.", "Del gjerne med noen som passer."], nn: ["Send oss ein e-post viss du er interessert.", "Del gjerne med nokon som passar."] }
  };

  // Lager et forslag til posteteksten ut fra det som er fylt inn. To varianter per mal,
  // på bokmål eller nynorsk. Teksten er et utgangspunkt, brukeren redigerer i Facebook eller Instagram.
  function byggPosttekst(b) {
    var nn = state.malform === "nn";
    var v = state.postVariant % 2;
    var hytte = state.avsender === "hytte";
    var navn = avsenderNavn();
    var paa = navn ? " på " + navn : "";
    var foto = b.eksempel && b.eksempel.fotograf ? "Foto: " + b.eksempel.fotograf
      : (state.egetBilde ? (nn ? "Foto: [namnet på fotografen]" : "Foto: [navnet på fotografen]") : "");
    var tagg = hytte ? "@dntoslo" : "";
    var linjer = [];
    var inn = b.innhold;

    if (erKalender(b.mal)) {
      var rader = b.synlige.map(function (t) {
        var dag = paaMalform(t.dag);
        var hode = dag.charAt(0) + dag.slice(1).toLowerCase() + (t.dato ? " " + t.dato + "." : "");
        return hode + ": " + setning([t.tittel, t.tid ? "kl. " + t.tid : ""].filter(Boolean).join(" ") + (t.sted ? ", " + t.sted.charAt(0).toLowerCase() + t.sted.slice(1) : ""));
      });
      var periode = (b.kal.periode || "").trim();
      var periodeLiten = periode ? periode.charAt(0) + periode.slice(1).toLowerCase() : "";
      if (v === 0) linjer = [b.kal.tittel + (periodeLiten ? ", " + periodeLiten.toLowerCase() : ""), ""].concat(rader);
      else linjer = [(b.mal === "program" ? (nn ? "Dette skjer" : "Dette skjer") + paa : (nn ? "Bli med på tur" : "Bli med på tur")) + (periodeLiten ? ", " + periodeLiten.toLowerCase() : "") + ":", ""].concat(rader);
      linjer.push("", b.mal === "program" ? (nn ? "Velkomen til oss." : "Velkommen til oss.") : (nn ? "Velkomen på tur." : "Velkommen på tur."));
    } else if (b.mal === "postkort") {
      var s = b.sig;
      if (v === 0) linjer = [setning([s.over, s.navn].filter(Boolean).join(" ")), setning(s.meta)];
      else linjer = [setning(s.navn + (s.meta ? ", " + s.meta : "")), nn ? "Stikk innom når du er på tur i området." : "Stikk innom når du er på tur i området."];
    } else if (b.mal === "sesong") {
      var slutt = AVSLUTNING[state.sesongType][nn ? "nn" : "nb"][v];
      var faktaLinjer = inn.info.map(function (r) { return r.etikett + ": " + r.verdi; });
      if (v === 0) {
        linjer = [inn.merke ? inn.merke + paa : navn, "", setning(inn.tittel), setning(inn.under), setning(inn.tekst), ""].concat(faktaLinjer, ["", slutt]);
      } else {
        linjer = [setning(inn.tittel + (inn.merke ? " (" + inn.merke.toLowerCase() + ")" : "")), setning(inn.tekst || inn.under), ""].concat(faktaLinjer, ["", slutt]);
      }
    } else if (b.mal === "meny") {
      var meny = inn.meny.length ? [""].concat(inn.meny) : [];
      var fakta = inn.info.map(function (r) { return r.etikett + ": " + r.verdi; });
      // Etter kolon fortsetter setningen med liten forbokstav: «Dagens middag på Litlos: egenfisket aure.»
      var rett = setning(inn.tittel);
      if (inn.merke) rett = inn.merke + paa + ": " + rett.charAt(0).toLowerCase() + rett.slice(1);
      if (v === 0) linjer = [rett, setning(inn.under)].concat(meny, [""], fakta, ["", nn ? "Velkomen til bords." : "Velkommen til bords."]);
      else linjer = [setning(inn.tittel + paa), setning(inn.under)].concat(meny, [""], fakta, ["", nn ? "Vi sjåast ved bordet." : "Vi ses ved bordet."]);
    } else if (b.mal === "arrangement") {
      var d = inn.dato;
      var datoLinje = [paaMalform(d.dag), d.dato ? d.dato + "." : "", d.maaned].filter(Boolean).join(" ");
      var info = inn.info.filter(function (r) { return r.etikett !== "Tid"; }).map(function (r) { return r.etikett + ": " + r.verdi; });
      if (v === 0) linjer = [inn.tittel, inn.under, "", [datoLinje, (state.arrTid || "").trim()].filter(Boolean).join(", "), "", setning(inn.tekst), ""].concat(info);
      else linjer = [setning((inn.under ? inn.under + ": " : "") + inn.tittel + (datoLinje ? ", " + datoLinje.toLowerCase() : "")), setning(inn.tekst), ""].concat(info);
    } else if (b.mal === "turtips") {
      var tipsInfo = inn.info.map(function (r) { return r.etikett + ": " + r.verdi; });
      if (v === 0) linjer = ["Turtips: " + inn.tittel, inn.under, "", setning(inn.tekst), ""].concat(tipsInfo);
      else linjer = [setning(inn.tittel + (inn.under ? ". " + inn.under : "")), setning(inn.tekst), ""].concat(tipsInfo, ["", "God tur."]);
    }

    linjer.push("", foto, tagg);
    return linjer.join("\n").replace(/\n{3,}/g, "\n\n").replace(/^\s+|\s+$/g, "");
  }

  /* ---------- Rendering ---------- */

  var el = {};
  function finnElementer() {
    el.plakat = $("#plakat"); el.skala = $("#plakat-skala"); el.ramme = $("#ramme");
    el.turliste = $("#turliste"); el.formange = $("#formange"); el.lastNed = $("#last-ned");
    el.nedlastingHjelp = $("#nedlasting-hjelp"); el.feil = $("#feil"); el.bildenavn = $("#bildenavn");
    el.promptBoks = $("#prompt-boks"); el.promptTekst = $("#prompt-tekst"); el.vekslePrompt = $("#veksle-prompt");
    el.kopierPrompt = $("#kopier-prompt");
    el.kreditering = $("#kreditering"); el.nyttEksempel = $("#nytt-eksempel");
    el.posttekst = $("#posttekst"); el.hytteValg = $("#hytte-valg");
  }

  function renderPlakat() {
    var b = beregn();
    var p = el.plakat;
    Object.keys(b.vars).forEach(function (k) { p.style.setProperty(k, b.vars[k]); });
    p.setAttribute("data-mal", state.mal);
    p.setAttribute("data-format", state.format);
    var enkelt = !erKalender(b.mal);
    p.setAttribute("data-oppsett", enkelt ? b.nivaa : state.oppsett);
    p.innerHTML = enkelt ? MALER_ARR[b.nivaa](b) : MALER[state.oppsett](b);
    // Bildeadressen settes direkte på elementet, ikke via CSS-variabel,
    // så data-URL-er fra egne bilder alltid overlever.
    $$("[data-foto]", p).forEach(function (f) { f.style.backgroundImage = 'url("' + String(b.bilde).replace(/"/g, "%22") + '")'; });
    skalerForhandsvisning(b.fmt);
    if (enkelt) sjekkPlass(p);
  }

  // Enkeltplakatene har ingen maksgrense som turkalenderen. I stedet måles
  // det om innholdet faktisk får plass, og brukeren advares hvis ikke.
  function sjekkPlass(p) {
    var trangt = false;
    var innhold = $(".a-innhold", p);
    if (innhold) {
      // Innholdet er sentrert og kan flyte ut både oppe og nede, så vi måler
      // barnas samlede utstrekning mot innholdsboksen, ikke scrollHeight.
      var r = innhold.getBoundingClientRect();
      var cs = getComputedStyle(innhold);
      // Forhåndsvisningen er skalert med transform, så padding må skaleres likt som rektanglene.
      var skala = innhold.offsetWidth ? r.width / innhold.offsetWidth : 1;
      var padT = (parseFloat(cs.paddingTop) || 0) * skala, padB = (parseFloat(cs.paddingBottom) || 0) * skala;
      var barn = Array.prototype.slice.call(innhold.children);
      if (barn.length) {
        var topp = Math.min.apply(null, barn.map(function (e) { return e.getBoundingClientRect().top; }));
        var bunn = Math.max.apply(null, barn.map(function (e) { return e.getBoundingClientRect().bottom; }));
        // Innholdet får bruke halve paddingen før vi sier fra.
        trangt = topp < r.top + padT / 2 - 1 || bunn > r.bottom - padB / 2 + 1;
      }
    }
    // På foto vokser teksten oppover fra bunnen (eller nedover fra toppen) og må ikke
    // treffe stempelet. offsetTop er upåvirket av skaleringen i forhåndsvisningen.
    var m = $(".m-innhold, .s-a", p);
    if (m) {
      var stempel = $(".m-stempel", p);
      if (m.classList.contains("m-innhold--oppe")) {
        var grense = stempel ? stempel.offsetTop - 24 : p.offsetHeight - 48;
        trangt = m.offsetTop + m.offsetHeight > grense;
      } else {
        var min = stempel ? stempel.offsetTop + stempel.offsetHeight + 24 : 48;
        trangt = m.offsetTop < min;
      }
    }
    el.formange.hidden = !trangt;
    if (trangt) {
      el.formange.textContent = aktivtNivaa() === "plakat"
        ? "Innholdet får ikke plass i dette formatet. Kort ned teksten, tøm et felt, eller bytt til Historie."
        : "Teksten får ikke plass på fotoet. Kort ned tittelen eller undertittelen, eller velg Plakat for mer tekst.";
    }
  }

  // Forhåndsvisningen er maks 540 px bred. På brede skjermer er den festet
  // (sticky) og krympes i tillegg så hele plakaten får plass i vinduet.
  function skalerForhandsvisning(fmt) {
    fmt = fmt || FORMATER[state.format];
    var kolonne = el.ramme.parentElement ? el.ramme.parentElement.clientWidth : 540;
    var skala = Math.min(540, kolonne || 540) / fmt.bredde;
    if (window.innerWidth >= 960) {
      var maksHoyde = window.innerHeight - 28 - 30 - 28 - 40;
      if (fmt.hoyde * skala > maksHoyde) skala = Math.max(maksHoyde / fmt.hoyde, 0.2);
    }
    el.skala.style.transform = "scale(" + skala + ")";
    el.ramme.style.width = Math.round(fmt.bredde * skala) + "px";
    el.ramme.style.height = Math.round(fmt.hoyde * skala) + "px";
  }

  function settVerdi(input, verdi) {
    if (document.activeElement === input) return; // ikke overskriv det brukeren skriver i
    if (input.type === "checkbox") input.checked = Boolean(verdi);
    else if (input.value !== String(verdi)) input.value = verdi;
  }

  function byggTurliste() {
    var mal = $("#tur-rad");
    var program = state.mal === "program";
    el.turliste.innerHTML = "";
    state[listeNokkel()].forEach(function (t, i) {
      var rad = mal.content.firstElementChild.cloneNode(true);
      rad.setAttribute("data-index", i);
      $(".tur__nummer", rad).textContent = (program ? "PUNKT " : "TUR ") + (i + 1);
      $("[data-felt=tittel]", rad).placeholder = program ? "Aktivitet" : "Turmål";
      $("[data-felt=sted]", rad).placeholder = program ? "Sted, f.eks. peisestua" : "Startsted";
      el.turliste.appendChild(rad);
    });
    el.turliste.setAttribute("data-liste", listeNokkel());
  }

  function renderTurliste(byggNy) {
    var liste = state[listeNokkel()];
    if (byggNy || el.turliste.children.length !== liste.length || el.turliste.getAttribute("data-liste") !== listeNokkel()) byggTurliste();
    $$(".tur", el.turliste).forEach(function (rad, i) {
      var t = liste[i];
      $$("[data-felt]", rad).forEach(function (input) { settVerdi(input, t[input.getAttribute("data-felt")]); });
      $("[data-handling=opp]", rad).disabled = i === 0;
      $("[data-handling=ned]", rad).disabled = i === liste.length - 1;
    });
    $("#legg-til").disabled = liste.length >= MAKS_TURER;
  }

  function synlig(e) {
    var mal = e.getAttribute("data-mal");
    var avs = e.getAttribute("data-avsender");
    var niv = e.getAttribute("data-nivaa");
    if (mal && mal.split(" ").indexOf(state.mal) < 0) return false;
    if (avs && avs !== state.avsender) return false;
    if (niv && niv.split(" ").indexOf(aktivtNivaa()) < 0) return false;
    return true;
  }

  function variantTekst(b) {
    if (erKalender(b.mal)) return "Oppsett: " + (state.oppsett === "topp" ? "Bilde øverst." : "Stort bilde.");
    if (b.nivaa === "postkort") return "Signatur: " + SIGNATURER[state.signatur].navn + ". " + SIGNATURER[state.signatur].tekst;
    var f = (FARGER[state.farge] || FARGER.rod).beskrivelse;
    if (b.nivaa === "plakat") return "Variant: " + f + " merkelapp.";
    return "Variant: " + f + " merkelapp, " + PLASSERINGER[state.plassering] + ".";
  }

  function renderSkjema(byggTurlisteNy) {
    var b = beregn();
    var enkelt = !erKalender(state.mal);

    $$("[data-gruppe]").forEach(function (gruppe) {
      var navn = gruppe.getAttribute("data-gruppe");
      $$("button", gruppe).forEach(function (kn) {
        var aktiv = kn.getAttribute("data-verdi") === state[navn];
        kn.classList.toggle("aktiv", aktiv);
        kn.setAttribute("aria-pressed", aktiv ? "true" : "false");
      });
    });

    $$(".panel [data-mal], .panel [data-avsender], .panel [data-nivaa]").forEach(function (e) { e.hidden = !synlig(e); });
    $$("[data-arr-type]").forEach(function (e) { e.hidden = e.getAttribute("data-arr-type").split(" ").indexOf(state.arrType) < 0; });
    if ($("#mal-hjelp")) $("#mal-hjelp").textContent = MALVALG[state.mal].hjelp;
    if ($("#nivaa-hjelp") && enkelt) $("#nivaa-hjelp").textContent = NIVAA[aktivtNivaa()].tekst;
    if ($("#signatur-hjelp")) $("#signatur-hjelp").textContent = SIGNATURER[state.signatur].tekst;
    if ($("#arr-type-hjelp")) $("#arr-type-hjelp").textContent = ARR_TYPER[state.arrType].hjelp;
    if ($("#sesong-type-hjelp")) $("#sesong-type-hjelp").textContent = SESONG_TYPER[state.sesongType].hjelp + " Eksempelteksten byttes når du velger type, det du har skrevet selv blir stående.";
    var def = SESONG_TYPER[state.sesongType].fakta;
    if ($("#sesong-fakta1-etikett")) $("#sesong-fakta1-etikett").textContent = def[0][0] + ", med ikon";
    if ($("#sesong-fakta2-etikett")) $("#sesong-fakta2-etikett").textContent = def[1][0] + ", med ikon";

    // Hyttelisten og lenken til hytta
    if (el.hytteValg) settVerdi(el.hytteValg, state.hytte);
    var h = valgtHytte();
    var lenkeBoks = $("#hytte-lenke");
    if (lenkeBoks) {
      lenkeBoks.hidden = !h;
      if (h) $("#hytte-lenke-tekst").textContent = hytteLenke(h);
    }
    if ($("#post-navn")) $("#post-navn").placeholder = "Navn, tomt gir " + (avsenderNavn() || "hyttas navn");
    if ($("#post-meta")) $("#post-meta").placeholder = avsenderMeta() ? "Linje under, tomt gir " + avsenderMeta() : "Linje under navnet, f.eks. Østmarka";

    $("#format-hjelp").textContent = b.fmt.navn + ", " + b.fmt.tekst;
    $("#tekst-hjelp").textContent = enkelt
      ? (b.stor ? "Stor tekst: litt større informasjon og brødtekst." : "Normal tekst: minste størrelse er 24 px, som er lesbart på mobil.")
      : (b.stor ? "Stor tekst: lettere å lese i feeden, men det blir plass til én tur mindre."
                : "Normal tekst: minste størrelse er 24 px, som er lesbart på mobil.");
    if (!enkelt) $("#oppsett-hjelp").textContent = b.opp.tekst + " Plass til " + b.maks + (state.mal === "program" ? " punkter" : " turer") + " i dette formatet.";
    if ($("#liste-etikett")) $("#liste-etikett").textContent = state.mal === "program" ? "Programmet" : "Turene";
    $("#legg-til").textContent = state.mal === "program" ? "+ Legg til punkt" : "+ Legg til tur";
    el.bildenavn.textContent = state.bildenavn;
    el.nyttEksempel.hidden = state.egetBilde;
    el.nyttEksempel.textContent = hytteBilder() ? "Nytt bilde fra hytta" : "Nytt eksempelbilde";
    if (state.egetBilde) {
      el.kreditering.hidden = true;
    } else {
      el.kreditering.hidden = false;
      el.kreditering.textContent = b.eksempel && b.eksempel.fotograf
        ? "Bildet er tatt av " + b.eksempel.fotograf + ". Husk å kreditere fotografen i posteteksten: Foto: " + b.eksempel.fotograf + "."
        : "Husk å kreditere fotografen i posteteksten når du bruker et eksempelbilde.";
    }

    $$("[data-utsnitt]").forEach(function (r) { settVerdi(r, b.u[r.getAttribute("data-utsnitt")]); });
    $$(".tekstfelt[data-felt]").forEach(function (f) {
      var k = f.getAttribute("data-felt");
      if (state[k] !== undefined) settVerdi(f, state[k]);
    });
    if ($("#vis-logo")) settVerdi($("#vis-logo"), state.visLogo);
    if ($("#vis-merke")) settVerdi($("#vis-merke"), state.visMerke);
    if ($("#vis-band")) settVerdi($("#vis-band"), state.visBand);
    if ($("#lenke-felt")) $("#lenke-felt").hidden = !state.visBand;
    if ($("#vis-turbo")) settVerdi($("#vis-turbo"), state.visTurbo);
    if ($("#kort-glass")) settVerdi($("#kort-glass"), state.kortGlass);
    if ($("#kort-glass-felt")) $("#kort-glass-felt").hidden = enkelt || state.oppsett !== "bakgrunn";

    renderTurliste(byggTurlisteNy);

    if (!enkelt) {
      el.formange.hidden = !b.forMange;
      el.formange.textContent = b.synlige.length + (state.mal === "program" ? " punkter" : " turer") + " får ikke plass i dette oppsettet (maks " + b.maks +
        "). Velg «Bilde øverst», bytt til Historie, eller del listen i to bilder.";
    }

    el.lastNed.disabled = b.forMange || state.laster;
    el.lastNed.textContent = state.laster ? "Lager bildet …" : (b.forMange ? "For mange punkter for dette oppsettet" : "Last ned bildet");
    el.nedlastingHjelp.textContent = "Bildet lagres i " + b.fmt.tekst + " og er klart til å legges rett ut.";
    if ($("#variant-hjelp")) $("#variant-hjelp").textContent = variantTekst(b);
    if (el.posttekst) el.posttekst.value = byggPosttekst(b);

    el.promptBoks.hidden = !state.visPrompt;
    el.vekslePrompt.textContent = state.visPrompt ? "Skjul reserveløsning" : "Reserveløsning: prompt til Claude";
    if (state.visPrompt) el.promptTekst.value = byggPrompt(b);
  }

  function render(valg) {
    valg = valg || {};
    renderSkjema(valg.turliste);
    renderPlakat();
    if (valg.lagre !== false) lagre();
  }

  function oppdater(patch, valg) {
    Object.assign(state, patch);
    render(valg);
  }

  /* ---------- Avsender, type og målform ---------- */

  function hytteLenke(h) {
    return window.location.origin + window.location.pathname + "?hytte=" + h.id;
  }

  function byggHytteliste() {
    if (!el.hytteValg) return;
    var sortert = HYTTER.slice().sort(function (a, b) { return a.kortnavn.localeCompare(b.kortnavn, "nb"); });
    el.hytteValg.innerHTML = '<option value="">Velg hytte</option>' + sortert.map(function (h) {
      return '<option value="' + esc(h.id) + '">' + esc(h.kortnavn + " · " + h.omrade) + '</option>';
    }).join("");
  }

  function velgAvsender(avs) {
    if (avs === state.avsender) return;
    var patch = { avsender: avs };
    if (!tillattMal(state.mal, avs)) {
      patch.mal = avs === "hytte" ? (state.mal === "turkalender" ? "program" : "sesong")
                                  : (state.mal === "program" ? "turkalender" : "arrangement");
    }
    Object.assign(state, patch);
    if (!state.egetBilde) Object.assign(state, brukEksempelbilder());
    render({ turliste: true });
  }

  function velgHytte(id) {
    var gammel = valgtHytte();
    var ny = finnHytte(id);
    var patch = { hytte: ny ? ny.id : "" };
    Object.assign(patch, byttEksempeltekst(sesongPreset(state.sesongType, state.malform, gammel), sesongPreset(state.sesongType, state.malform, ny)));
    Object.assign(state, patch);
    if (!state.egetBilde) Object.assign(state, brukEksempelbilder());
    render();
  }

  function velgSesongType(type) {
    if (!SESONG_TYPER[type] || type === state.sesongType) return;
    var h = valgtHytte();
    var patch = { sesongType: type };
    Object.assign(patch, byttEksempeltekst(sesongPreset(state.sesongType, state.malform, h), sesongPreset(type, state.malform, h)));
    oppdater(patch);
  }

  function velgMalform(mf) {
    var gml = state.malform;
    if (mf === gml) return;
    var h = valgtHytte();
    var patch = { malform: mf };
    Object.assign(patch, byttEksempeltekst(sesongPreset(state.sesongType, gml, h), sesongPreset(state.sesongType, mf, h)));
    Object.assign(patch, byttEksempeltekst(menyPreset(gml), menyPreset(mf)));
    var hilsen = { nb: "Hilsen fra", nn: "Helsing frå" };
    if (state.postOverlinje === hilsen[gml]) patch.postOverlinje = hilsen[mf];
    oppdater(patch);
  }

  // «Prøv en annen variant» bytter det som kan varieres uten at innholdet endres:
  // farge og plassering i Merkelapp, signatur i Postkort, farge i Plakat og oppsett i kalenderen.
  function nyVariant() {
    if (erKalender(state.mal)) { oppdater({ oppsett: state.oppsett === "topp" ? "bakgrunn" : "topp" }); return; }
    var nivaa = aktivtNivaa();
    var farger = Object.keys(FARGER);
    if (nivaa === "postkort") {
      var sig = Object.keys(SIGNATURER);
      oppdater({ signatur: sig[(sig.indexOf(state.signatur) + 1) % sig.length] });
      return;
    }
    if (nivaa === "plakat") {
      oppdater({ farge: farger[(farger.indexOf(state.farge) + 1) % farger.length] });
      return;
    }
    var kombinasjoner = [];
    farger.forEach(function (f) {
      Object.keys(PLASSERINGER).forEach(function (p) {
        if (f !== state.farge && p !== state.plassering) kombinasjoner.push({ farge: f, plassering: p });
      });
    });
    oppdater(kombinasjoner[Math.floor(Math.random() * kombinasjoner.length)]);
  }

  /* ---------- Reserveprompt ---------- */

  function byggPrompt(b) {
    if (!erKalender(b.mal)) return byggPromptEnkelt(b);
    var navn = (b.kal.navn || "").trim() || "turlaget";
    var linjer = b.synlige.map(function (t) {
      var deler = [];
      deler.push([paaMalform(t.dag), t.dato].filter(Boolean).join(" ") + (t.tid ? " kl. " + t.tid : "") + ": " + (t.tittel || "(turmål)"));
      if (t.sted) deler.push("Sted: " + t.sted);
      if (t.turleder) deler.push("Turleder " + t.turleder);
      if (t.varighet) deler.push(t.varighet);
      if (t.grad) deler.push("Gradering: " + t.grad);
      if (t.pamelding) deler.push("Påmelding");
      return "- " + deler.join(". ");
    });
    if (!linjer.length) linjer.push("- (fyll inn dag, dato, klokkeslett, aktivitet og sted per punkt)");

    return "Du er designer for " + navn + " i DNT Oslo og Omegn. Lag en grafikk til Facebook og Instagram som " +
      b.fmt.navn.toLowerCase() + " (" + b.fmt.tekst + ") med " + (b.kal.tittel || "turkalender").toLowerCase() + ".\n\n" +
      "Profil som skal følges:\n" +
      "Farger: DNT-rød #D82D20, lys beige #F8F2E4 til bakgrunn, beige #F2E6D0 til radveksling, mørk beige #E8D7B6 til datofelt, hvit, sort tekst.\n" +
      "Fonter: Whitman Bold til overskriften «" + b.kal.tittel + "», ABC Social Extended Bold til turmål, klokkeslett og datotall, ABC Social til brødtekst.\n" +
      "Oppsett: " + b.opp.prompt + (state.visBand ? " Nederst et rødt bånd med rund DNT-logo (rød T i hvit sirkel) og nettadressen «" + state.lenke + "» i liten, medium skrift, mindre enn turmålene." : " Ingen bånd nederst.") +
      (state.visLogo ? " Rund DNT-logo (rød T i hvit sirkel) oppe til høyre i fotoet." : " Ingen logo i fotoet.") +
      (state.visTurbo ? " Turbo-figuren (Barnas Turlags maskot) nede til høyre i fotoet." : "") +
      (state.kortGlass && state.oppsett === "bakgrunn" ? " Kortet er svakt gjennomskinnelig (88 % hvitt) så fotoet skinner gjennom." : "") + "\n" +
      "Minste tekststørrelse er 24 px.\n" +
      (state.malform === "nn" ? "All tekst skal være på nynorsk.\n" : "") +
      "Ingen KI-genererte bilder, ingen emoji. Bruk et ekte foto.\n\n" +
      b.kal.tittel + " for " + navn + ", " + b.kal.periode + ":\n" + linjer.join("\n");
  }

  function byggPromptEnkelt(b) {
    var navn = avsenderNavn() || "turlaget";
    var inn = b.innhold;
    var hva = { arrangement: " for ett arrangement", turtips: " med et turtips", sesong: " med en kunngjøring fra hytta",
                meny: " om mat og meny på hytta", postkort: " som et postkort" }[b.mal] || "";
    var linjer;
    if (b.nivaa === "postkort") {
      linjer = [b.sig.over ? "Liten tekst over navnet: " + b.sig.over : "", "Navn: " + b.sig.navn, b.sig.meta ? "Under navnet: " + b.sig.meta : "",
                "Signatur: " + SIGNATURER[state.signatur].tekst];
    } else {
      linjer = [
        inn.merke ? "Merkelapp: " + inn.merke : "",
        "Tittel: " + inn.tittel,
        inn.under ? "Undertittel: " + inn.under : "",
        inn.dato ? "Dato: " + [inn.dato.dag, inn.dato.dato + ".", inn.dato.maaned].filter(Boolean).join(" ") : ""
      ].concat(b.info.map(function (r) { return r.etikett + ": " + r.verdi; }))
       .concat(inn.meny.length ? ["Meny: " + inn.meny.join(", ")] : [])
       .concat(inn.tekst && b.nivaa === "plakat" ? ["Tekst: " + inn.tekst] : []);
    }
    linjer = linjer.filter(Boolean);

    return "Du er designer for " + navn + " i DNT Oslo og Omegn. Lag et bilde til sosiale medier som " + b.fmt.navn.toLowerCase() + " (" + b.fmt.tekst + ")" + hva + ".\n\n" +
      "Profil som skal følges:\n" +
      "Farger: DNT-rød #D82D20, lys beige #F8F2E4 til bakgrunn, hvit, sort tekst. Merkelappen er " + (FARGER[state.farge] || FARGER.rod).beskrivelse + ".\n" +
      "Fonter: Whitman Bold til tittelen, ABC Social Extended til undertittel, etiketter og datotall, ABC Social til brødtekst.\n" +
      "Oppsett: " + b.opp.prompt + (state.visBand ? " Nederst et rødt bånd med rund DNT-logo (rød T i hvit sirkel) og nettadressen «" + state.lenke + "» i liten, medium skrift." : " Ingen bånd nederst.") +
      (state.visTurbo ? " Turbo-figuren (Barnas Turlags maskot) nede til høyre." : "") +
      (b.mal === "turtips" && state.tipsGrad ? " Graderingen vises med en prikk i graderingsfargen: grønn for enkel, blå for middels, rød for krevende og svart for ekspert." : "") + "\n" +
      "Minste tekststørrelse er 24 px.\n" +
      (state.malform === "nn" ? "All tekst skal være på nynorsk.\n" : "") +
      "Ingen KI-genererte bilder, ingen emoji. Bruk et ekte foto.\n\n" +
      "Innhold:\n- " + linjer.join("\n- ");
  }

  /* ---------- Eksport ---------- */

  function visFeil(melding) {
    el.feil.textContent = melding;
    el.feil.hidden = !melding;
  }

  function ventPaaBilde(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        if (img.decode) img.decode().then(resolve, resolve); else resolve();
      };
      img.onerror = resolve;
      img.src = src;
    });
  }

  function tilBlob(canvas) {
    return new Promise(function (resolve, reject) {
      if (!canvas.toBlob) {
        try { resolve(dataUrlTilBlob(canvas.toDataURL("image/png"))); } catch (e) { reject(e); }
        return;
      }
      canvas.toBlob(function (blob) { blob ? resolve(blob) : reject(new Error("Kunne ikke lage bildefil")); }, "image/png");
    });
  }

  function dataUrlTilBlob(url) {
    var deler = url.split(","), bin = atob(deler[1]), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: "image/png" });
  }

  function lastNedBlob(blob, filnavn) {
    var url = URL.createObjectURL(blob);
    var stotterNedlasting = "download" in HTMLAnchorElement.prototype;
    if (stotterNedlasting) {
      var a = document.createElement("a");
      a.href = url; a.download = filnavn; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
    } else {
      var vindu = window.open(url, "_blank");
      if (!vindu) throw new Error("Nettleseren blokkerte åpning av bildet. Tillat popup-vinduer og prøv igjen.");
      visFeil("Bildet åpnet i en ny fane. Hold inne på bildet og velg «Lagre bilde».");
    }
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }

  function filnavn(b) {
    var h = valgtHytte();
    var forst = h ? h.id : slug(state.turlag);
    if (erKalender(b.mal)) return b.mal + "-" + forst;
    var tittel = b.nivaa === "postkort" ? b.sig.navn : b.innhold.tittel;
    return b.mal + "-" + (h ? forst + "-" : "") + slug(tittel);
  }

  async function lastNed() {
    if (state.laster) return;
    var b = beregn();
    if (b.forMange) return;
    if (!window.html2canvas) { visFeil("Eksportbiblioteket ble ikke lastet. Last siden på nytt og prøv igjen."); return; }

    visFeil("");
    oppdater({ laster: true }, { lagre: false });

    var klone = null;
    try {
      await document.fonts.ready;
      await ventPaaBilde(b.bilde);

      // Skjult 1:1-klone, så forhåndsvisningen ikke blinker og skalering ikke påvirker målene.
      klone = el.plakat.cloneNode(true);
      klone.id = "";
      klone.className = "eksport-klone";
      document.body.appendChild(klone);

      var canvas = await window.html2canvas(klone, {
        scale: 1, useCORS: true, backgroundColor: null, logging: false,
        width: b.fmt.bredde, height: b.fmt.hoyde,
        windowWidth: b.fmt.bredde, windowHeight: b.fmt.hoyde
      });
      if (canvas.width !== b.fmt.bredde || canvas.height !== b.fmt.hoyde) {
        console.warn("Uventet størrelse på eksport:", canvas.width, canvas.height);
      }
      var blob = await tilBlob(canvas);
      lastNedBlob(blob, filnavn(b) + "-" + state.format + ".png");
    } catch (e) {
      console.error(e);
      visFeil("Det gikk ikke å lage bildet: " + (e && e.message ? e.message : "ukjent feil") +
        ". Prøv en annen nettleser (Chrome eller Edge), eller bruk reserveløsningen under.");
    } finally {
      if (klone && klone.parentNode) klone.parentNode.removeChild(klone);
      oppdater({ laster: false }, { lagre: false });
    }
  }

  /* ---------- Hendelser ---------- */

  function kopier(tekst, knapp, ferdigTekst, vanligTekst, reserve) {
    var ferdig = function () {
      knapp.textContent = ferdigTekst;
      setTimeout(function () { knapp.textContent = vanligTekst; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tekst).then(ferdig, function () { if (reserve) reserve.select(); });
    } else if (reserve) {
      reserve.select();
      try { document.execCommand("copy"); ferdig(); } catch (e) { /* brukeren kan kopiere manuelt */ }
    }
  }

  function kobleHendelser() {
    // Knappegrupper. Avsender, målform og sesongtype har sideeffekter, resten settes rett.
    $$("[data-gruppe]").forEach(function (gruppe) {
      gruppe.addEventListener("click", function (e) {
        var kn = e.target.closest("button[data-verdi]");
        if (!kn) return;
        var navn = gruppe.getAttribute("data-gruppe");
        var verdi = kn.getAttribute("data-verdi");
        if (navn === "avsender") return velgAvsender(verdi);
        if (navn === "malform") return velgMalform(verdi);
        if (navn === "sesongType") return velgSesongType(verdi);
        var patch = {}; patch[navn] = verdi;
        oppdater(patch, { turliste: navn === "mal" });
      });
    });

    // Tekstfelter, nedtrekk og tekstområder utenfor turlisten
    $$(".tekstfelt[data-felt]").forEach(function (felt) {
      var handler = function () {
        var patch = {}; patch[felt.getAttribute("data-felt")] = felt.value;
        oppdater(patch);
      };
      felt.addEventListener("input", handler);
      if (felt.tagName === "SELECT") felt.addEventListener("change", handler);
    });

    if (el.hytteValg) el.hytteValg.addEventListener("change", function () { velgHytte(el.hytteValg.value); });
    if ($("#kopier-hyttelenke")) $("#kopier-hyttelenke").addEventListener("click", function (e) {
      var h = valgtHytte();
      if (h) kopier(hytteLenke(h), e.target, "Kopiert", "Kopier lenken", null);
    });

    // Avkryssinger. Sjekkes for null, så en hurtigbufret index.html uten
    // elementene ikke stopper resten av oppstarten.
    if ($("#vis-logo")) $("#vis-logo").addEventListener("change", function (e) { oppdater({ visLogo: e.target.checked }); });
    if ($("#vis-merke")) $("#vis-merke").addEventListener("change", function (e) { oppdater({ visMerke: e.target.checked }); });
    if ($("#vis-band")) $("#vis-band").addEventListener("change", function (e) { oppdater({ visBand: e.target.checked }); });
    if ($("#kort-glass")) $("#kort-glass").addEventListener("change", function (e) { oppdater({ kortGlass: e.target.checked }); });
    if ($("#vis-turbo")) $("#vis-turbo").addEventListener("change", function (e) { oppdater({ visTurbo: e.target.checked }); });

    // Utsnitt
    $$("[data-utsnitt]").forEach(function (r) {
      r.addEventListener("input", function () {
        var u = Object.assign({}, state.utsnitt);
        u[state.format] = Object.assign({}, u[state.format]);
        u[state.format][r.getAttribute("data-utsnitt")] = Number(r.value);
        oppdater({ utsnitt: u });
      });
    });
    $("#midtstill").addEventListener("click", function () {
      var u = Object.assign({}, state.utsnitt);
      u[state.format] = { x: 50, y: 50, z: 115 };
      oppdater({ utsnitt: u });
    });

    el.nyttEksempel.addEventListener("click", function () {
      $("#bilde-fil").value = "";
      oppdater(brukEksempelbilder());
    });

    // Eget bilde
    $("#bilde-fil").addEventListener("change", function (e) {
      var fil = e.target.files && e.target.files[0];
      if (!fil) return;
      if (!/^image\//.test(fil.type)) { visFeil("Filen er ikke et bilde. Velg en JPG- eller PNG-fil."); return; }
      var leser = new FileReader();
      leser.onload = function () {
        visFeil("");
        oppdater({ bilde: leser.result, egetBilde: true, bildenavn: fil.name, utsnitt: nyttUtsnitt() });
      };
      leser.onerror = function () { visFeil("Kunne ikke lese bildefilen."); };
      leser.readAsDataURL(fil);
    });

    // Turliste og program: skriving og valg
    function turHendelse(e) {
      var input = e.target.closest("[data-felt]");
      var rad = e.target.closest(".tur");
      if (!input || !rad) return;
      var i = Number(rad.getAttribute("data-index"));
      var felt = input.getAttribute("data-felt");
      var nokkel = listeNokkel();
      var liste = state[nokkel].slice();
      liste[i] = Object.assign({}, liste[i]);
      liste[i][felt] = input.type === "checkbox" ? input.checked : input.value;
      var patch = {}; patch[nokkel] = liste;
      oppdater(patch);
    }
    el.turliste.addEventListener("input", turHendelse);
    el.turliste.addEventListener("change", turHendelse);

    // Turliste og program: flytt og fjern
    el.turliste.addEventListener("click", function (e) {
      var kn = e.target.closest("button[data-handling]");
      var rad = e.target.closest(".tur");
      if (!kn || !rad) return;
      var i = Number(rad.getAttribute("data-index"));
      var nokkel = listeNokkel();
      var liste = state[nokkel].slice();
      var handling = kn.getAttribute("data-handling");
      if (handling === "fjern") {
        liste.splice(i, 1);
      } else {
        var j = handling === "opp" ? i - 1 : i + 1;
        if (j < 0 || j >= liste.length) return;
        var t = liste[i]; liste[i] = liste[j]; liste[j] = t;
      }
      var patch = {}; patch[nokkel] = liste;
      oppdater(patch, { turliste: true });
    });

    $("#legg-til").addEventListener("click", function () {
      var nokkel = listeNokkel();
      if (state[nokkel].length >= MAKS_TURER) return;
      var patch = {}; patch[nokkel] = state[nokkel].concat([nyTur()]);
      oppdater(patch, { turliste: true });
      var siste = el.turliste.lastElementChild;
      if (siste) { var felt = $("[data-felt=tittel]", siste); if (felt) felt.focus(); }
    });

    // Variant og posttekst
    if ($("#ny-variant")) $("#ny-variant").addEventListener("click", nyVariant);
    if ($("#annen-posttekst")) $("#annen-posttekst").addEventListener("click", function () {
      oppdater({ postVariant: state.postVariant + 1 }, { lagre: false });
    });
    if ($("#kopier-posttekst")) $("#kopier-posttekst").addEventListener("click", function (e) {
      kopier(el.posttekst.value, e.target, "Kopiert", "Kopier", el.posttekst);
    });

    // Nedlasting, tømming, prompt
    el.lastNed.addEventListener("click", lastNed);

    $("#tom-skjema").addEventListener("click", function () {
      if (!window.confirm("Vil du tømme skjemaet? Alle tekster nullstilles til eksempelinnholdet.")) return;
      tomLagring();
      var behold = { mal: state.mal, avsender: state.avsender, hytte: state.hytte, malform: state.malform };
      Object.assign(state, standardSkjema(), behold);
      var h = valgtHytte();
      Object.assign(state, sesongPreset(state.sesongType, state.malform, h), menyPreset(state.malform),
        { postOverlinje: paaMalform("Hilsen fra") }, brukEksempelbilder());
      $("#bilde-fil").value = "";
      visFeil("");
      render({ turliste: true, lagre: false });
    });

    el.vekslePrompt.addEventListener("click", function () { oppdater({ visPrompt: !state.visPrompt }, { lagre: false }); });

    el.kopierPrompt.addEventListener("click", function () {
      kopier(el.promptTekst.value, el.kopierPrompt, "Kopiert", "Kopier prompten", el.promptTekst);
    });

    window.addEventListener("resize", function () { skalerForhandsvisning(); });
  }

  /* ---------- Oppstart ---------- */

  function start() {
    finnElementer();
    byggHytteliste();
    hent();
    lesLenke();
    Object.assign(state, brukEksempelbilder(), { utsnitt: state.utsnitt });
    kobleHendelser();
    render({ turliste: true, lagre: false });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { fonterKlare = true; maaleCache = {}; renderPlakat(); });
    } else {
      fonterKlare = true;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
