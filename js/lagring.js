/* Lagring i nettleseren: felttabellen (FELT), lagre(), hent() med flytting
   av gamle verdier, og hyttelenken ?hytte=. */
import { byttEksempeltekst, finnHytte, tillattMal, valgtHytte } from "./hjelpere.js";
import { ARR_FELT, ARR_TYPER, FARGER, FORMATER, LAGRINGSNOKKEL, MAKS_KARUSELL, MALVALG, MENY_FELT, NIVAA, OPPSETT, PLASSERINGER, POST_FELT, PROGRAM_FELT, SESONG_FELT, SESONG_TYPER, SIGNATURER, TEKST, TIPS_FELT, TUR_FELT } from "./konstanter.js";
import { nyTur, nyttUtsnitt, sesongPreset, state } from "./tilstand.js";

// Alt som lagres i nettleseren, og hvordan en lagret verdi sjekkes i hent() før den tas i bruk.
// «valg» må finnes i oppslaget, «hytte» må være en hytte i HYTTER, «tekst» må være tekst og
// «avPaa» true eller false. «utsnitt» og «liste» sjekkes felt for felt (hentUtsnitt(), hentTur()).
// Et nytt felt i skjemaet legges til her, så lagres og hentes det av seg selv.
var FELT = {};
function leggTilFelt(type, nokler, oppslag) {
  nokler.forEach(function (k) { FELT[k] = { type: type, oppslag: oppslag || null }; });
}
leggTilFelt("valg", ["avsender"], { turlag: true, hytte: true });
leggTilFelt("hytte", ["hytte"]);
leggTilFelt("valg", ["mal"], MALVALG);
leggTilFelt("valg", ["nivaa"], NIVAA);
leggTilFelt("valg", ["signatur"], SIGNATURER);
leggTilFelt("valg", ["farge"], FARGER);
leggTilFelt("valg", ["plassering"], PLASSERINGER);
leggTilFelt("valg", ["arrType"], ARR_TYPER);
leggTilFelt("valg", ["sesongType"], SESONG_TYPER);
leggTilFelt("valg", ["oppsett"], OPPSETT);
leggTilFelt("valg", ["format"], FORMATER);
leggTilFelt("valg", ["tekst"], TEKST);
leggTilFelt("avPaa", ["visMerke", "visLogo", "visBand", "visTurbo", "kortGlass"]);
leggTilFelt("tekst", ["tittel", "turlag", "lenke", "periode"].concat(ARR_FELT, TIPS_FELT, SESONG_FELT, MENY_FELT, POST_FELT, PROGRAM_FELT, TUR_FELT));
leggTilFelt("utsnitt", ["utsnitt"]);
leggTilFelt("liste", ["turer", "programRader"]);

var lagreTimer = null;
export function lagre() {
  clearTimeout(lagreTimer);
  lagreTimer = setTimeout(function () {
    try {
      var data = {};
      Object.keys(FELT).forEach(function (k) { data[k] = state[k]; });
      localStorage.setItem(LAGRINGSNOKKEL, JSON.stringify(data));
    } catch (e) { /* privat modus eller full lagring: vi lever fint uten */ }
  }, 300);
}

function gyldig(f, v) {
  if (f.type === "valg") return typeof v === "string" && Object.prototype.hasOwnProperty.call(f.oppslag, v);
  if (f.type === "hytte") return typeof v === "string" && Boolean(finnHytte(v));
  if (f.type === "tekst") return typeof v === "string";
  if (f.type === "avPaa") return typeof v === "boolean";
  return false;
}

