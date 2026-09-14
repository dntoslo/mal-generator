/* =========================================================
   Malgenerator for turkalender (DNT Oslo og Omegn)
   Ren JavaScript uten byggesteg. Én tilstand, to renderfunksjoner:
   renderSkjema() oppdaterer venstre kolonne, renderPlakat() bygger
   plakaten i høyre kolonne. Eksport skjer med html2canvas fra en
   skjult 1:1-klone av plakaten.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Konstanter ---------- */

  var LAGRINGSNOKKEL = "dnt-ukens-turer-v1";
  var MAKS_TURER = 8;

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
  var TEKST = {
    normal: {
      chip: [116, 106, 96, 88], chipSmal: [100, 94, 88, 84],
      dag: [22, 21, 20, 20], dato: [44, 40, 36, 34], datoSmal: [40, 37, 34, 32],
      title: [34, 31, 28, 26], titleSmal: [31, 29, 27, 25],
      meta: [26, 25, 24, 24], detalj: 24, tid: [36, 33, 30, 28]
    },
    stor: {
      chip: [136, 124, 110, 98], chipSmal: [118, 110, 100, 92],
      dag: [26, 24, 23, 21], dato: [54, 48, 43, 38], datoSmal: [48, 44, 40, 36],
      title: [44, 39, 34, 30], titleSmal: [39, 35, 31, 28],
      meta: [32, 30, 27, 25], detalj: 26, tid: [46, 41, 36, 32]
    }
  };

  var FORMATER = {
    feed:     { bredde: 1080, hoyde: 1350, tekst: "1080 × 1350 px" },
    story:    { bredde: 1080, hoyde: 1920, tekst: "1080 × 1920 px" },
    liggende: { bredde: 1920, hoyde: 1080, tekst: "1920 × 1080 px" }  // bare arrangement
  };

  // Malene. Turkalender er den opprinnelige, arrangement kom til 11. september 2026.
  var MALVALG = {
    turkalender: { hjelp: "Flere turer i én liste, for uka eller måneden." },
    arrangement: { hjelp: "Ett arrangement: tur, kurs eller dugnad. Kan også eksporteres liggende." }
  };

  var ARR_OPPSETT = {
    foto:  { tekst: "Fotoet fyller flaten, teksten ligger nederst.", prompt: "foto som fyller hele flaten med mørk gradient nederst, og all tekst i hvitt nede til venstre: et kvadratisk datofelt (rødt dagbånd øverst, stor dato og måned under), tittel, undertittel, og informasjon i to kolonner med små etiketter." },
    kort:  { tekst: "Foto øverst, teksten på beige flate under.", prompt: "foto øverst (til venstre i liggende), og all tekst på lys beige flate: datofelt ved siden av tittelen, undertittel, informasjon i to kolonner med små etiketter, og kort tekst." },
    flate: { tekst: "Bare tekst på beige. For deg uten godt foto.", prompt: "ingen foto, lys beige flate med en tynn rød linje øverst, datofelt ved siden av tittelen, undertittel, informasjon i to kolonner og kort tekst." }
  };

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

  var OPPSETT = {
    topp:     { tekst: "Bildet som bånd øverst. Mest plass til turene.", maks: { feed: 8, story: 8 },
                prompt: "foto med mørk gradient øverst med overskriften over, turlagsnavnet over den og uke/måned nederst i fotoet. Deretter én rad per tur som veksler mellom hvit og beige bakgrunn, med et kvadratisk datofelt (rødt dagbånd med TIR/ONS osv. øverst, dato under), turmål, startsted, og klokkeslettet i rødt til høyre." },
    stort:    { tekst: "Dobbelt så høyt bilde, turene i et hvitt kort.", maks: { feed: 5, story: 7 },
                prompt: "stort foto som fyller øvre del med overskriften i hvitt, og turene samlet i et hvitt kort med runde hjørner nederst. Hver tur har et kvadratisk datofelt (rødt dagbånd øverst, dato under), turmål, startsted og klokkeslett i rødt til høyre." },
    side:     { tekst: "Stående bilde i høyre kolonne. Passer stående bilder.", maks: { feed: 7, story: 8 },
                prompt: "stående foto i en kolonne til høyre, og til venstre uke/måned i rødt, overskriften i sort, turlagsnavnet under, og deretter turene som liste med kvadratisk datofelt (rødt dagbånd øverst, dato under), turmål og startsted med klokkeslett." },
    bakgrunn: { tekst: "Bildet fyller hele flaten. Flottest, men strengest på plass.", maks: { feed: 7, story: 8 },
                prompt: "foto som fyller hele flaten med mørk gradient, overskriften i hvitt øverst, og turene samlet i et hvitt kort med runde hjørner nederst. Hver tur har et kvadratisk datofelt (rødt dagbånd øverst, dato under), turmål, startsted og klokkeslett i rødt til høyre." }
  };

  // Eksempelbilder som vises når ingen laster opp eget foto. Ett liggende og
  // ett stående trekkes tilfeldig ved hver åpning, aldri samme to ganger på rad.
  // Legg til et bilde: legg filen i assets/img/eksempler/ og én linje her.
  // Alle er ekte foto med kjent rettighetshaver. Ingen KI-genererte bilder.
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
  var T_IKON = "assets/img/dnt-t-ikon.png";

  var MANEDER = ["JANUAR", "FEBRUAR", "MARS", "APRIL", "MAI", "JUNI", "JULI", "AUGUST", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];

  /* ---------- Tilstand ---------- */

  function nyTur(dag, dato, tid, tittel, sted) {
    return { dag: dag || "TIR", dato: dato || "", tid: tid || "", tittel: tittel || "", sted: sted || "",
             turleder: "", varighet: "", grad: "", pamelding: false };
  }

  function nyttUtsnitt() {
    return { feed: { x: 50, y: 50, z: 115 }, story: { x: 50, y: 50, z: 115 }, liggende: { x: 50, y: 50, z: 115 } };
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

  // Det som lagres i nettleseren og nullstilles av «Tøm skjemaet».
  function standardSkjema() {
    return {
      mal: "turkalender",
      arrType: "arrangement",
      arrOppsett: "foto",
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
    };
  }

  var state = Object.assign(standardSkjema(), {
    bilde: "",
    bildeStaaende: "",
    eksempel: { liggende: null, staaende: null },
    egetBilde: false,
    bildenavn: "Ingen fil valgt, bruker et eksempelbilde fra DNT",
    visPrompt: false,
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

  function synligeTurer() {
    return state.turer.filter(function (t) {
      return (t.tittel || "").trim() || (t.sted || "").trim() || (t.dato || "").trim();
    });
  }

  function detaljerFor(t) {
    return [t.turleder ? "Turleder " + t.turleder : "", t.varighet].filter(Boolean).join(" · ");
  }

  /* ---------- Eksempelbilder ---------- */

  // Trekker ett liggende og ett stående eksempelbilde. Forrige trekk huskes i
  // nettleseren og unngås, så det aldri blir samme bilde to ganger på rad.
  function trekkEksempelbilder() {
    var forrige = {};
    try { forrige = JSON.parse(localStorage.getItem(EKSEMPELNOKKEL) || "{}") || {}; } catch (e) { /* ignorer */ }
    function trekk(staaende) {
      var kandidater = EKSEMPELBILDER.filter(function (b) { return b.staaende === staaende; });
      var uten = kandidater.filter(function (b) { return b.fil !== forrige[staaende ? "staaende" : "liggende"]; });
      var liste = uten.length ? uten : kandidater;
      return liste[Math.floor(Math.random() * liste.length)] || null;
    }
    var valg = { liggende: trekk(false), staaende: trekk(true) };
    try {
      localStorage.setItem(EKSEMPELNOKKEL, JSON.stringify({
        liggende: valg.liggende && valg.liggende.fil, staaende: valg.staaende && valg.staaende.fil
      }));
    } catch (e) { /* ignorer */ }
    return valg;
  }

  function brukEksempelbilder() {
    var valg = trekkEksempelbilder();
    return {
      eksempel: valg,
      bilde: valg.liggende ? EKSEMPELMAPPE + valg.liggende.fil : "",
      bildeStaaende: valg.staaende ? EKSEMPELMAPPE + valg.staaende.fil : "",
      egetBilde: false,
      bildenavn: "Ingen fil valgt, bruker et eksempelbilde fra DNT",
      utsnitt: nyttUtsnitt()
    };
  }

  /* ---------- Lokal lagring ---------- */

  var lagreTimer = null;
  function lagre() {
    clearTimeout(lagreTimer);
    lagreTimer = setTimeout(function () {
      try {
        var data = {
          mal: state.mal, arrType: state.arrType, arrOppsett: state.arrOppsett,
          oppsett: state.oppsett, format: state.format, tekst: state.tekst,
          tittel: state.tittel, turlag: state.turlag, lenke: state.lenke, periode: state.periode,
          visLogo: state.visLogo, visBand: state.visBand, visTurbo: state.visTurbo, kortGlass: state.kortGlass, utsnitt: state.utsnitt, turer: state.turer
        };
        ARR_FELT.forEach(function (k) { data[k] = state[k]; });
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
      if (MALVALG[d.mal]) state.mal = d.mal;
      if (ARR_TYPER[d.arrType]) state.arrType = d.arrType;
      if (ARR_OPPSETT[d.arrOppsett]) state.arrOppsett = d.arrOppsett;
      ARR_FELT.forEach(function (k) { if (typeof d[k] === "string") state[k] = d[k]; });
      if (OPPSETT[d.oppsett]) state.oppsett = d.oppsett;
      if (FORMATER[d.format]) state.format = d.format;
      if (state.mal === "turkalender" && state.format === "liggende") state.format = "feed";
      if (TEKST[d.tekst]) state.tekst = d.tekst;
      ["tittel", "turlag", "lenke", "periode"].forEach(function (k) {
        if (typeof d[k] === "string") state[k] = d[k];
      });
      if (state.lenke === "Fyll inn lenke til turkalender" || state.lenke === "Fyll inn nettadresse, f.eks. dnt.no/oslo") state.lenke = standardSkjema().lenke;
      if (typeof d.visLogo === "boolean") state.visLogo = d.visLogo;
      if (typeof d.visBand === "boolean") state.visBand = d.visBand;
      if (typeof d.visTurbo === "boolean") state.visTurbo = d.visTurbo;
      if (typeof d.kortGlass === "boolean") state.kortGlass = d.kortGlass;
      if (d.utsnitt && typeof d.utsnitt === "object") {
        var u = nyttUtsnitt();
        Object.keys(u).forEach(function (f) {
          if (d.utsnitt[f]) u[f] = Object.assign(u[f], d.utsnitt[f]);
        });
        state.utsnitt = u;
      }
      if (Array.isArray(d.turer)) {
        state.turer = d.turer.slice(0, MAKS_TURER).map(function (t) {
          return Object.assign(nyTur(), t || {});
        });
      }
    } catch (e) { /* ugyldig lagret data ignoreres */ }
  }

  function tomLagring() {
    try { localStorage.removeItem(LAGRINGSNOKKEL); } catch (e) { /* ignorer */ }
  }

  /* ---------- Beregninger (uendret logikk fra prototypen) ---------- */

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

  function beregn() {
    return state.mal === "arrangement" ? beregnArrangement() : beregnTurkalender();
  }

  // Arrangementsplakaten: ett arrangement, tre oppsett, fire formater.
  function beregnArrangement() {
    var s = state;
    var fmt = FORMATER[s.format];
    var opp = ARR_OPPSETT[s.arrOppsett];
    var liggende = s.format === "liggende";
    var stor = s.tekst === "stor";
    var k = stor ? 1.12 : 1;
    var pad = liggende ? 80 : 64;
    // Båndet nederst er valgfritt. Høyden brukes bare her og som --band-h i CSS.
    var band = state.visBand ? 88 : 0;

    // Fotoflaten avhenger av oppsett og format.
    var fotoH = s.format === "story" ? 1080 : 620;
    var fotoB = 900;
    var flate = s.arrOppsett === "flate";
    var fotoFlate = s.arrOppsett === "foto" ? [fmt.bredde, fmt.hoyde]
      : s.arrOppsett === "kort" ? (liggende ? [fotoB, fmt.hoyde - band] : [fmt.bredde, fotoH])
      : null;
    var u = s.utsnitt[s.format];
    var bilde = fotoFlate ? kildeBilde(fotoFlate[0], fotoFlate[1]) : "";
    var bg = fotoFlate ? bakgrunn(bilde, fotoFlate[0], fotoFlate[1], u) : { bgStr: "cover", bgPos: "50% 50%" };

    // Bredden teksten har til rådighet, og største tittelstørrelse.
    var tekstBredde = liggende
      ? (s.arrOppsett === "foto" ? 1180 - pad : (s.arrOppsett === "kort" ? fmt.bredde - fotoB - 2 * pad : 820))
      : fmt.bredde - 2 * pad;
    var chip = Math.round((liggende ? 190 : 168) * (stor ? 1.08 : 1));
    // «Uten foto» har god plass, så tittelen og teksten får være litt større der.
    var tittelMaks = liggende ? (s.arrOppsett === "kort" ? 100 : 120) : (flate ? 116 : 104);
    if (flate && !liggende) k *= 1.08;
    if (liggende) k *= 1.08;
    // I «kort» og «flate» står tittelen ved siden av datofeltet, så bredden er mindre.
    // I liggende «uten foto» står datofeltet over tittelen, så tittelen får hele kolonnen.
    var tittelBredde = (s.arrOppsett === "foto" || (flate && liggende)) ? tekstBredde : tekstBredde - chip - 36;
    var tittel = tilpassStorrelse(s.arrTittel, '700 {px}px "Romek"', -0.03, tittelBredde, tittelMaks, 60);

    var info = ARR_INFO.filter(function (par) {
      var verdi = (s[par[0]] || "").trim();
      if (!verdi) return false;
      // Feltene som ikke hører til typen skjules, selv om de har innhold fra før.
      var felt = par[0];
      if (felt === "arrPris" || felt === "arrFrist") return s.arrType === "kurs";
      if (felt === "arrTaMed" || felt === "arrServering") return s.arrType === "dugnad";
      if (felt === "arrPasserFor") return s.arrType !== "dugnad";
      return true;
    }).map(function (par) { return { etikett: par[1], verdi: s[par[0]].trim() }; });

    return {
      mal: "arrangement", fmt: fmt, opp: opp, u: u, stor: stor, forMange: false, synlige: [], maks: 0,
      bilde: bilde,
      eksempel: fotoFlate ? aktivtEksempel(fotoFlate[0], fotoFlate[1]) : null,
      harFoto: Boolean(fotoFlate),
      liggende: liggende,
      tittelBryt: tittel.bryt,
      info: info,
      vars: {
        "--bredde": fmt.bredde + "px", "--hoyde": fmt.hoyde + "px",
        "--a-pad": pad + "px", "--a-chip": chip + "px",
        "--a-dag-size": Math.round((liggende ? 26 : 24) * k) + "px",
        "--a-dato-size": Math.round((liggende ? 88 : 78) * k) + "px",
        "--a-maaned-size": Math.round(20 * k) + "px",
        "--a-tittel-size": tittel.px + "px",
        "--a-under-size": Math.round((liggende ? 36 : 34) * k) + "px",
        "--a-etikett-size": Math.round((liggende ? 23 : 22) * k) + "px",
        "--a-verdi-size": Math.round((liggende ? 31 : 30) * k) + "px",
        "--a-tekst-size": Math.round((liggende ? 31 : 30) * k) + "px",
        "--a-foto-h": fotoH + "px", "--a-foto-b": fotoB + "px",
        "--turbo-h": (liggende ? 240 : 200) + "px", "--band-h": band + "px",
        "--bg-str": bg.bgStr, "--bg-pos": bg.bgPos
      }
    };
  }

  function beregnTurkalender() {
    var s = state;
    var fmt = FORMATER[s.format];
    var opp = OPPSETT[s.oppsett];
    var synlige = synligeTurer();
    var n = Math.max(synlige.length, 1);
    var stor = s.tekst === "stor";
    var T = stor ? TEKST.stor : TEKST.normal;
    var maks = Math.max(opp.maks[s.format] - (stor ? 1 : 0), 3);
    var harDetaljer = s.turer.some(function (t) { return t.turleder || t.varighet || t.grad || t.pamelding; });
    var romslig = s.format === "story";
    var kompakt = s.oppsett !== "topp";
    var trinn = n <= 4 ? 0 : (n === 5 ? 1 : (n === 6 ? 2 : 3));
    if (harDetaljer) trinn = Math.min(trinn + 1, 3);
    if (kompakt && n > 4) trinn = Math.min(trinn + 1, 3);
    if (romslig) trinn = Math.max(trinn - 1, 0);

    var stortH = s.format === "story" ? 1180 : 760;
    var heroH = s.format === "story" ? 780 : 330;
    var sideBredde = 400;
    var band = state.visBand ? 88 : 0;

    var fotoFlate = s.oppsett === "topp" ? [fmt.bredde, heroH]
      : s.oppsett === "stort" ? [fmt.bredde, stortH]
      : s.oppsett === "side" ? [sideBredde, fmt.hoyde - band]
      : [fmt.bredde, fmt.hoyde];
    var u = s.utsnitt[s.format];
    var bilde = kildeBilde(fotoFlate[0], fotoFlate[1]);
    var bg = bakgrunn(bilde, fotoFlate[0], fotoFlate[1], u);

    // Tittel og overlinje skal helst stå på én linje. 170 px er reservert til
    // logoen uansett om den vises, så layouten ikke hopper.
    var ROMEK = '700 {px}px "Romek"', SOCIAL_EXT = '500 {px}px "ABC Social Extended"';
    var tittelHero = tilpassStorrelse(s.tittel, ROMEK, -0.03, fmt.bredde - 56 - 170, 92, 56);
    var tittelSide = tilpassStorrelse(s.tittel, ROMEK, -0.03, fmt.bredde - sideBredde - 56 - 40, 82, 52);
    var overlinje = tilpassStorrelse((s.turlag || "").toUpperCase() + " · " + s.periode, SOCIAL_EXT, 0.18, fmt.bredde - 56 - 170, 24, 18);

    return {
      mal: "turkalender", harFoto: true,
      fmt: fmt, opp: opp, synlige: synlige, maks: maks, stor: stor, trinn: trinn, u: u,
      forMange: synlige.length > maks,
      bilde: bilde,
      eksempel: aktivtEksempel(fotoFlate[0], fotoFlate[1]),
      tittelBryt: tittelHero.bryt,
      tittelSideBryt: tittelSide.bryt,
      vars: {
        "--bredde": fmt.bredde + "px", "--hoyde": fmt.hoyde + "px",
        "--hero-h": heroH + "px", "--stort-h": stortH + "px", "--side-bredde": sideBredde + "px",
        "--chip": T.chip[trinn] + "px", "--chip-smal": T.chipSmal[trinn] + "px",
        "--dag-size": T.dag[trinn] + "px", "--dato-size": T.dato[trinn] + "px", "--dato-size-smal": T.datoSmal[trinn] + "px",
        "--title-size": T.title[trinn] + "px", "--title-size-smal": T.titleSmal[trinn] + "px",
        "--meta-size": T.meta[trinn] + "px", "--detalj-size": T.detalj + "px", "--tid-size": T.tid[trinn] + "px",
        "--kort-gap": [20, 16, 13, 11][trinn] + "px", "--kort-pad": "32px",
        "--bg-str": bg.bgStr, "--bg-pos": bg.bgPos,
        "--tittel-size": tittelHero.px + "px", "--tittel-size-side": tittelSide.px + "px",
        "--overlinje-size": overlinje.px + "px",
        "--turbo-h": "200px", "--band-h": band + "px"
      }
    };
  }

  /* ---------- Plakatmaler ---------- */

  function malRad(t, visTid, stedOgTid) {
    var detaljer = detaljerFor(t);
    var harDetaljer = Boolean(detaljer || t.grad || t.pamelding);
    var sted = stedOgTid ? [t.sted, t.tid ? "kl. " + t.tid : ""].filter(Boolean).join(" · ") : t.sted;
    var html = '<div class="p-rad">' +
      '<div class="p-chip"><div class="p-chip__dag">' + esc(t.dag) + '</div><div class="p-chip__dato">' + esc(t.dato) + '</div></div>' +
      '<div class="p-info">' +
        '<div class="p-info__tittel">' + esc(t.tittel) + '</div>' +
        '<div class="p-info__sted">' + esc(sted) + '</div>';
    if (harDetaljer) {
      html += '<div class="p-detaljer">';
      if (detaljer) html += '<span class="p-detaljer__tekst">' + esc(detaljer) + '</span>';
      if (t.grad) html += '<span class="p-grad" style="color:' + (GRAD[t.grad] || "#0F0F0F") + '"><span class="p-grad__prikk"></span><span>' + esc(t.grad) + '</span></span>';
      if (t.pamelding) html += '<span class="p-pamelding">Påmelding</span>';
      html += '</div>';
    }
    html += '</div>';
    if (visTid) html += '<div class="p-tid">' + esc(t.tid) + '</div>';
    return html + '</div>';
  }

  // Den runde T-en kan skrus av, uavhengig av båndet nederst.
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
  function malBunn(klasse) {
    if (!state.visBand) return "";
    return '<div class="p-bunn ' + (klasse || "") + '"><img src="' + T_IKON + '" alt=""><span>' + esc(state.lenke) + '</span></div>';
  }

  var MALER = {
    topp: function (b) {
      return '<div class="p-flate">' +
        '<div class="p-hero">' +
          '<div class="p-foto" data-foto></div><div class="p-scrim p-scrim--topp"></div>' +
          '<div class="p-hero__tekst"><span class="p-overlinje p-overlinje--topp">' + esc(state.turlag.toUpperCase()) + '</span><span class="p-tittel' + (b.tittelBryt ? " p-tittel--bryt" : "") + '">' + esc(state.tittel) + '</span></div>' +
          malLogo() + malTurbo("p-turbo--hero") +
          '<div class="p-periode">' + esc(state.periode) + '</div>' +
        '</div>' +
        '<div class="p-rader">' + b.synlige.map(function (t) { return malRad(t, true, false); }).join("") + '</div>' +
        malBunn() +
      '</div>';
    },
    stort: function (b) {
      return '<div class="p-flate">' +
        '<div class="p-hero p-hero--stort">' +
          '<div class="p-foto" data-foto></div><div class="p-scrim p-scrim--stort"></div>' +
          '<div class="p-hero__tekst"><span class="p-overlinje">' + esc(state.turlag.toUpperCase()) + ' · ' + esc(state.periode) + '</span><span class="p-tittel' + (b.tittelBryt ? " p-tittel--bryt" : "") + '">' + esc(state.tittel) + '</span></div>' +
          malLogo() + malTurbo("p-turbo--underlogo") +
        '</div>' +
        '<div class="p-kort' + (state.kortGlass ? " p-kort--glass" : "") + '">' +
          '<div class="p-kort__liste">' + b.synlige.map(function (t) { return malRad(t, true, false); }).join("") + '</div>' +
          malBunn("p-bunn--kort") +
        '</div>' +
      '</div>';
    },
    side: function (b) {
      return '<div class="p-flate">' +
        '<div class="p-side__innhold">' +
          '<div class="p-side__tekst">' +
            '<div class="p-side__topp"><span class="p-side__periode">' + esc(state.periode) + '</span><span class="p-side__tittel' + (b.tittelSideBryt ? " p-side__tittel--bryt" : "") + '">' + esc(state.tittel) + '</span><span class="p-side__turlag">' + esc(state.turlag) + '</span></div>' +
            '<div class="p-side__liste">' + b.synlige.map(function (t) { return malRad(t, false, true); }).join("") + '</div>' +
          '</div>' +
          '<div class="p-side__foto"><div class="p-foto" data-foto></div><div class="p-scrim p-scrim--side"></div>' + malLogo("p-logo--liten") + malTurbo("p-turbo--side") + '</div>' +
        '</div>' +
        malBunn("p-bunn--side") +
      '</div>';
    },
    bakgrunn: function (b) {
      return '<div class="p-flate p-flate--bakgrunn">' +
        '<div class="p-foto p-foto--fyll" data-foto></div><div class="p-scrim p-scrim--bakgrunn"></div>' +
        '<div class="p-hero__tekst p-hero__tekst--lav"><span class="p-overlinje">' + esc(state.turlag.toUpperCase()) + ' · ' + esc(state.periode) + '</span><span class="p-tittel' + (b.tittelBryt ? " p-tittel--bryt" : "") + '">' + esc(state.tittel) + '</span></div>' +
        malLogo("p-logo--lav") + malTurbo("p-turbo--underlogo") +
        '<div class="p-kort' + (state.kortGlass ? " p-kort--glass" : "") + '">' +
          '<div class="p-kort__liste p-kort__liste--bakgrunn">' + b.synlige.map(function (t) { return malRad(t, true, false); }).join("") + '</div>' +
          malBunn("p-bunn--tett") +
        '</div>' +
      '</div>';
    }
  };

  /* ---------- Plakatmaler: arrangement ---------- */

  function malArrChip() {
    return '<div class="a-chip">' +
      '<div class="a-chip__dag">' + esc(state.arrDag) + '</div>' +
      '<div class="a-chip__dato"><span class="a-chip__tall">' + esc(state.arrDato) + '</span><span class="a-chip__maaned">' + esc(state.arrMaaned) + '</span></div>' +
    '</div>';
  }

  function malArrTittel(b) {
    return '<div class="a-tittel' + (b.tittelBryt ? " a-tittel--bryt" : "") + '">' + esc(state.arrTittel) + '</div>' +
      (state.arrUnder ? '<div class="a-under">' + esc(state.arrUnder) + '</div>' : "");
  }

  function malArrInfo(b) {
    if (!b.info.length) return "";
    return '<div class="a-info">' + b.info.map(function (r) {
      return '<div class="a-info__rad"><span class="a-info__etikett">' + esc(r.etikett) + '</span><span class="a-info__verdi">' + esc(r.verdi) + '</span></div>';
    }).join("") + '</div>';
  }

  function malArrTekst() {
    return state.arrTekst ? '<div class="a-tekst">' + esc(state.arrTekst) + '</div>' : "";
  }

  // Datofelt og tittel side om side, brukt i «kort» og «flate».
  function malArrTopp(b) {
    return '<div class="a-topp">' + malArrChip() + '<div class="a-topp__tekst">' + malArrTittel(b) + '</div></div>';
  }

  var MALER_ARR = {
    foto: function (b) {
      var klasse = "a-flate a-flate--foto" + (b.liggende ? " a-flate--liggende" : "");
      return '<div class="' + klasse + '">' +
        '<div class="a-foto a-foto--fyll"><div class="p-foto" data-foto></div><div class="a-scrim a-scrim--foto"></div></div>' +
        '<div class="a-overlinje">' + esc(state.turlag.toUpperCase()) + '</div>' +
        malLogo() + malTurbo("p-turbo--band") +
        '<div class="a-innhold a-innhold--paa-foto' + (state.visTurbo ? " a-innhold--turbo" : "") + '">' + malArrChip() + '<div>' + malArrTittel(b) + '</div>' + malArrInfo(b) + malArrTekst() + '</div>' +
        (state.visBand ? '<div style="position:absolute;left:0;right:0;bottom:0;">' + malBunn() + '</div>' : "") +
      '</div>';
    },
    kort: function (b) {
      var foto = '<div class="a-foto ' + (b.liggende ? "a-foto--venstre" : "a-foto--topp") + '">' +
        '<div class="p-foto" data-foto></div><div class="a-scrim ' + (b.liggende ? "a-scrim--venstre" : "a-scrim--topp") + '"></div>' +
        '<div class="a-overlinje">' + esc(state.turlag.toUpperCase()) + '</div>' + malLogo() + malTurbo("p-turbo--fotoflate") +
      '</div>';
      var innhold = '<div class="a-innhold a-innhold--fyll a-innhold--midt">' + malArrTopp(b) + malArrInfo(b) + malArrTekst() + '</div>';
      return '<div class="a-flate' + (b.liggende ? " a-flate--liggende" : "") + '">' +
        (b.liggende ? '<div class="a-rad">' + foto + innhold + '</div>' : foto + innhold) +
        malBunn() +
      '</div>';
    },
    flate: function (b) {
      var turbo = state.visTurbo ? " a-innhold--turbo" : "";
      var innhold = b.liggende
        ? '<div class="a-innhold a-innhold--fyll a-innhold--kolonner' + turbo + '">' +
            '<div class="a-kolonne a-kolonne--venstre">' + malArrTopp(b) + '</div>' +
            '<div class="a-kolonne a-kolonne--hoyre">' + malArrInfo(b) + malArrTekst() + '</div>' +
          '</div>'
        : '<div class="a-innhold a-innhold--fyll a-innhold--midt' + turbo + '">' + malArrTopp(b) + malArrInfo(b) + malArrTekst() + '</div>';
      return '<div class="a-flate' + (b.liggende ? " a-flate--liggende" : "") + '">' +
        '<div class="a-topplinje"></div>' + malTurbo("p-turbo--band") +
        '<div style="position:relative;flex:none;height:0;">' +
          '<div class="a-overlinje a-overlinje--sort">' + esc(state.turlag.toUpperCase()) + '</div>' + malLogo() +
        '</div>' +
        innhold +
        malBunn() +
      '</div>';
    }
  };

  /* ---------- Rendering ---------- */

  var el = {};
  function finnElementer() {
    el.plakat = $("#plakat"); el.skala = $("#plakat-skala"); el.ramme = $("#ramme");
    el.turliste = $("#turliste"); el.formange = $("#formange"); el.lastNed = $("#last-ned");
    el.nedlastingHjelp = $("#nedlasting-hjelp"); el.feil = $("#feil"); el.bildenavn = $("#bildenavn");
    el.promptBoks = $("#prompt-boks"); el.promptTekst = $("#prompt-tekst"); el.vekslePrompt = $("#veksle-prompt");
    el.kopierPrompt = $("#kopier-prompt");
    el.kreditering = $("#kreditering"); el.nyttEksempel = $("#nytt-eksempel");
  }

  function renderPlakat() {
    var b = beregn();
    var p = el.plakat;
    Object.keys(b.vars).forEach(function (k) { p.style.setProperty(k, b.vars[k]); });
    p.setAttribute("data-mal", state.mal);
    p.setAttribute("data-format", state.format);
    p.setAttribute("data-oppsett", b.mal === "arrangement" ? state.arrOppsett : state.oppsett);
    p.innerHTML = b.mal === "arrangement" ? MALER_ARR[state.arrOppsett](b) : MALER[state.oppsett](b);
    // Bildeadressen settes direkte på elementet, ikke via CSS-variabel,
    // så data-URL-er fra egne bilder alltid overlever.
    $$("[data-foto]", p).forEach(function (f) { f.style.backgroundImage = 'url("' + String(b.bilde).replace(/"/g, "%22") + '")'; });
    skalerForhandsvisning(b.fmt);
    if (b.mal === "arrangement") sjekkPlass(p);
  }

  // Arrangementsplakaten har ingen maksgrense som turkalenderen. I stedet måles
  // det om innholdet faktisk får plass, og brukeren advares hvis ikke.
  function sjekkPlass(p) {
    var innhold = $(".a-innhold", p);
    var trangt = false;
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
      // På foto ligger innholdet nederst og vokser oppover. Overlinjen slutter ved ca. 82 px.
      if (!trangt && innhold.classList.contains("a-innhold--paa-foto")) {
        trangt = innhold.offsetTop + (parseFloat(cs.paddingTop) || 0) < 96;
      }
    }
    el.formange.hidden = !trangt;
    if (trangt) el.formange.textContent = "Innholdet får ikke plass i dette formatet. Kort ned teksten, tøm et felt, eller bytt til Story eller Liggende.";
  }

  // Forhåndsvisningen er maks 540 px bred. På brede skjermer er den festet
  // (sticky) og krympes i tillegg så hele plakaten får plass i vinduet.
  function skalerForhandsvisning(fmt) {
    fmt = fmt || FORMATER[state.format];
    var kolonne = el.ramme.parentElement ? el.ramme.parentElement.clientWidth : 540;
    var skala = Math.min(540, kolonne || 540) / fmt.bredde;
    if (window.innerWidth >= 960) {
      var maksHoyde = window.innerHeight - 28 - 30 - 28;
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
    el.turliste.innerHTML = "";
    state.turer.forEach(function (t, i) {
      var rad = mal.content.firstElementChild.cloneNode(true);
      rad.setAttribute("data-index", i);
      $(".tur__nummer", rad).textContent = "TUR " + (i + 1);
      el.turliste.appendChild(rad);
    });
  }

  function renderTurliste(byggNy) {
    if (byggNy || el.turliste.children.length !== state.turer.length) byggTurliste();
    $$(".tur", el.turliste).forEach(function (rad, i) {
      var t = state.turer[i];
      $$("[data-felt]", rad).forEach(function (input) { settVerdi(input, t[input.getAttribute("data-felt")]); });
      $("[data-handling=opp]", rad).disabled = i === 0;
      $("[data-handling=ned]", rad).disabled = i === state.turer.length - 1;
    });
    $("#legg-til").disabled = state.turer.length >= MAKS_TURER;
  }

  function renderSkjema(byggTurlisteNy) {
    var b = beregn();

    $$("[data-gruppe]").forEach(function (gruppe) {
      var navn = gruppe.getAttribute("data-gruppe");
      $$("button", gruppe).forEach(function (kn) {
        var aktiv = kn.getAttribute("data-verdi") === state[navn];
        kn.classList.toggle("aktiv", aktiv);
        kn.setAttribute("aria-pressed", aktiv ? "true" : "false");
      });
    });

    var arr = state.mal === "arrangement";
    $$(".panel [data-mal]").forEach(function (e) { e.hidden = e.getAttribute("data-mal") !== state.mal; });
    $$("[data-kun-mal]").forEach(function (e) { e.hidden = e.getAttribute("data-kun-mal") !== state.mal; });
    $$("[data-arr-type]").forEach(function (e) { e.hidden = e.getAttribute("data-arr-type").split(" ").indexOf(state.arrType) < 0; });
    if ($("#mal-hjelp")) $("#mal-hjelp").textContent = MALVALG[state.mal].hjelp;
    if ($("#arr-oppsett-hjelp")) $("#arr-oppsett-hjelp").textContent = ARR_OPPSETT[state.arrOppsett].tekst;
    if ($("#arr-type-hjelp")) $("#arr-type-hjelp").textContent = ARR_TYPER[state.arrType].hjelp;
    if ($("#bilde-felt")) $("#bilde-felt").hidden = !b.harFoto;

    $("#format-hjelp").textContent = b.fmt.tekst;
    $("#tekst-hjelp").textContent = arr
      ? (b.stor ? "Stor tekst: litt større informasjon og brødtekst." : "Normal tekst: minste størrelse er 24 px, som er lesbart på mobil.")
      : (b.stor ? "Stor tekst: lettere å lese i feeden, men det blir plass til én tur mindre."
                : "Normal tekst: minste størrelse er 24 px, som er lesbart på mobil.");
    if (!arr) $("#oppsett-hjelp").textContent = b.opp.tekst + " Plass til " + b.maks + " turer i dette formatet.";
    el.bildenavn.textContent = state.bildenavn;
    el.nyttEksempel.hidden = state.egetBilde;
    if (state.egetBilde || !b.harFoto) {
      el.kreditering.hidden = true;
    } else {
      el.kreditering.hidden = false;
      el.kreditering.textContent = b.eksempel && b.eksempel.fotograf
        ? "Eksempelbildet er tatt av " + b.eksempel.fotograf + ". Husk å kreditere fotografen i posteteksten: Foto: " + b.eksempel.fotograf + "."
        : "Husk å kreditere fotografen i posteteksten når du bruker et eksempelbilde.";
    }

    $$("[data-utsnitt]").forEach(function (r) { settVerdi(r, b.u[r.getAttribute("data-utsnitt")]); });
    $$(".tekstfelt[data-felt]").forEach(function (f) {
      var k = f.getAttribute("data-felt");
      if (state[k] !== undefined) settVerdi(f, state[k]);
    });
    if ($("#vis-logo")) settVerdi($("#vis-logo"), state.visLogo);
    if ($("#vis-band")) settVerdi($("#vis-band"), state.visBand);
    if ($("#lenke-felt")) $("#lenke-felt").hidden = !state.visBand;
    if ($("#vis-turbo")) settVerdi($("#vis-turbo"), state.visTurbo);
    if ($("#kort-glass")) settVerdi($("#kort-glass"), state.kortGlass);
    if ($("#kort-glass-felt")) $("#kort-glass-felt").hidden = arr || !(state.oppsett === "stort" || state.oppsett === "bakgrunn");

    renderTurliste(byggTurlisteNy);

    if (!arr) {
      el.formange.hidden = !b.forMange;
      el.formange.textContent = b.synlige.length + " turer får ikke plass i dette oppsettet (maks " + b.maks +
        "). Velg «Bilde øverst», bytt til Story, eller del kalenderen i to bilder.";
    }

    el.lastNed.disabled = b.forMange || state.laster;
    el.lastNed.textContent = state.laster ? "Lager bildet …" : (b.forMange ? "For mange turer for dette oppsettet" : "Last ned bildet");
    el.nedlastingHjelp.textContent = "Bildet lagres i " + b.fmt.tekst + " og er klart til å legges rett ut.";

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

  /* ---------- Reserveprompt ---------- */

  function byggPrompt(b) {
    if (b.mal === "arrangement") return byggPromptArrangement(b);
    var turlag = (state.turlag || "").trim() || "turlaget";
    var linjer = b.synlige.map(function (t) {
      var deler = [];
      deler.push([t.dag, t.dato].filter(Boolean).join(" ") + (t.tid ? " kl. " + t.tid : "") + ": " + (t.tittel || "(turmål)"));
      if (t.sted) deler.push("Start: " + t.sted);
      if (t.turleder) deler.push("Turleder " + t.turleder);
      if (t.varighet) deler.push(t.varighet);
      if (t.grad) deler.push("Gradering: " + t.grad);
      if (t.pamelding) deler.push("Påmelding");
      return "- " + deler.join(". ");
    });
    if (!linjer.length) linjer.push("- (fyll inn dag, dato, klokkeslett, turmål og startsted per tur)");

    return "Du er designer for " + turlag + " i DNT Oslo og Omegn. Lag en grafikk til Facebook og Instagram i " +
      b.fmt.tekst + " med " + (state.tittel || "turkalender").toLowerCase() + ".\n\n" +
      "Profil som skal følges:\n" +
      "Farger: DNT-rød #D82D20, lys beige #F8F2E4 til bakgrunn, beige #F2E6D0 til radveksling, mørk beige #E8D7B6 til datofelt, hvit, sort tekst.\n" +
      "Fonter: Romek Bold til overskriften «" + state.tittel + "», ABC Social Extended Bold til turmål og klokkeslett, ABC Social til brødtekst.\n" +
      "Oppsett: " + b.opp.prompt + (state.visBand ? " Nederst et rødt bånd med nettadressen «" + state.lenke + "» i liten, medium skrift, mindre enn turmålene." : " Ingen bånd nederst.") +
      (state.visLogo ? " Rund DNT-logo (T i hvit sirkel) oppe til høyre i fotoet." : " Ingen logo i fotoet.") +
      (state.visTurbo ? " Turbo-figuren (Barnas Turlags maskot) nede til høyre i fotoet." : "") +
      (state.kortGlass && (state.oppsett === "stort" || state.oppsett === "bakgrunn") ? " Kortet er svakt gjennomskinnelig (88 % hvitt) så fotoet skinner gjennom." : "") + "\n" +
      "Minste tekststørrelse er 24 px, mange av deltakerne er seniorer.\n" +
      "Ingen KI-genererte bilder, ingen emoji. Bruk et ekte foto fra turlaget.\n\n" +
      state.tittel + " for " + turlag + ", " + state.periode + ":\n" + linjer.join("\n");
  }

  function byggPromptArrangement(b) {
    var turlag = (state.turlag || "").trim() || "turlaget";
    var linjer = [
      "Tittel: " + state.arrTittel,
      state.arrUnder ? "Undertittel: " + state.arrUnder : "",
      "Dato: " + [state.arrDag, state.arrDato + ".", state.arrMaaned].filter(Boolean).join(" ")
    ].concat(b.info.map(function (r) { return r.etikett + ": " + r.verdi; }))
     .concat(state.arrTekst ? ["Tekst: " + state.arrTekst] : []).filter(Boolean);

    return "Du er designer for " + turlag + " i DNT Oslo og Omegn. Lag en plakat til sosiale medier i " + b.fmt.tekst +
      " for ett arrangement.\n\n" +
      "Profil som skal følges:\n" +
      "Farger: DNT-rød #D82D20, lys beige #F8F2E4 til bakgrunn, hvit, sort tekst.\n" +
      "Fonter: Romek Bold til tittelen, ABC Social Extended til undertittel og etiketter, ABC Social til brødtekst.\n" +
      "Oppsett: " + b.opp.prompt + (state.visBand ? " Nederst et rødt bånd med nettadressen «" + state.lenke + "» i liten, medium skrift." : " Ingen bånd nederst.") +
      (state.visLogo && b.harFoto ? " Rund DNT-logo (T i hvit sirkel) oppe til høyre." : "") +
      (state.visTurbo ? " Turbo-figuren (Barnas Turlags maskot) nede til høyre." : "") + "\n" +
      "Minste tekststørrelse er 24 px, mange av deltakerne er seniorer.\n" +
      "Ingen KI-genererte bilder, ingen emoji. Bruk et ekte foto fra turlaget.\n\n" +
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
      var navn = b.mal === "arrangement" ? "arrangement-" + slug(state.arrTittel) : "turkalender-" + slug(state.turlag);
      lastNedBlob(blob, navn + "-" + state.format + ".png");
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

  function kobleHendelser() {
    // Knappegrupper: format, tekststørrelse, oppsett
    $$("[data-gruppe]").forEach(function (gruppe) {
      gruppe.addEventListener("click", function (e) {
        var kn = e.target.closest("button[data-verdi]");
        if (!kn) return;
        var patch = {}; patch[gruppe.getAttribute("data-gruppe")] = kn.getAttribute("data-verdi");
        // Liggende finnes bare for arrangement.
        if (patch.mal === "turkalender" && state.format === "liggende") patch.format = "feed";
        oppdater(patch);
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

    // Avkryssinger. Sjekkes for null, så en hurtigbufret index.html uten
    // elementene ikke stopper resten av oppstarten.
    if ($("#vis-logo")) $("#vis-logo").addEventListener("change", function (e) { oppdater({ visLogo: e.target.checked }); });
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

    // Turliste: skriving og valg
    function turHendelse(e) {
      var input = e.target.closest("[data-felt]");
      var rad = e.target.closest(".tur");
      if (!input || !rad) return;
      var i = Number(rad.getAttribute("data-index"));
      var felt = input.getAttribute("data-felt");
      var turer = state.turer.slice();
      turer[i] = Object.assign({}, turer[i]);
      turer[i][felt] = input.type === "checkbox" ? input.checked : input.value;
      oppdater({ turer: turer });
    }
    el.turliste.addEventListener("input", turHendelse);
    el.turliste.addEventListener("change", turHendelse);

    // Turliste: flytt og fjern
    el.turliste.addEventListener("click", function (e) {
      var kn = e.target.closest("button[data-handling]");
      var rad = e.target.closest(".tur");
      if (!kn || !rad) return;
      var i = Number(rad.getAttribute("data-index"));
      var turer = state.turer.slice();
      var handling = kn.getAttribute("data-handling");
      if (handling === "fjern") {
        turer.splice(i, 1);
      } else {
        var j = handling === "opp" ? i - 1 : i + 1;
        if (j < 0 || j >= turer.length) return;
        var t = turer[i]; turer[i] = turer[j]; turer[j] = t;
      }
      oppdater({ turer: turer }, { turliste: true });
    });

    $("#legg-til").addEventListener("click", function () {
      if (state.turer.length >= MAKS_TURER) return;
      oppdater({ turer: state.turer.concat([nyTur()]) }, { turliste: true });
      var siste = el.turliste.lastElementChild;
      if (siste) { var felt = $("[data-felt=tittel]", siste); if (felt) felt.focus(); }
    });

    // Nedlasting, tømming, prompt
    el.lastNed.addEventListener("click", lastNed);

    $("#tom-skjema").addEventListener("click", function () {
      if (!window.confirm("Vil du tømme skjemaet? Alle turer og tekster nullstilles til eksempelinnholdet.")) return;
      tomLagring();
      var mal = state.mal;
      Object.assign(state, standardSkjema(), brukEksempelbilder(), { mal: mal });
      $("#bilde-fil").value = "";
      visFeil("");
      render({ turliste: true, lagre: false });
    });

    el.vekslePrompt.addEventListener("click", function () { oppdater({ visPrompt: !state.visPrompt }, { lagre: false }); });

    el.kopierPrompt.addEventListener("click", function () {
      var tekst = el.promptTekst.value;
      var ferdig = function () {
        el.kopierPrompt.textContent = "Kopiert";
        setTimeout(function () { el.kopierPrompt.textContent = "Kopier prompten"; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(tekst).then(ferdig, function () { el.promptTekst.select(); });
      } else {
        el.promptTekst.select();
        try { document.execCommand("copy"); ferdig(); } catch (e) { /* brukeren kan kopiere manuelt */ }
      }
    });

    window.addEventListener("resize", function () { skalerForhandsvisning(); });
  }

  /* ---------- Oppstart ---------- */

  function start() {
    finnElementer();
    hent();
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
