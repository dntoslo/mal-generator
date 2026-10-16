/* Innholdet i enkeltmalene (arrangement, turtips, sesong og meny) og
   signaturen på Postkort-nivå. */
import { avsenderMeta, avsenderMetaLinjer, avsenderNavn, datoTekst } from "./hjelpere.js";
import { ARR_INFO, GRAD, SESONG_TYPER, TIPS_INFO } from "./konstanter.js";
import { state } from "./tilstand.js";

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
  }).map(function (par) { return { etikett: par[1], verdi: s[par[0]].trim() }; });
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
      return { etikett: par[1], verdi: verdi, farge: grad ? (GRAD[verdi] || "") : "" };
    });
  var fakta = [];
  var lengde = [(s.tipsLengde || "").trim(), (s.tipsVarighet || "").trim()].filter(Boolean).join(", ");
  if (lengde) fakta.push({ ikon: "rute", verdi: lengde });
  if ((s.tipsGrad || "").trim()) fakta.push({ prikk: GRAD[s.tipsGrad] || "", verdi: s.tipsGrad });
  return { tittel: s.tipsTittel, under: s.tipsUnder, tekst: s.tipsTekst, info: info, fakta: fakta, meny: [], dato: null, merke: "Turtips" };
}

function innholdSesong() {
  var s = state;
  var def = SESONG_TYPER[s.sesongType].fakta;
  var info = [], fakta = [];
  [s.sesongFakta1, s.sesongFakta2].forEach(function (v, i) {
    v = (v || "").trim();
    if (!v) return;
    info.push({ etikett: def[i][0], verdi: v });
    fakta.push({ ikon: def[i][1], verdi: v });
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
      over: (state.postOverlinje || "").trim(),
      navn: (state.postNavn || "").trim() || avsenderNavn() || (state.avsender === "hytte" ? "Velg hytte" : "Stedsnavn"),
      meta: (state.postMeta || "").trim() || avsenderMeta(),
      // Postkortet med lys kant viser høyde og område på hver sin linje.
      metaLinjer: (state.postMeta || "").trim() ? [state.postMeta.trim()] : avsenderMetaLinjer()
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
