/* Valg med følger: avsender, hytte, sesongtype, turforslag fra UT.no og
   «Prøv en annen variant». */
import { brukEksempelbilder } from "./bilder.js";
import { el } from "./forhandsvisning.js";
import { aktivtNivaa, byttEksempeltekst, erKalender, erKarusell, esc, finnHytte, tillattMal, valgtHytte } from "./hjelpere.js";
import { FARGER, GRAD, HYTTER, PLASSERINGER, SESONG_TYPER, SIGNATURER, TIPS_FELT } from "./konstanter.js";
import { oppdater, render } from "./render.js";
import { sesongPreset, standardSkjema, state } from "./tilstand.js";

export function hytteLenke(h) {
  return window.location.origin + window.location.pathname + "?hytte=" + h.id;
}

export function byggHytteliste() {
  if (!el.hytteValg) return;
  var sortert = HYTTER.slice().sort(function (a, b) { return a.kortnavn.localeCompare(b.kortnavn, "nb"); });
  el.hytteValg.innerHTML = '<option value="">Velg hytte</option>' + sortert.map(function (h) {
    return '<option value="' + esc(h.id) + '">' + esc(h.kortnavn + ", " + h.omrade) + '</option>';
  }).join("");
}

export function velgAvsender(avs) {
  if (avs === state.avsender) return;
  var patch = { avsender: avs };
  // Hyttene bruker bare normal tekststørrelse (15. oktober 2026).
  if (avs === "hytte") patch.tekst = "normal";
  if (!tillattMal(state.mal, avs)) {
    patch.mal = avs === "hytte" ? (state.mal === "turkalender" ? "program" : "sesong")
                                : (state.mal === "program" ? "turkalender" : "arrangement");
  }
  Object.assign(state, patch);
  if (!state.egetBilde) Object.assign(state, brukEksempelbilder());
  render({ turliste: true });
}

export function velgHytte(id) {
  var gammel = valgtHytte();
  var ny = finnHytte(id);
  var patch = { hytte: ny ? ny.id : "" };
  Object.assign(patch, byttEksempeltekst(sesongPreset(state.sesongType, gammel), sesongPreset(state.sesongType, ny)));
  Object.assign(state, patch);
  if (!state.egetBilde) Object.assign(state, brukEksempelbilder());
  render();
}


// Turforslagene for valgt hytte, fra js/hytter.js. Tom liste for turlag.
export function hytteTurer() {
  var h = valgtHytte();
  return h && h.turer && h.turer.length ? h.turer : [];
}

// tipsTur er «hytte/id», fordi samme UT-rute kan stå på to hytter med ulik tekst.
function turNokkel(h, t) { return h.id + "/" + t.id; }

function finnTur(nokkel) {
  var del = String(nokkel || "").split("/");
  var h = finnHytte(del[0]);
  return h && h.turer ? h.turer.filter(function (t) { return String(t.id) === del[1]; })[0] || null : null;
}

// Turen som er eksempel i Turtips nå, hvis den hører til valgt hytte.
export function aktivTur() {
  var h = valgtHytte();
  if (state.mal !== "turtips" || !h) return null;
  return hytteTurer().filter(function (t) { return turNokkel(h, t) === state.tipsTur; })[0] || null;
}

// Tipsfeltene en tur fyller ut. Felt turen ikke har, tømmes.
function turFelt(t) {
  return {
    tipsTittel: t.tittel || "", tipsUnder: t.under || "", tipsTekst: t.tekst || "",
    tipsLengde: t.lengde || "", tipsVarighet: t.varighet || "", tipsGrad: GRAD[t.grad] ? t.grad : "",
    tipsStart: t.start || "", tipsKollektiv: t.kollektiv || "", tipsPasserFor: "",
    tipsUnderveis: "", tipsSesong: t.besteTid || ""
  };
}

// Turlagenes eksempel (Sognsvann rundt). Regnes som forrige eksempel første gang.
function turlagTips() {
  var s = standardSkjema(), ut = {};
  TIPS_FELT.forEach(function (k) { ut[k] = s[k]; });
  return ut;
}

// En tur med dagens måned i sesongen, ellers den første.
export function turForAarstiden(turer) {
  var mnd = new Date().getMonth() + 1;
  return turer.filter(function (t) { return (t.maneder || []).indexOf(mnd) >= 0; })[0] || turer[0];
}

// Fyller tipsfeltene med turen. Bare felt som fortsatt har forrige eksempel byttes,
// så det brukeren har skrevet selv blir stående.
export function brukTur(ny) {
  var forrige = finnTur(state.tipsTur);
  var patch = byttEksempeltekst(forrige ? turFelt(forrige) : turlagTips(), turFelt(ny));
  patch.tipsTur = turNokkel(valgtHytte(), ny);
  Object.assign(state, patch);
  if (!state.egetBilde) Object.assign(state, brukEksempelbilder());
}

// Tilbake til turlagenes eksempel når hytta ikke lenger er avsender.
export function slippTur() {
  var forrige = finnTur(state.tipsTur);
  if (forrige) Object.assign(state, byttEksempeltekst(turFelt(forrige), turlagTips()));
  state.tipsTur = "";
  if (!state.egetBilde) Object.assign(state, brukEksempelbilder());
}

export function nesteTur() {
  var turer = hytteTurer();
  if (!turer.length) return;
  var i = turer.indexOf(aktivTur());
  brukTur(turer[(i + 1) % turer.length]);
  render();
}

export function velgSesongType(type) {
  if (!SESONG_TYPER[type] || type === state.sesongType) return;
  var h = valgtHytte();
  var patch = { sesongType: type };
  Object.assign(patch, byttEksempeltekst(sesongPreset(state.sesongType, h), sesongPreset(type, h)));
  oppdater(patch);
}

// «Prøv en annen variant» bytter det som kan varieres uten at innholdet endres:
// farge og plassering i Merkelapp, signatur i Postkort, farge i Plakat og oppsett i kalenderen.
export function nyVariant() {
  // Karusellen varierer forsiden som Merkelapp. Ellers bytter kalenderne oppsett.
  if (erKalender(state.mal) && !erKarusell()) { oppdater({ oppsett: state.oppsett === "topp" ? "bakgrunn" : "topp" }); return; }
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
