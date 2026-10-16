/* Eksempelbilder etter sesong og bilderolle, måling av bilder, fokuspunkt og
   utsnittet i px (bakgrunn()). */
import { valgtHytte } from "./hjelpere.js";
import { EKSEMPELBILDER, EKSEMPELMAPPE, EKSEMPELNOKKEL, HYTTEMAPPE, HYTTER, TURMAPPE } from "./konstanter.js";
import { render } from "./render.js";
import { nyttUtsnitt, state } from "./tilstand.js";
import { aktivTur } from "./valg.js";

export function hytteBilder() {
  var h = valgtHytte();
  return h && h.bilder && h.bilder.length ? h.bilder : null;
}

// Hvilken sesong eksempelbildet bør vise, ut fra teksten i innlegget. Påske, vinter
// og ski gir vinterbilde (15. oktober 2026), sommer og fiske gir sommerbilde.
export function onsketSesong() {
  var s = state, tekst;
  if (s.mal === "sesong") tekst = [s.sesongMerke, s.sesongTittel, s.sesongUnder];
  else if (s.mal === "program") tekst = [s.programTittel, s.programPeriode];
  else if (s.mal === "meny") tekst = [s.menyMerke, s.menyTittel, s.menyUnder];
  else if (s.mal === "arrangement") tekst = [s.arrTittel, s.arrUnder, s.arrMaaned];
  // Et turforslag uten eget foto får et hyttebilde fra turens sesong.
  else if (s.mal === "turtips") { var tur = aktivTur(); return tur ? tur.sesong || "" : ""; }
  else return "";
  tekst = tekst.join(" ").toLowerCase();
  // Månedsnavn teller ikke, de viser ofte til neste sesong («Vi ses igjen 5. mars»).
  if (/påsk|vinter|\bski|snø|\bjul|nyttår/.test(tekst)) return "vinter";
  if (/sommer|sommar|fiske|\bbad|høst/.test(tekst)) return "sommer";
  return "";
}

// Hyttebildene som passer sesongen. Finnes ingen, brukes bilder innefra, og til slutt alle.
export function bilderForSesong(hb, onsket) {
  if (!onsket) return hb;
  var like = hb.filter(function (b) { return b.sesong === onsket; });
  if (like.length) return like;
  var inne = hb.filter(function (b) { return b.sesong === "inne"; });
  return inne.length ? inne : hb;
}

// Bilderollen hver mal helst vil ha (16. oktober 2026). Sesong og booking selger hytta,
// Mat og meny viser stua og maten, og Arrangement viser folk. De andre malene tar alle.
var MAL_ROLLE = { sesong: "oversikt", meny: "inne", arrangement: "folk" };

// Hyttebildene som passer innlegget: riktig sesong, og helst malens bilderolle.
// Bilder innefra passer alle årstider, så Mat og meny får et bilde innefra også i påsken.
export function bilderForMal(hb) {
  var sesong = bilderForSesong(hb, onsketSesong());
  var rolle = MAL_ROLLE[state.mal];
  if (!rolle) return sesong;
  var med = (rolle === "inne" ? hb : sesong).filter(function (b) { return b.rolle === rolle; });
  return med.length ? med : sesong;
}

