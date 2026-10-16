/* Små hjelpere: DOM-oppslag, escaping, avsender, malvalg og turlister. */
import { FARGER, HYTTER, IKON_STI, MAKS_KARUSELL, MAKS_TURER, MALVALG } from "./konstanter.js";
import { state } from "./tilstand.js";

export var $ = function (sel, rot) { return (rot || document).querySelector(sel); };
export var $$ = function (sel, rot) { return Array.prototype.slice.call((rot || document).querySelectorAll(sel)); };

export function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function slug(s) {
  return String(s || "").toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "oe").replace(/å/g, "aa")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "turlag";
}

// Merkelappens farge. Rød hvis det lagrede valget ikke finnes.
export function valgtFarge() { return FARGER[state.farge] || FARGER.rod; }

export function erKalender(mal) { return mal === "turkalender" || mal === "program"; }

export function erKarusell() { return state.format === "karusell" && erKalender(state.mal); }

export function maksTurer() { return erKarusell() ? MAKS_KARUSELL : MAKS_TURER; }

// Postkort-malen er alltid på postkortnivået. Kalenderne har oppsett i stedet for nivå,
// men forsiden i karusellen er bygget som Merkelapp.
export function aktivtNivaa() {
  if (state.mal === "postkort") return "postkort";
  if (erKalender(state.mal)) return erKarusell() ? "merkelapp" : "";
  return state.nivaa;
}

export function tillattMal(mal, avsender) {
  var a = MALVALG[mal] && MALVALG[mal].avsender;
  return !a || a === avsender;
}

export function finnHytte(id) {
  return HYTTER.filter(function (h) { return h.id === id; })[0] || null;
}

export function valgtHytte() {
  return state.avsender === "hytte" ? finnHytte(state.hytte) : null;
}

// Navnet som står i stempelet, overlinjen og signaturen.
export function avsenderNavn() {
  if (state.avsender === "hytte") { var h = valgtHytte(); return h ? h.kortnavn : ""; }
  return (state.turlag || "").trim();
}

// Overlinjen i turkalenderen og plakaten. Uten turlagsnavn står den tom.
export function overlinjeNavn() {
  if (state.avsender === "hytte") { var h = valgtHytte(); return h ? h.kortnavn : "Velg hytte"; }
  return (state.turlag || "").trim();
}

// «Søndag 27. september». Tomme deler utelates, så et tomt datofelt ikke gir «Søndag . september».
export function datoTekst(d) {
  return d ? [d.dag, d.dato ? d.dato + "." : "", d.maaned].filter(Boolean).join(" ") : "";
}

// Preposisjon foran området. «i» er standard.
var PAA_OMRADE = { "Hardangervidda": "på", "Dovrefjell": "på", "Oslofjorden": "ved" };

// Høyde og område under hyttenavnet, f.eks. «1405 moh i Jotunheimen». Hytter nær havet
// får bare området, f.eks. «Ved Oslofjorden». Ingen midtprikk som skilletegn.
export function avsenderMeta() {
  var h = valgtHytte();
  if (!h) return "";
  var omrade = h.omrade ? (PAA_OMRADE[h.omrade] || "i") + " " + h.omrade : "";
  if (!h.moh || h.moh < 100) return omrade.charAt(0).toUpperCase() + omrade.slice(1);
  return [h.moh + " moh", omrade].filter(Boolean).join(" ");
}

// Samme opplysninger på to linjer, til postkortet med lys kant.
export function avsenderMetaLinjer() {
  var h = valgtHytte();
  if (!h) return [];
  return [h.moh >= 100 ? h.moh + " moh" : "", h.omrade || ""].filter(Boolean);
}

export function ikon(navn) {
  return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F0F0F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (IKON_STI[navn] || IKON_STI.kalender) + '</svg>';
}

// Turkalenderen og programmet bruker samme oppsett, men hver sin liste og tittel.
export function listeNokkel() { return state.mal === "program" ? "programRader" : "turer"; }

export function kalenderData() {
  var program = state.mal === "program";
  return {
    tittel: program ? state.programTittel : state.tittel,
    periode: program ? state.programPeriode : state.periode,
    navn: overlinjeNavn(),
    liste: state[listeNokkel()]
  };
}

export function synligeTurer() {
  return state[listeNokkel()].filter(function (t) {
    return (t.tittel || "").trim() || (t.sted || "").trim() || (t.dato || "").trim();
  });
}

export function detaljerFor(t) {
  return [t.turleder ? "Turleder " + t.turleder : "", t.varighet].filter(Boolean).join(", ");
}

// Felt som fortsatt har eksempelteksten byttes når type eller hytte endres.
// Det brukeren har skrevet selv, blir stående.
export function byttEksempeltekst(gammel, ny) {
  var patch = {};
  Object.keys(ny).forEach(function (k) {
    var naa = state[k] == null ? "" : String(state[k]);
    var var_ = gammel[k] == null ? "" : String(gammel[k]);
    if (naa === "" || naa === var_) patch[k] = ny[k];
  });
  return patch;
}
