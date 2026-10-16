/* beregn(): størrelser, fotoflate og CSS-variabler for plakaten som skal
   tegnes. Karusellen har sin egen i karusell.js. */
import { aktivtEksempel, bakgrunn, kildeBilde } from "./bilder.js";
import { aktivtNivaa, erKalender, erKarusell, kalenderData, synligeTurer } from "./hjelpere.js";
import { innholdFor, signaturFor } from "./innhold.js";
import { beregnKarusell } from "./karusell.js";
import { FARGER, FORMATER, NIVAA, OPPSETT, TEKST, TITTELFONT, TITTELSPORING } from "./konstanter.js";
import { maalBredde, maalHoyde, tilpassStorrelse, tilpassToLinjer } from "./maaling.js";
import { malPlakatInnhold, malRad } from "./maler.js";
import { state } from "./tilstand.js";

export function beregn() {
  if (erKarusell()) return beregnKarusell();
  return erKalender(state.mal) ? beregnTurkalender() : beregnEnkelt();
}

// Enkeltplakaten: arrangement, turtips, sesong, meny eller postkort, på tre
// tekstnivåer (postkort, merkelapp og plakat) i innlegg og historie.
function beregnEnkelt() {
  var s = state;
  var nivaa = aktivtNivaa();
  var fmt = FORMATER[s.format];
  var story = s.format === "story";
  var stor = s.tekst === "stor";
  var k = stor ? 1.12 : 1;
  var pad = 64;
  // Båndet nederst er valgfritt. Høyden brukes bare her og som --band-h i CSS.
  var band = s.visBand ? 88 : 0;
  var innhold = innholdFor(s.mal);
  var sig = nivaa === "postkort" ? signaturFor(innhold) : null;
  var farge = FARGER[s.farge] || FARGER.rod;

  // Postkort C har foto med lys kant og signaturen under.
  var cTopp = story ? 180 : 44, cBunn = 266, cLuft = story ? 200 : 0;
  var cFotoH = fmt.hoyde - cTopp - cBunn - cLuft;

  // Datofeltet er 184 px, så hele månedsnavnet får plass i 24 px (se docs/design.md).
  var tekstBredde = fmt.bredde - 2 * pad;
  var chip = Math.round(184 * (stor ? 1.08 : 1));
  var tittel, sigNavnPx = 0, cUnder = false;
  if (nivaa === "plakat") {
    // Datofeltet står ved siden av tittelen, så bredden er mindre. Uten datofelt får tittelen hele bredden.
    var tittelBredde = innhold.dato ? tekstBredde - chip - 36 : tekstBredde;
    tittel = tilpassStorrelse(innhold.tittel, TITTELFONT, TITTELSPORING, tittelBredde, 104, 60);
  } else if (nivaa === "merkelapp") {
    tittel = tilpassToLinjer(innhold.tittel, tekstBredde - (s.visTurbo ? 300 : 0), 112, 64);
  } else {
    if (s.signatur === "b") tittel = tilpassStorrelse(sig.navn, TITTELFONT, TITTELSPORING, 740, 46, 32);
    else if (s.signatur === "c") {
      // Navn og meta står side om side når begge får plass (hyttenavn og høyde).
      // Lange titler og undertitler fra Turtips og Sesong får meta under navnet,
      // ellers kolliderer de (15. oktober 2026). Bunnen er 968 px innenfor kanten.
      var metaB = Math.max.apply(null, [0].concat(sig.metaLinjer.map(function (x) { return maalBredde(x, '500 {px}px "ABC Social"', 28); })));
      var vedSiden = Math.min(640, 968 - 24 - metaB);
      var ved = sig.metaLinjer.length ? tilpassStorrelse(sig.navn, TITTELFONT, TITTELSPORING, vedSiden, 112, 72) : null;
      if (ved && !ved.bryt && vedSiden >= 360) tittel = ved;
      else {
        tittel = tilpassStorrelse(sig.navn, TITTELFONT, TITTELSPORING, 900, 112, 56);
        cUnder = sig.metaLinjer.length > 0;
      }
    }
    else tittel = tilpassToLinjer(sig.navn, tekstBredde - (s.visTurbo ? 300 : 0), 132, 72);
    sigNavnPx = tittel.px;
  }

  var vars = {
    "--bredde": fmt.bredde + "px", "--hoyde": fmt.hoyde + "px",
    "--a-pad": pad + "px", "--a-chip": chip + "px",
    // Luft over og under innholdet i Plakat. Historie har mer nederst, der Instagram legger knapper.
    "--a-innhold-topp": "56px", "--a-innhold-bunn": (story ? 340 : 72) + "px",
    "--a-dag-size": Math.round(24 * k) + "px",
    "--a-dato-size": Math.round(70 * k) + "px",
    "--a-maaned-size": Math.round(24 * k) + "px",
    "--a-merke-size": Math.round(26 * k) + "px",
    "--a-tittel-size": tittel.px + "px",
    "--a-under-size": Math.round(34 * k) + "px",
    // Etikettene var 22 px til 16. oktober 2026, under grensen på 24 px.
    "--a-etikett-size": Math.round(24 * k) + "px",
    "--a-verdi-size": Math.round(30 * k) + "px",
    "--a-tekst-size": Math.round(30 * k) + "px",
    "--merke-bg": farge.bg, "--merke-fg": farge.fg,
    "--m-tittel-size": tittel.px + "px",
    "--m-under-size": Math.round(36 * k) + "px",
    "--m-fakta-size": Math.round(34 * k) + "px",
    // Instagram legger knapper over toppen og bunnen av en historie, derfor mer luft der.
    "--m-topp": (story ? 210 : 56) + "px",
    "--m-bunn": ((story ? 340 : 76) + band) + "px",
    "--m-innhold-topp": (story ? 230 : 72) + "px",
    "--m-stempel-bunn": ((story ? 300 : 56) + band) + "px",
    "--s-navn-size": sigNavnPx + "px",
    "--s-bunn": ((story ? 340 : 72) + band) + "px",
    "--s-bunn-b": ((story ? 300 : 56) + band) + "px",
    "--s-c-topp": cTopp + "px", "--s-c-foto-h": cFotoH + "px",
    "--turbo-h": "200px", "--band-h": band + "px"
  };

  // Plakat: innholdet står rett under fotoet med fast luft, og fotoet tar resten av høyden
  // (16. oktober 2026). Med kort tekst blir fotoet stort. Med lang tekst krymper det, men aldri
  // under 540 px i innlegg og 840 i historie (før var det fast 620 og 1080). Da får også det
  // lengste turforslaget fra UT.no plass. Høyden må være kjent her, fordi utsnittet regnes ut i px.
  var fotoH = story ? 1080 : 620;
  if (nivaa === "plakat") {
    var innholdH = maalHoyde(malPlakatInnhold({ innhold: innhold, info: innhold.info, tittelBryt: tittel.bryt }), vars);
    fotoH = Math.max(story ? 840 : 540, fmt.hoyde - band - innholdH);
  }
  vars["--a-foto-h"] = fotoH + "px";

  // Fotoflaten. Plakat har foto øverst, postkort C har foto med lys kant, resten fyller flaten.
  var fotoFlate = nivaa === "plakat" ? [fmt.bredde, fotoH]
    : (nivaa === "postkort" && s.signatur === "c") ? [fmt.bredde - 88, cFotoH]
    : [fmt.bredde, fmt.hoyde];
  var bilde = kildeBilde(fotoFlate[0], fotoFlate[1]);
  var bg = bakgrunn(bilde, fotoFlate[0], fotoFlate[1], s.utsnitt[s.format]);
  vars["--bg-str"] = bg.bgStr;
  vars["--bg-pos"] = bg.bgPos;

  return {
    mal: s.mal, nivaa: nivaa, oppsett: nivaa, fmt: fmt, opp: NIVAA[nivaa], u: bg.u, stor: stor, forMange: false, synlige: [], maks: 0,
    forstorrelse: bg.forstorrelse, langside: bg.langside,
    bilde: bilde,
    eksempel: aktivtEksempel(fotoFlate[0], fotoFlate[1]),
    tittelBryt: tittel.bryt,
    cUnder: cUnder,
    innhold: innhold,
    info: innhold.info,
    sig: sig,
    vars: vars
  };
}

