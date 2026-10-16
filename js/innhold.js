/* Innholdet i enkeltmalene (arrangement, turtips, sesong og meny) og
   signaturen på Postkort-nivå. */
import { avsenderMeta, avsenderMetaLinjer, avsenderNavn, datoTekst } from "./hjelpere.js";
import { ARR_INFO, GRAD, SESONG_TYPER, TIPS_INFO } from "./konstanter.js";
import { state } from "./tilstand.js";

// Et tekstfelt fra skjemaet, uten mellomrom rundt. Tomt felt gir "".
function tekstFra(felt) {
  return String(state[felt] || "").trim();
}

// Innholdet i enkeltplakaten, samlet så malene ikke trenger å vite hvilken mal det er.
// info er etikett og verdi til Plakat, fakta er opptil to linjer med ikon til Merkelapp.
function innholdArrangement() {
  var s = state;
  var info = ARR_INFO.filter(function (par) {
    if (!tekstFra(par[0])) return false;
    // Feltene som ikke hører til typen skjules, selv om de har innhold fra før.
    var felt = par[0];
    if (felt === "arrPris" || felt === "arrFrist") return s.arrType === "kurs";
    if (felt === "arrTaMed" || felt === "arrServering") return s.arrType === "dugnad";
    if (felt === "arrPasserFor") return s.arrType !== "dugnad";
    return true;
  }).map(function (par) { return { etikett: par[1], verdi: tekstFra(par[0]) }; });
  var fakta = [];
  if (tekstFra("arrTid")) fakta.push({ ikon: "klokke", verdi: tekstFra("arrTid") });
  if (tekstFra("arrSted")) fakta.push({ ikon: "sted", verdi: tekstFra("arrSted") });
  return {
    tittel: s.arrTittel, under: s.arrUnder, tekst: s.arrTekst, info: info, fakta: fakta, meny: [],
    dato: { dag: s.arrDag, dato: s.arrDato, maaned: s.arrMaaned }, merke: ""
  };
}

function innholdTurtips() {
  var s = state;
  var info = TIPS_INFO.filter(function (par) { return tekstFra(par[0]); })
    .map(function (par) {
      var verdi = tekstFra(par[0]);
      var grad = par[0] === "tipsGrad";
      return { etikett: par[1], verdi: verdi, farge: grad ? (GRAD[verdi] || "") : "" };
    });
  var fakta = [];
  var lengde = [tekstFra("tipsLengde"), tekstFra("tipsVarighet")].filter(Boolean).join(", ");
  if (lengde) fakta.push({ ikon: "rute", verdi: lengde });
  if (tekstFra("tipsGrad")) fakta.push({ prikk: GRAD[s.tipsGrad] || "", verdi: s.tipsGrad });
  return { tittel: s.tipsTittel, under: s.tipsUnder, tekst: s.tipsTekst, info: info, fakta: fakta, meny: [], dato: null, merke: "Turtips" };
}

function innholdSesong() {
  var s = state;
  var def = SESONG_TYPER[s.sesongType].fakta;
  var info = [], fakta = [];
  ["sesongFakta1", "sesongFakta2"].forEach(function (felt, i) {
    var v = tekstFra(felt);
    if (!v) return;
    info.push({ etikett: def[i][0], verdi: v });
    fakta.push({ ikon: def[i][1], verdi: v });
  });
  var dato = (s.sesongDag && tekstFra("sesongDato")) ? { dag: s.sesongDag, dato: tekstFra("sesongDato"), maaned: s.sesongMaaned } : null;
  return { tittel: s.sesongTittel, under: s.sesongUnder, tekst: s.sesongTekst, info: info, fakta: fakta, meny: [], dato: dato, merke: tekstFra("sesongMerke") };
}

function innholdMeny() {
  var s = state;
  var info = [], fakta = [];
  if (tekstFra("menyTid")) { info.push({ etikett: "Servering", verdi: tekstFra("menyTid") }); fakta.push({ ikon: "klokke", verdi: tekstFra("menyTid") }); }
  if (tekstFra("menyPris")) { info.push({ etikett: "Pris", verdi: tekstFra("menyPris") }); fakta.push({ ikon: "bestikk", verdi: tekstFra("menyPris") }); }
  var meny = String(s.menyLinjer || "").split("\n").map(function (l) { return l.trim(); }).filter(Boolean).slice(0, 6);
  return { tittel: s.menyTittel, under: s.menyUnder, tekst: "", info: info, fakta: fakta, meny: meny, dato: null, merke: tekstFra("menyMerke") };
}

export function innholdFor(mal) {
  if (mal === "arrangement") return innholdArrangement();
  if (mal === "turtips") return innholdTurtips();
  if (mal === "sesong") return innholdSesong();
  if (mal === "meny") return innholdMeny();
  return { tittel: "", under: "", tekst: "", info: [], fakta: [], meny: [], dato: null, merke: "" };
}

// Teksten i postkortsignaturen. Postkort-malen bruker hyttas navn, høyde og område
// når feltene er tomme. De andre malene bruker merkelapp, tittel og undertittel.
export function signaturFor(inn) {
  if (state.mal === "postkort") {
    return {
      over: tekstFra("postOverlinje"),
      navn: tekstFra("postNavn") || avsenderNavn() || (state.avsender === "hytte" ? "Velg hytte" : "Stedsnavn"),
      meta: tekstFra("postMeta") || avsenderMeta(),
      // Postkortet med lys kant viser høyde og område på hver sin linje.
      metaLinjer: tekstFra("postMeta") ? [tekstFra("postMeta")] : avsenderMetaLinjer()
    };
  }
  var over = inn.merke || datoTekst(inn.dato);
  var meta = underEllerDato(inn) || (inn.fakta[0] ? inn.fakta[0].verdi : "");
  return { over: over, navn: inn.tittel, meta: meta, metaLinjer: meta ? [meta] : [] };
}

// Undertittelen, eller datoen når merkelappen står der datofeltet ellers ville stått
// (Merkelapp og Postkort). Ellers forsvinner f.eks. bookingdatoen fra bildet (16. oktober 2026).
export function underEllerDato(inn) {
  return (inn.under || "").trim() || (inn.merke ? datoTekst(inn.dato) : "");
}
