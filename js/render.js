/* render(), oppdater() og oppdaterSnart(). beregn() kjøres én gang per
   render og deles av skjemaet og plakaten. */
import { beregn } from "./beregn.js";
import { bilderForMal, bilderForSesong, brukEksempelbilder, hytteBilder, onsketSesong } from "./bilder.js";
import { renderPlakat } from "./forhandsvisning.js";
import { erKalender } from "./hjelpere.js";
import { HYTTEMAPPE, TURMAPPE } from "./konstanter.js";
import { lagre } from "./lagring.js";
import { renderSkjema } from "./skjema.js";
import { state } from "./tilstand.js";
import { aktivTur, brukTur, hytteTurer, slippTur, turForAarstiden } from "./valg.js";

export function render(valg) {
  valg = valg || {};
  // Karusell finnes bare for turkalender og program. Andre maler faller tilbake til Innlegg.
  if (state.format === "karusell" && !erKalender(state.mal)) state.format = "feed";
  // Hyttene bruker bare normal tekststørrelse (15. oktober 2026).
  if (state.avsender === "hytte") state.tekst = "normal";
  // Turtips for en hytte starter med et turforslag fra UT.no som passer årstiden.
  // Uten hytte (turlag) kommer turlagenes eksempel tilbake.
  if (state.mal === "turtips") {
    if (hytteTurer().length && !aktivTur()) brukTur(turForAarstiden(hytteTurer()));
    else if (!hytteTurer().length && state.tipsTur) slippTur();
  }
  // Turens foto hører bare til turtipset. I andre maler byttes det til hyttas bilder.
  var tur = aktivTur(), eks = state.eksempel && state.eksempel.liggende;
  if (!state.egetBilde && eks && (tur && tur.bilde ? eks.fil !== tur.bilde.fil : eks.mappe === TURMAPPE)) {
    Object.assign(state, brukEksempelbilder());
  }
  // Handler innlegget om påske eller sommer, byttes et eksempelbilde fra feil sesong.
  // Mangler hytta bilder fra riktig sesong, blir det et bilde innefra (se bilderForSesong).
  var onsket = onsketSesong(), naa = state.eksempel && state.eksempel.liggende, hb = hytteBilder();
  if (!state.egetBilde && hb && onsket && naa && naa.sesong !== onsket &&
      bilderForSesong(hb, onsket).some(function (b) { return b.sesong !== naa.sesong; })) {
    Object.assign(state, brukEksempelbilder());
  }
  // Er malen byttet siden hyttebildet ble valgt, og malen helst vil ha en annen bilderolle
  // (f.eks. inne til Mat og meny), byttes bildet. Et bilde brukeren har bladd fram med
  // «Nytt bilde fra hytta» til samme mal, blir stående.
  naa = state.eksempel && state.eksempel.liggende;
  if (!state.egetBilde && hb && naa && naa.mappe === HYTTEMAPPE && state.eksempel.mal !== state.mal) {
    if (bilderForMal(hb).some(function (b) { return b.fil === naa.fil; })) state.eksempel.mal = state.mal;
    else Object.assign(state, brukEksempelbilder());
  }
  // Ferdige bilder til deling gjelder bare til noe endres.
  if (!valg.beholdFiler) state.delingsFiler = null;
  // En planlagt render fra skriving er med her, så den trengs ikke lenger.
  if (planlagt) { cancelAnimationFrame(planlagt.ramme); clearTimeout(planlagt.tid); planlagt = null; }
  // Beregningen gjøres én gang og deles av skjemaet og plakaten.
  var b = beregn();
  renderSkjema(b, valg.turliste);
  renderPlakat(b);
  if (valg.lagre !== false) lagre();
}

export function oppdater(patch, valg) {
  Object.assign(state, patch);
  render(valg);
}

// Skriving i tekstfelt og flytting av glidere samles til én render per skjermbilde,
// så raske tastetrykk ikke bygger plakaten mange ganger mellom hver gang den vises.
// Tidsfristen er en reserve: når siden ikke tegnes (f.eks. et skjult panel), kommer
// det ingen skjermbilder, og da må renderen likevel skje.
var planlagt = null;
export function oppdaterSnart(patch) {
  Object.assign(state, patch);
  if (planlagt) return;
  var kjor = function () { if (planlagt) render(); };
  planlagt = { ramme: requestAnimationFrame(kjor), tid: setTimeout(kjor, 100) };
}
