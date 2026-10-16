/* Konstanter: maler, nivåer, signaturer, farger, tekststørrelser, oppsett,
   formater og eksempelbilder. Importerer ingenting, så den er ferdig før alle andre. */
export var LAGRINGSNOKKEL = "dnt-ukens-turer-v1";
// Innlegg og historie har plass til åtte turer. Karusellen fordeler listen på flere bilder.
export var MAKS_TURER = 8;
export var MAKS_KARUSELL = 20;
export var HYTTER = window.HYTTER || [];
export var HYTTEMAPPE = "assets/img/hytter/";
export var TURMAPPE = "assets/img/hytter/turer/";

// Graderingsfargene følger DNTs graderingsstandard (grønn, blå, rød, sort),
// ikke merkevarepaletten. Rød er likevel DNT Rød fra paletten.
export var GRAD = {
  "Enkel":    "#2E6B3E",
  "Middels":  "#316095",
  "Krevende": "#D82D20",
  "Ekspert":  "#0F0F0F"
};

// To tekststørrelser. «Stor» er for turlag med mange seniorer blant deltakerne,
// og tar plassen fra antall turer, ikke fra luften i designet.
// Hver liste har fire trinn: trinn 0 er romsligst, trinn 3 er tettest.
// Fra 16. oktober 2026 er det man leser for å bli med, minst 30 px i normal størrelse:
// sted 30, turmål 34 og klokkeslett 36. 24 px i bildet blir bare ca. 8,7 px på en iPhone.
// Dagsnavnet i datofeltet er 26 px. Datotallet er i ABC Social Extended Bold.
// luft er polstringen over og under hver rad i «Bilde øverst», se beregnTurkalender().
export var TEKST = {
  normal: {
    chip: [124, 118, 112, 112], chipSmal: [112, 108, 104, 104],
    dag: [26, 26, 26, 26], dato: [50, 48, 46, 46], datoSmal: [46, 44, 42, 42],
    title: [38, 36, 34, 34], titleSmal: [36, 34, 34, 34],
    meta: [32, 30, 30, 30], detalj: 26, tid: [40, 38, 36, 36],
    luft: [30, 26, 22, 18]
  },
  stor: {
    chip: [138, 132, 126, 126], chipSmal: [126, 120, 116, 116],
    dag: [28, 28, 28, 28], dato: [56, 54, 52, 52], datoSmal: [52, 50, 48, 48],
    title: [42, 40, 38, 38], titleSmal: [40, 38, 38, 38],
    meta: [36, 34, 34, 34], detalj: 28, tid: [44, 42, 40, 40],
    luft: [30, 26, 22, 18]
  }
};

export var FORMATER = {
  // Nøklene er interne og lagres i skjemaet. Navnene er dem Facebook og Instagram bruker på norsk.
  feed:     { navn: "Innlegg",  bredde: 1080, hoyde: 1350, tekst: "1080 × 1350 px" },
  story:    { navn: "Historie", bredde: 1080, hoyde: 1920, tekst: "1080 × 1920 px" },
  // Karusell (15. oktober 2026) gjelder bare turkalender og program: forside, listen fordelt
  // på så mange bilder som trengs, og eventuelt «Godt å vite» til slutt. Alle i innleggsformat.
  karusell: { navn: "Karusell", bredde: 1080, hoyde: 1350, tekst: "1080 × 1350 px per bilde" }
  // Liggende (1920 × 1080) ble fjernet 28. september 2026. Lagret «liggende» blir Innlegg i hent().
};

// Malene. Turkalender er den opprinnelige, arrangement kom til 11. september 2026,
// turtips 25. september 2026 og hyttemalene 14. oktober 2026. «avsender» sier hvem
// som ser malen: tom betyr både turlag og hytter. Turkalender og program deler
// beregnTurkalender(), resten deler beregnEnkelt() og MALER_ARR.
export var MALVALG = {
  turkalender: { avsender: "turlag", hjelp: "Flere turer i én liste, for uka eller måneden." },
  program:     { avsender: "hytte",  hjelp: "Flere programpunkter i én liste, f.eks. påskeprogram eller ukeprogram." },
  sesong:      { avsender: "hytte",  hjelp: "Vi åpner, booking åpner, ledige senger, takk for sesongen eller vi søker folk." },
  meny:        { avsender: "hytte",  hjelp: "Dagens middag, gourmethelg eller pizzakveld." },
  arrangement: { avsender: "",       hjelp: "Ett arrangement: tur, kurs eller dugnad." },
  turtips:     { avsender: "",       hjelp: "Tips om ett turmål, med lengde, gradering og hvordan du kommer deg dit." },
  postkort:    { avsender: "",       hjelp: "Et fint bilde med signatur og nesten ingen tekst. Budskapet skriver du i posteteksten." }
};

