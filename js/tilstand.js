/* Tilstanden (state) og standardskjemaet med eksempeltekst. state er ett
   objekt som endres felt for felt, aldri byttes ut, så alle moduler ser det samme. */
import { MANEDER, SESONG_FELT } from "./konstanter.js";

export function nyTur(dag, dato, tid, tittel, sted) {
  return { dag: dag || "TIR", dato: dato || "", tid: tid || "", tittel: tittel || "", sted: sted || "",
           turleder: "", varighet: "", grad: "", pamelding: false };
}

// x og y er null til brukeren flytter bildet selv, og da følger utsnittet bildets
// fokuspunkt (se bakgrunn()). Zoom starter på 100 %, så hele komposisjonen er med
// og bildet ikke forstørres mer enn flaten krever (16. oktober 2026, før 115 %).
export function nyttUtsnitt() {
  return { feed: { x: null, y: null, z: 100 }, story: { x: null, y: null, z: 100 }, karusell: { x: null, y: null, z: 100 } };
}

// ISO-ukenummer, slik at «UKE 38, SEPTEMBER» stemmer med dagens dato.
// Ingen midtprikk som skilletegn (15. oktober 2026), den så KI-generert ut.
function gjeldendePeriode() {
  var d = new Date();
  var dato = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  var dag = dato.getUTCDay() || 7;
  dato.setUTCDate(dato.getUTCDate() + 4 - dag);
  var aarStart = new Date(Date.UTC(dato.getUTCFullYear(), 0, 1));
  var uke = Math.ceil(((dato - aarStart) / 86400000 + 1) / 7);
  return "UKE " + uke + ", " + MANEDER[d.getMonth()];
}

// Eksempeltekst for sesong og booking. Avhenger av type og hytte (e-post).
// Alle typene fyller alle feltene, så et typebytte tømmer det forrige eksempelet.
export function sesongPreset(type, h) {
  var epost = h && h.epost ? h.epost : "Bestilling på e-post";
  var bestill = "hyttebestilling.dnt.no";
  var p = {
    apner: {
      sesongMerke: "Vintersesongen",
      sesongTittel: "Vi åpner 26. februar",
      sesongUnder: "Velkommen til fjells",
      sesongTekst: "Vi gleder oss til å ta imot deg igjen. Husk å bestille i god tid.",
      sesongFakta1: "26. februar til 2. mai", sesongFakta2: bestill
    },
    booking: {
      sesongMerke: "Påsken 2027",
      // Uten dato i tittelen (16. oktober 2026). Datoen står i datofeltet, ellers står den dobbelt.
      sesongTittel: "Booking åpner",
      sesongUnder: "",
      sesongTekst: "Send oss ønsket periode, antall personer og kontaktinformasjon, så bekrefter vi og sender lenke til betaling.",
      sesongFakta1: "19. til 28. mars", sesongFakta2: epost,
      sesongDag: "Torsdag", sesongDato: "15", sesongMaaned: "oktober"
    },
    ledig: {
      sesongMerke: "Påsken 2027",
      sesongTittel: "Ledige senger i påsken",
      sesongUnder: "Det er fortsatt plass til deg",
      sesongTekst: "", sesongFakta1: "25. til 29. mars", sesongFakta2: bestill
    },
    takk: {
      sesongMerke: "Takk for sesongen",
      sesongTittel: "Vi ses igjen 5. mars",
      sesongUnder: "Tusen takk til alle som tok turen til oss i sommer",
      sesongTekst: "", sesongFakta1: "5. mars", sesongFakta2: bestill
    },
    soker: {
      sesongMerke: "Ledig stilling",
      sesongTittel: "Vil du jobbe hos oss?",
      sesongUnder: "Vi søker sesongansatte til sommeren",
      sesongTekst: "Vi trenger folk på kjøkkenet, i resepsjonen og til renhold.",
      sesongFakta1: "1. mai", sesongFakta2: epost
    }
  }[type] || {};
  var ut = {};
  SESONG_FELT.forEach(function (k) { ut[k] = p[k] || ""; });
  return ut;
}

function menyPreset() {
  return {
    menyMerke: "Dagens middag",
    menyTittel: "Egenfisket aure",
    menyUnder: "Fra vannene rett ved hytta",
    menyLinjer: "Rømmesaus og agurksalat\nNypoteter med dill\nMultekrem til dessert",
    menyTid: "Kl. 19.00 i spisesalen",
    menyPris: ""
  };
}

// Det som lagres i nettleseren og nullstilles av «Tøm skjemaet».
export function standardSkjema() {
  return Object.assign({
    avsender: "turlag",
    hytte: "",
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
    karusellUnder: "",
    karusellInfo: "",
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
    // Tomt til turlaget skriver inn navnet. Før 16. oktober 2026 sto «Fyll inn turlag»
    // her, og den havnet i bildet og filnavnet når ingen byttet den ut.
    turlag: "",
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
  }, sesongPreset("booking", null), menyPreset());
}

export var state = Object.assign(standardSkjema(), {
  bilde: "",
  bildeStaaende: "",
  eksempel: { liggende: null, staaende: null },
  egetBilde: false,
  bildenavn: "Ingen fil valgt, bruker et eksempelbilde fra DNT",
  postVariant: 0,
  karusellSide: 0,
  delingsFiler: null,
  laster: false
});