// Lagrede verdier fra eldre utgaver gjøres om før de sjekkes mot FELT.
function flyttGamle(d) {
  // Før 14. oktober 2026 hadde arrangement og turtips «Stort foto» og «Foto og tekstfelt».
  if (!NIVAA[d.nivaa] && (d.arrOppsett === "kort" || d.tipsOppsett === "kort")) d.nivaa = "plakat";
  // «Stort bilde» med beige under fotoet og «Stående til høyre» ble fjernet 25. september 2026.
  if (d.oppsett === "stort" || d.oppsett === "side") d.oppsett = "bakgrunn";
  // Lagret «liggende» og «flate» finnes ikke lenger og faller tilbake til Innlegg og Merkelapp,
  // fordi de ikke står i FORMATER og NIVAA.
  // Nynorsk ble tatt ut 15. oktober 2026. Lagret «Helsing frå» blir «Hilsen fra».
  if (d.postOverlinje === "Helsing frå") d.postOverlinje = "Hilsen fra";
  // Periode laget av verktøyet med midtprikk («UKE 38 · SEPTEMBER») får det nye skillet.
  if (typeof d.periode === "string") d.periode = d.periode.replace(/^(UKE \d+) · ([A-ZÆØÅ]+)$/, "$1, $2");
  // Den gamle instruksjonen i turlagsfeltet blir et tomt felt (16. oktober 2026).
  if (d.turlag === "Fyll inn turlag") d.turlag = "";
  // Den gamle eksempeltittelen hadde datoen i seg. Den nye regnes som eksempel, så den byttes med typen.
  if (d.sesongTittel === "Booking åpner 15. oktober") d.sesongTittel = "Booking åpner";
  // Gamle instruksjoner i lenkefeltet gir standardlenken.
  if (d.lenke === "Fyll inn lenke til turkalender" || d.lenke === "Fyll inn nettadresse, f.eks. dnt.no/oslo") delete d.lenke;
}

// Et lagret utsnitt per format. Tall utenfor gliderne klemmes inn, alt annet blir standard.
var UTSNITT_GRENSER = { x: [0, 100], y: [0, 100], z: [100, 200] };
function hentUtsnitt(lagret) {
  var u = nyttUtsnitt();
  Object.keys(u).forEach(function (f) {
    var l = lagret[f];
    if (!l || typeof l !== "object") return;
    // Det gamle standardutsnittet (midten og 115 %) blir det nye: fokuspunktet og 100 %.
    if (l.x === 50 && l.y === 50 && l.z === 115) return;
    Object.keys(UTSNITT_GRENSER).forEach(function (k) {
      var g = UTSNITT_GRENSER[k];
      if (typeof l[k] === "number" && isFinite(l[k])) u[f][k] = Math.min(Math.max(l[k], g[0]), g[1]);
    });
  });
  return u;
}

// En lagret tur eller programpost. Bare feltene i nyTur(), og bare med riktig type,
// så f.eks. et tall i turmålet ikke stopper oppstarten.
function hentTur(t) {
  var tur = nyTur();
  if (t && typeof t === "object") {
    Object.keys(tur).forEach(function (k) { if (typeof t[k] === typeof tur[k]) tur[k] = t[k]; });
  }
  return tur;
}

export function hent() {
  var d = null;
  try { d = JSON.parse(localStorage.getItem(LAGRINGSNOKKEL) || "null"); } catch (e) { /* ugyldig lagret data ignoreres */ }
  if (!d || typeof d !== "object" || Array.isArray(d)) return;
  flyttGamle(d);
  Object.keys(FELT).forEach(function (k) {
    var f = FELT[k], v = d[k];
    if (f.type === "utsnitt") { if (v && typeof v === "object") state.utsnitt = hentUtsnitt(v); }
    else if (f.type === "liste") { if (Array.isArray(v)) state[k] = v.slice(0, MAKS_KARUSELL).map(hentTur); }
    else if (gyldig(f, v)) state[k] = v;
  });
  if (!tillattMal(state.mal, state.avsender)) state.mal = state.avsender === "hytte" ? "sesong" : "turkalender";
}

export function tomLagring() {
  try { localStorage.removeItem(LAGRINGSNOKKEL); } catch (e) { /* ignorer */ }
}

// Lenken ?hytte=leirvassbu velger hytta på forhånd. Hytta huskes etterpå.
export function lesLenke() {
  var id = "";
  try { id = (new URLSearchParams(window.location.search).get("hytte") || "").toLowerCase(); } catch (e) { return; }
  var h = finnHytte(id);
  if (!h) return;
  var forrige = valgtHytte();
  Object.assign(state, { avsender: "hytte", hytte: h.id, tekst: "normal" });
  Object.assign(state, byttEksempeltekst(sesongPreset(state.sesongType, forrige), sesongPreset(state.sesongType, h)));
  // Den vanligste posten fra hyttene er sesong og booking, så lenken starter der.
  if (!tillattMal(state.mal, "hytte")) state.mal = "sesong";
}