// Tittelfonten. Sporingen må være lik letter-spacing på .p-tittel, .a-tittel,
// .m-tittel, .s-navn og .k-tittel i app.css, ellers regner tilpassStorrelse() feil bredde.
export var TITTELFONT = '700 {px}px "Whitman"';
export var TITTELSPORING = -0.02;
// Snittene tilpassStorrelse() og maalBredde() måler med. Lastes før første måling i start().
export var MAALTE_FONTER = ['700 40px "Whitman"', '500 24px "ABC Social Extended"', '500 28px "ABC Social"'];

// Hvor mye tekst som står på bildet. Gjelder arrangement, turtips, sesong og meny.
// Postkort-malen bruker alltid postkortnivået. Merkelapp er standard.
// «Stort foto» ble til Merkelapp og «Foto og tekstfelt» til Plakat 14. oktober 2026.
export var NIVAA = {
  postkort:  { tekst: "Bare fotoet og en signatur. Budskapet skriver du i posteteksten." },
  merkelapp: { tekst: "Fotoet fyller flaten, med merkelapp, kort tittel og opptil to fakta." },
  plakat:    { tekst: "Foto øverst og all informasjonen på lys beige flate under." }
};

// Tre postkortsignaturer. A er standard (14. oktober 2026). Bare stempelet (B) har logo.
// C het «Postkort» til 16. oktober 2026, men ordet betyr allerede malen og tekstnivået.
export var SIGNATURER = {
  a: { navn: "Stor", tekst: "Stor signatur rett på fotoet." },
  b: { navn: "Stempel", tekst: "Lite hvitt stempel med logo, navn og høyde." },
  c: { navn: "Med kant", tekst: "Fotoet med lys kant, som et postkort." }
};

// Fargen på merkelappen. Sesongfargene er fra den nye paletten og godkjent 14. oktober 2026.
export var FARGER = {
  rod:    { navn: "Rød",    beskrivelse: "rød",          bg: "var(--dnt-rod)",        fg: "var(--hvit)" },
  vinter: { navn: "Vinter", beskrivelse: "vinterblå",    bg: "var(--ny-bla)",         fg: "var(--sort)" },
  paske:  { navn: "Påske",  beskrivelse: "påskegul",     bg: "var(--ny-gul)",         fg: "var(--sort)" },
  sommer: { navn: "Sommer", beskrivelse: "sommergrønn",  bg: "var(--ny-mork-gronn)",  fg: "var(--hvit)" },
  host:   { navn: "Høst",   beskrivelse: "høstoransje",  bg: "var(--ny-oransje)",     fg: "var(--sort)" }
};

// Plassering av teksten i Merkelapp. Byttes med «Prøv en annen variant».
export var PLASSERINGER = { nede: "teksten nederst", oppe: "teksten øverst", midt: "teksten midtstilt" };

export var ARR_TYPER = {
  arrangement: { hjelp: "Tur eller annet enkelt arrangement. Feltene «Passer for» og «Påmelding» er valgfrie." },
  kurs:        { hjelp: "Kurs med pris og påmeldingsfrist. Tomme felt vises ikke i plakaten." },
  dugnad:      { hjelp: "Dugnad med hva folk skal ta med og hva som serveres. Tomme felt vises ikke." }
};

// Feltene som vises som etikett og verdi i plakaten, i denne rekkefølgen.
export var ARR_INFO = [
  ["arrTid", "Tid"], ["arrSted", "Sted"], ["arrPasserFor", "Passer for"], ["arrPris", "Pris"],
  ["arrFrist", "Påmeldingsfrist"], ["arrTaMed", "Ta med"], ["arrServering", "Servering"], ["arrPamelding", "Påmelding"]
];
export var ARR_FELT = ["arrTittel", "arrUnder", "arrDag", "arrDato", "arrMaaned", "arrTid", "arrSted", "arrTekst",
                "arrPasserFor", "arrPris", "arrFrist", "arrTaMed", "arrServering", "arrPamelding"];