// Trekker ett liggende og ett stående eksempelbilde. Forrige trekk huskes i
// nettleseren og unngås, så det aldri blir samme bilde to ganger på rad.
// En valgt hytte bruker sine egne bilder, samme bilde i alle flater. Et turtips
// med turforslag fra UT.no bruker turens eget foto.
// «neste» er «Nytt bilde fra hytta»: da blas det i fast rekkefølge, først bildene med
// malens rolle og så resten fra sesongen, så alle hyttas bilder kan nås med knappen.
function trekkEksempelbilder(neste) {
  var tur = aktivTur();
  if (tur && tur.bilde) {
    var tb = { fil: tur.bilde.fil, fotograf: tur.bilde.fotograf || null, mappe: TURMAPPE, sesong: tur.sesong || "" };
    return { liggende: tb, staaende: tb };
  }
  var forrige = {};
  try { forrige = JSON.parse(localStorage.getItem(EKSEMPELNOKKEL) || "{}") || {}; } catch (e) { /* ignorer */ }
  var valg;
  var hb = hytteBilder();
  if (hb) {
    var aktuelle = bilderForMal(hb);
    var b;
    if (neste) {
      var rekke = aktuelle.concat(bilderForSesong(hb, onsketSesong()).filter(function (x) { return aktuelle.indexOf(x) < 0; }));
      var naa = state.eksempel && state.eksempel.liggende;
      var plass = naa ? rekke.map(function (x) { return x.fil; }).indexOf(naa.fil) : -1;
      b = rekke[(plass + 1) % rekke.length];
    } else {
      var andre = aktuelle.filter(function (x) { return x.fil !== forrige.hytte; });
      var liste = andre.length ? andre : aktuelle;
      b = liste[Math.floor(Math.random() * liste.length)];
    }
    var bilde = { fil: b.fil, fotograf: b.fotograf || null, mappe: HYTTEMAPPE, sesong: b.sesong || "", rolle: b.rolle || "" };
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

export function bildeAdresse(b) { return b ? (b.mappe || EKSEMPELMAPPE) + b.fil : ""; }

export function brukEksempelbilder(neste) {
  var valg = trekkEksempelbilder(neste);
  // Malen bildet ble valgt til. Byttes malen, ser render() om bilderollen fortsatt passer.
  valg.mal = state.mal;
  return {
    eksempel: valg,
    bilde: bildeAdresse(valg.liggende),
    bildeStaaende: bildeAdresse(valg.staaende),
    egetBilde: false,
    bildenavn: hytteBilder() ? "Ingen fil valgt, bruker et bilde fra hytta" : "Ingen fil valgt, bruker et eksempelbilde fra DNT",
    utsnitt: nyttUtsnitt()
  };
}


// Måler naturlig størrelse på et bilde én gang, og husker den. Hele siden rendres
// på nytt når målet er klart, fordi gliderne og oppløsningsvarselet bygger på det.
export var bildeMal = {};
export function malBilde(src) {
  if (bildeMal[src] !== undefined) return bildeMal[src];
  bildeMal[src] = null;
  var img = new Image();
  img.onload = function () {
    bildeMal[src] = { w: img.naturalWidth, h: img.naturalHeight };
    render({ lagre: false });
  };
  img.onerror = function () { bildeMal[src] = { w: 1, h: 1 }; };
  img.src = src;
  return null;
}

// Fokuspunktet til et eksempelbilde, slått opp på adressen. Egne bilder har
// ikke noe, og får midten.
var fokusTabell = null;
function fokusFor(src) {
  if (!fokusTabell) {
    fokusTabell = {};
    EKSEMPELBILDER.forEach(function (b) { if (b.fokus) fokusTabell[EKSEMPELMAPPE + b.fil] = b.fokus; });
    HYTTER.forEach(function (h) {
      (h.bilder || []).forEach(function (b) { if (b.fokus) fokusTabell[HYTTEMAPPE + b.fil] = b.fokus; });
      (h.turer || []).forEach(function (t) { if (t.bilde && t.bilde.fokus) fokusTabell[TURMAPPE + t.bilde.fil] = t.bilde.fokus; });
    });
  }
  return fokusTabell[src] || [50, 50];
}

// Posisjonen (prosent, som i background-position) som legger punktet p, i prosent
// av bildet, midt i flaten. Grensene 0 og 100 hindrer tom kant, så et motiv helt
// ute i kanten havner så nær midten som bildet rekker.
function fraFokus(p, bildeLengde, flateLengde) {
  if (bildeLengde - flateLengde < 1) return 50;
  var pos = (p / 100 * bildeLengde - flateLengde / 2) / (bildeLengde - flateLengde) * 100;
  return Math.max(0, Math.min(100, pos));
}

// Over denne forstørrelsen blir bildet synlig mykt, og skjemaet sier fra (16. oktober 2026).
export var MAKS_FORSTORRELSE = 1.5;

// Regner ut bakgrunnsstørrelse og -posisjon slik at bildet dekker flaten
// uten å strekkes, med zoom og panorering lagt på. html2canvas støtter ikke
// object-fit, derfor gjøres dette med background-size i px.
// x og y er prosent av det som stikker utenfor flaten (0 venstre eller øverst,
// 100 høyre eller nederst). Er de null, følger utsnittet bildets fokuspunkt.
// Svaret har også utsnittet som faktisk brukes (til gliderne) og forstørrelsen,
// der 1 betyr ett bildepunkt per punkt i det ferdige bildet.
export function bakgrunn(src, boksB, boksH, u) {
  var d = malBilde(src);
  if (!d || !d.w || !d.h) {
    return { bgStr: "cover", bgPos: "50% 50%", forstorrelse: 0,
             u: { x: u.x == null ? 50 : u.x, y: u.y == null ? 50 : u.y, z: u.z } };
  }
  var dekning = Math.max(boksB / d.w, boksH / d.h) * (u.z / 100);
  var bw = d.w * dekning, bh = d.h * dekning;
  var f = fokusFor(src);
  var x = u.x == null ? fraFokus(f[0], bw, boksB) : u.x;
  var y = u.y == null ? fraFokus(f[1], bh, boksH) : u.y;
  var px = (boksB - bw) * (x / 100), py = (boksH - bh) * (y / 100);
  return {
    bgStr: Math.round(bw) + "px " + Math.round(bh) + "px", bgPos: Math.round(px) + "px " + Math.round(py) + "px",
    u: { x: Math.round(x), y: Math.round(y), z: u.z },
    // Et bilde som ikke lot seg laste (1 × 1) gir ingen varsel om oppløsning.
    forstorrelse: d.w > 1 ? dekning : 0,
    langside: Math.max(d.w, d.h)
  };
}

// Standardbildet velges etter fotoflatens proporsjoner. Eget bilde brukes alltid.
export function kildeBilde(boksB, boksH) {
  if (state.egetBilde) return state.bilde;
  return erStaaendeFlate(boksB, boksH) ? state.bildeStaaende : state.bilde;
}

function erStaaendeFlate(boksB, boksH) { return (boksB / boksH) < 1.15; }

// Fotografen bak eksempelbildet som vises nå, eller null ved eget bilde.
export function aktivtEksempel(boksB, boksH) {
  if (state.egetBilde) return null;
  return erStaaendeFlate(boksB, boksH) ? state.eksempel.staaende : state.eksempel.liggende;
}