function beregnTurkalender() {
  var s = state;
  var fmt = FORMATER[s.format];
  var opp = OPPSETT[s.oppsett];
  var kal = kalenderData();
  var synlige = synligeTurer();
  var n = Math.max(synlige.length, 1);
  var stor = s.tekst === "stor";
  var T = stor ? TEKST.stor : TEKST.normal;
  var maks = Math.max(opp.maks[s.format] - (stor ? 1 : 0), 3);
  var harDetaljer = kal.liste.some(function (t) { return t.turleder || t.varighet || t.grad || t.pamelding; });
  var romslig = s.format === "story";
  var kompakt = s.oppsett !== "topp";
  var trinn = n <= 4 ? 0 : (n === 5 ? 1 : (n === 6 ? 2 : 3));
  if (harDetaljer) trinn = Math.min(trinn + 1, 3);
  if (kompakt && n > 4) trinn = Math.min(trinn + 1, 3);
  if (romslig) trinn = Math.max(trinn - 1, 0);

  var band = state.visBand ? 88 : 0;
  var storrelser = {
    "--bredde": fmt.bredde + "px", "--hoyde": fmt.hoyde + "px",
    "--chip": T.chip[trinn] + "px", "--chip-smal": T.chipSmal[trinn] + "px",
    "--dag-size": T.dag[trinn] + "px", "--dato-size": T.dato[trinn] + "px", "--dato-size-smal": T.datoSmal[trinn] + "px",
    "--title-size": T.title[trinn] + "px", "--title-size-smal": T.titleSmal[trinn] + "px",
    "--meta-size": T.meta[trinn] + "px", "--detalj-size": T.detalj + "px", "--tid-size": T.tid[trinn] + "px",
    "--rad-luft": T.luft[trinn] + "px",
    "--kort-gap": [20, 16, 13, 11][trinn] + "px", "--kort-pad": "32px"
  };

  // «Bilde øverst»: radene får sin naturlige høyde med fast luft, og fotoet tar resten,
  // men aldri mindre enn før (330 px i innlegg, 780 i historie). Med få turer blir fotoet
  // stort, med mange blir det som før (16. oktober 2026). Høyden må være kjent her, fordi
  // utsnittet regnes ut i px for fotoflaten (bakgrunn()).
  var heroMin = s.format === "story" ? 780 : 330;
  var heroH = heroMin;
  if (s.oppsett === "topp" && synlige.length) {
    var raderH = maalHoyde('<div class="p-rader">' + synlige.map(function (t) { return malRad(t, true, false); }).join("") + "</div>", storrelser);
    heroH = Math.max(heroMin, fmt.hoyde - band - raderH);
  }

  var fotoFlate = s.oppsett === "topp" ? [fmt.bredde, heroH] : [fmt.bredde, fmt.hoyde];
  var u = s.utsnitt[s.format];
  var bilde = kildeBilde(fotoFlate[0], fotoFlate[1]);
  var bg = bakgrunn(bilde, fotoFlate[0], fotoFlate[1], u);

  // Tittel og overlinje skal helst stå på én linje. 170 px er reservert til
  // logoen uansett om den vises, så layouten ikke hopper.
  var SOCIAL_EXT = '500 {px}px "ABC Social Extended"';
  var tittelHero = tilpassStorrelse(kal.tittel, TITTELFONT, TITTELSPORING, fmt.bredde - 56 - 170, 92, 56);
  var overlinje = tilpassStorrelse([(kal.navn || "").toUpperCase(), kal.periode].filter(Boolean).join("    "), SOCIAL_EXT, 0.18, fmt.bredde - 56 - 170, 24, 18);

  return {
    mal: s.mal, kal: kal,
    fmt: fmt, opp: opp, synlige: synlige, maks: maks, stor: stor, trinn: trinn, u: bg.u,
    forstorrelse: bg.forstorrelse, langside: bg.langside,
    forMange: synlige.length > maks,
    bilde: bilde,
    eksempel: aktivtEksempel(fotoFlate[0], fotoFlate[1]),
    tittelBryt: tittelHero.bryt,
    vars: Object.assign(storrelser, {
      "--hero-h": heroH + "px",
      "--bg-str": bg.bgStr, "--bg-pos": bg.bgPos,
      "--tittel-size": tittelHero.px + "px",
      "--overlinje-size": overlinje.px + "px",
      "--turbo-h": "200px", "--band-h": band + "px"
    })
  };
}