// Faktafeltene i turtips, i denne rekkefølgen. Gradering vises med prikk i graderingsfargen.
export var TIPS_INFO = [
  ["tipsLengde", "Lengde"], ["tipsVarighet", "Varighet"], ["tipsGrad", "Gradering"], ["tipsStart", "Start"],
  ["tipsKollektiv", "Kollektivt"], ["tipsPasserFor", "Passer for"], ["tipsUnderveis", "Underveis"], ["tipsSesong", "Beste tid"]
];
export var TIPS_FELT = ["tipsTittel", "tipsUnder", "tipsTekst", "tipsLengde", "tipsVarighet", "tipsGrad", "tipsStart",
                 "tipsKollektiv", "tipsPasserFor", "tipsUnderveis", "tipsSesong"];

// Sesong og booking. Typen bestemmer eksempelteksten og etikett og ikon på de to faktaene.
export var SESONG_TYPER = {
  apner:   { hjelp: "Når hytta åpner for sesongen.",
             fakta: [["Åpent", "kalender"], ["Bestilling", "seng"]] },
  booking: { hjelp: "Når bookingen åpner. Datoen står i datofeltet i Plakat og under tittelen i Merkelapp.",
             fakta: [["Periode", "kalender"], ["Bestilling", "post"]] },
  ledig:   { hjelp: "Ledige senger i en periode.",
             fakta: [["Periode", "kalender"], ["Bestilling", "seng"]] },
  takk:    { hjelp: "Takk for sesongen, med dato for neste sesong.",
             fakta: [["Neste sesong", "kalender"], ["Bestilling", "seng"]] },
  soker:   { hjelp: "Rekruttering av sesongansatte.",
             fakta: [["Søknadsfrist", "kalender"], ["Søknad", "post"]] }
};
export var SESONG_FELT = ["sesongMerke", "sesongTittel", "sesongUnder", "sesongTekst", "sesongFakta1", "sesongFakta2",
                   "sesongDag", "sesongDato", "sesongMaaned"];
export var MENY_FELT = ["menyMerke", "menyTittel", "menyUnder", "menyLinjer", "menyTid", "menyPris"];
export var POST_FELT = ["postOverlinje", "postNavn", "postMeta"];
export var PROGRAM_FELT = ["programTittel", "programPeriode", "karusellUnder", "karusellInfo"];
// Hvilket turforslag fra UT.no som er brukt som eksempel i Turtips («hytte/id», se turNokkel()).
export var TUR_FELT = ["tipsTur"];

// Ikonene er fra Lucide (MIT), som i designsystemet Hyttebestilling. Streken er
// satt til sort direkte, fordi html2canvas tegner SVG uten å arve currentColor.
export var IKON_STI = {
  kalender: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  post:     '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  seng:     '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
  klokke:   '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  sted:     '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  bestikk:  '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  info:     '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  rute:     '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>'
};

// Maksgrensene ble satt ned 16. oktober 2026, da teksten i listene ble større.
// Flere turer går til Karusell. Grensene er målt med lange turmål og detaljer, se
// «Tekst og plass» i docs/design.md. sjekkListe() sier fra hvis innholdet likevel ikke får plass.
export var OPPSETT = {
  topp:     { tekst: "Bildet øverst, og det vokser når det er få turer.", maks: { feed: 6, story: 7 } },
  // Vises som «Stort bilde». «Stort bilde» med beige under fotoet og «Stående til høyre»
  // ble fjernet 25. september 2026, lagrede valg av dem blir til bakgrunn i hent().
  bakgrunn: { tekst: "Bildet fyller hele flaten, turene står i et hvitt kort nederst.", maks: { feed: 6, story: 8 } }
};

// Eksempelbilder som vises når ingen laster opp eget foto. Ett liggende og
// ett stående trekkes tilfeldig ved hver åpning, aldri samme to ganger på rad.
// Legg til et bilde: legg filen i assets/img/eksempler/ og én linje her.
// Alle er ekte foto med kjent rettighetshaver. Ingen KI-genererte bilder.
// Hyttene har egne eksempelbilder i js/hytter.js.
// «fokus» er motivets plass i bildet, [x, y] i prosent fra venstre og ovenfra. Standardutsnittet
// legger det midt i flaten så langt bildet rekker (se bakgrunn()). Nye bilder bør få et fokuspunkt.
export var EKSEMPELMAPPE = "assets/img/eksempler/";
export var EKSEMPELBILDER = [
  { fil: "vardedugnad-sulebu.jpg",           fotograf: "Daniel Jacobsen", staaende: false, fokus: [73, 62] },
  { fil: "snellingen.jpg",                   fotograf: "Daniel Jacobsen", staaende: false, fokus: [40, 50] },
  { fil: "myrsetra-1.jpg",                   fotograf: "Daniel Jacobsen", staaende: false, fokus: [47, 50] },
  { fil: "myrsetra-2.jpg",                   fotograf: "Daniel Jacobsen", staaende: false, fokus: [22, 50] },
  { fil: "fuglemyrhytta.jpg",                fotograf: "Daniel Jacobsen", staaende: false, fokus: [45, 60] },
  { fil: "fiskepinner-katnosdammen.jpg",     fotograf: "Daniel Jacobsen", staaende: false, fokus: [62, 55] },
  { fil: "seniorbrosjyre-2026.jpg",          fotograf: "Daniel Jacobsen", staaende: true,  fokus: [55, 62] },
  { fil: "femundsmarka-turlederkurs-1.jpg",  fotograf: "Marius Dalseg",   staaende: false, fokus: [60, 60] },
  { fil: "femundsmarka-turlederkurs-2.jpg",  fotograf: "Marius Dalseg",   staaende: false, fokus: [72, 40] },
  { fil: "ostmarka.jpg",                     fotograf: "Marius Dalseg",   staaende: false, fokus: [60, 70] },
  { fil: "huldreheim.jpg",                   fotograf: "Marius Dalseg",   staaende: false, fokus: [55, 60] },
  { fil: "bovelstad.jpg",                    fotograf: "Marius Dalseg",   staaende: false, fokus: [42, 65] },
  { fil: "losbyvassdraget.jpg",              fotograf: "Marius Dalseg",   staaende: false, fokus: [65, 66] },
  { fil: "skog-liggende.jpg",                fotograf: null,              staaende: false, fokus: [50, 50] },
  { fil: "sti-staaende.jpg",                 fotograf: null,              staaende: true,  fokus: [45, 50] },
  // Lagt til 11. september 2026
  { fil: "vettakollen-utsikt.jpg",           fotograf: "Daniel Jacobsen", staaende: false, fokus: [40, 55] },
  { fil: "vettakollen-to.jpg",               fotograf: "Daniel Jacobsen", staaende: false, fokus: [50, 50] },
  { fil: "vettakollen-par.jpg",              fotograf: "Daniel Jacobsen", staaende: false, fokus: [55, 55] },
  { fil: "gressholmen.jpg",                  fotograf: "Daniel Jacobsen", staaende: false, fokus: [45, 50] },
  { fil: "kobberhaughytta-stue.jpg",         fotograf: "Daniel Jacobsen", staaende: false, fokus: [50, 60] },
  { fil: "myrsetra-skog.jpg",                fotograf: "Daniel Jacobsen", staaende: false, fokus: [42, 60] },
  { fil: "fjorden-par.jpg",                  fotograf: "Daniel Jacobsen", staaende: false, fokus: [62, 65] },
  { fil: "liastua-utsikt.jpg",               fotograf: "Daniel Jacobsen", staaende: false, fokus: [22, 60] },
  { fil: "turbotur-liastua.jpg",             fotograf: "Daniel Jacobsen", staaende: false, fokus: [50, 55] },
  { fil: "ulsrudvann.jpg",                   fotograf: "Daniel Jacobsen", staaende: false, fokus: [42, 62] },
  { fil: "vannhuset.jpg",                    fotograf: "Daniel Jacobsen", staaende: false, fokus: [52, 55] },
  // Stående beskjæringer av liggende foto, så de stående oppsettene får variasjon
  { fil: "vettakollen-utsikt-staaende.jpg",  fotograf: "Daniel Jacobsen", staaende: true,  fokus: [55, 55] },
  { fil: "myrsetra-skog-staaende.jpg",       fotograf: "Daniel Jacobsen", staaende: true,  fokus: [40, 70] },
  { fil: "ulsrudvann-staaende.jpg",          fotograf: "Daniel Jacobsen", staaende: true,  fokus: [45, 75] }
];
export var EKSEMPELNOKKEL = "dnt-ukens-turer-eksempel";
export var LOGO = "assets/img/dnt-logo.png";
export var TURBO = "assets/img/turbo.png";

export var MANEDER = ["JANUAR", "FEBRUAR", "MARS", "APRIL", "MAI", "JUNI", "JULI", "AUGUST", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
