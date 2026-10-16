/* Forhåndsvisningen: tegning av plakaten, plassjekk, skalering, bunnlinjen
   og bildet over hele skjermen på mobil. */
import { beregn } from "./beregn.js";
import { MAKS_FORSTORRELSE } from "./bilder.js";
import { $, $$, aktivtNivaa, erKalender } from "./hjelpere.js";
import { malKarusellSide } from "./karusell.js";
import { FORMATER } from "./konstanter.js";
import { MALER, MALER_ARR } from "./maler.js";
import { vanligStatus } from "./skjema.js";
import { state } from "./tilstand.js";

export var el = {};
export function finnElementer() {
  el.plakat = $("#plakat"); el.skala = $("#plakat-skala"); el.ramme = $("#ramme");
  el.turliste = $("#turliste"); el.formange = $("#formange"); el.lastNed = $("#last-ned");
  el.nedlastingHjelp = $("#nedlasting-hjelp"); el.feil = $("#feil"); el.bildenavn = $("#bildenavn");
  el.kreditering = $("#kreditering"); el.nyttEksempel = $("#nytt-eksempel");
  el.posttekst = $("#posttekst"); el.hytteValg = $("#hytte-valg");
  el.karusellNav = $("#karusell-nav"); el.karusellTekst = $("#karusell-tekst");
  el.karusellForrige = $("#karusell-forrige"); el.karusellNeste = $("#karusell-neste");
  el.lastNedEtt = $("#last-ned-ett"); el.opplosning = $("#opplosning");
  el.forhandsvisning = $("#forhandsvisning"); el.lagre = $("#lagre"); el.klar = $("#klar");
  el.mini = $("#mini"); el.bunnlinjeStatus = $("#bunnlinje-status"); el.seBildet = $("#se-bildet");
  el.bunnlinjeLagre = $("#bunnlinje-lagre"); el.lukkBildet = $("#lukk-bildet"); el.appVarsel = $("#app-varsel");
}

// Skriver bare når teksten er ny, så skjermlesere ikke leser opp det samme ved hvert tastetrykk.
export function settTekst(e, tekst) {
  if (e.textContent !== tekst) e.textContent = tekst;
}

// Advarselen over nedlastingsknappen. Tom tekst skjuler den. Den korte teksten vises
// i linjen nederst på mobil, der forhåndsvisningen er lukket mens skjemaet fylles ut.
var advarselKort = "";
export function visAdvarsel(tekst, kort) {
  el.formange.hidden = !tekst;
  settTekst(el.formange, tekst || "");
  advarselKort = tekst ? (kort || "Se advarselen ved bildet") : "";
  renderBunnlinjeStatus();
}

export function renderBunnlinjeStatus() {
  if (!el.bunnlinjeStatus) return;
  settTekst(el.bunnlinjeStatus, advarselKort || vanligStatus);
  el.bunnlinjeStatus.classList.toggle("bunnlinje__varsel", Boolean(advarselKort));
}

/* ---------- Brede og smale skjermer ----------
   Fra 900 px står forhåndsvisningen fast ved siden av skjemaet. Under 900 px har siden en
   fast linje nederst, og forhåndsvisningen åpnes over hele skjermen (body.viser-bildet).
   Den lukkede forhåndsvisningen er usynlig, men fortsatt lagt ut, så sjekkPlass() og
   miniatyren kan måle den. */
var BRED = window.matchMedia ? window.matchMedia("(min-width: 900px)") : null;
export function bredSkjerm() { return BRED ? BRED.matches : true; }
export function arkApent() { return document.body.classList.contains("viser-bildet"); }

var arkKilde = null;
export function apneBildet(kilde) {
  if (bredSkjerm() || arkApent()) return;
  arkKilde = kilde || null;
  document.body.classList.add("viser-bildet");
  var fv = el.forhandsvisning;
  fv.setAttribute("role", "dialog");
  fv.setAttribute("aria-modal", "true");
  fv.scrollTop = 0;
  if (el.seBildet) el.seBildet.setAttribute("aria-expanded", "true");
  skalerForhandsvisning();
  if (el.lukkBildet) el.lukkBildet.focus({ preventScroll: true });
}

export function lukkBildet() {
  if (!arkApent()) return;
  document.body.classList.remove("viser-bildet");
  el.forhandsvisning.removeAttribute("role");
  el.forhandsvisning.removeAttribute("aria-modal");
  if (el.seBildet) el.seBildet.setAttribute("aria-expanded", "false");
  skalerForhandsvisning();
  if (sist) oppdaterMini(sist);
  if (arkKilde && arkKilde.focus) arkKilde.focus({ preventScroll: true });
  arkKilde = null;
}

// Miniatyren i linjen nederst er en kopi av plakaten, skalert ned til 56 px høyde.
export function oppdaterMini(b) {
  if (!el.mini || bredSkjerm() || arkApent()) return;
  var kopi = el.plakat.cloneNode(true);
  kopi.removeAttribute("id");
  kopi.className = "plakat-mini";
  var skala = 56 / b.fmt.hoyde;
  var boks = document.createElement("div");
  boks.style.transform = "scale(" + skala + ")";
  boks.appendChild(kopi);
  el.mini.style.width = Math.round(b.fmt.bredde * skala) + "px";
  el.mini.replaceChildren(boks);
}

// Varselet i utsnittsboksen når fotoet forstørres så mye at det blir mykt, både for
// eksempelbilder og egne bilder. Anbefalt størrelse er den som gir ett bildepunkt per punkt.
export function opplosningTekst(b) {
  if (!b.forstorrelse || b.forstorrelse <= MAKS_FORSTORRELSE) return "";
  var ganger = String(Math.round(b.forstorrelse * 10) / 10).replace(".", ",");
  var tekst = "Bildet forstørres " + ganger + " ganger her og kan bli uskarpt. ";
  if (b.u.z > 100) return tekst + "Dra zoomen ned, eller velg et bilde med høyere oppløsning.";
  var anbefalt = Math.ceil(b.langside * b.forstorrelse / 100) * 100;
  return tekst + (state.egetBilde ? "Velg helst et bilde" : "Last opp et eget bilde") +
    " med minst " + anbefalt + " px på lengste side for et skarpt resultat.";
}

// Siste beregning, så knappene i karusellen ikke må regne ut alt på nytt.
export var sist = null;

export function renderPlakat(b) {
  b = b || beregn();
  sist = b;
  var p = el.plakat;
  Object.keys(b.vars).forEach(function (k) { p.style.setProperty(k, b.vars[k]); });
  p.setAttribute("data-mal", state.mal);
  p.setAttribute("data-format", state.format);
  var enkelt = !erKalender(b.mal);
  p.setAttribute("data-oppsett", b.karusell ? "karusell" : (enkelt ? b.nivaa : state.oppsett));
  p.innerHTML = b.karusell ? malKarusellSide(b) : (enkelt ? MALER_ARR[b.nivaa](b) : MALER[state.oppsett](b));
  // Bildeadressen settes direkte på elementet, ikke via CSS-variabel,
  // så data-URL-er fra egne bilder alltid overlever.
  $$("[data-foto]", p).forEach(function (f) { f.style.backgroundImage = 'url("' + String(b.bilde).replace(/"/g, "%22") + '")'; });
  // Plassen sjekkes før skaleringen, så advarselen er med når plassen til bildet regnes ut.
  if (enkelt) sjekkPlass(p);
  else if (!b.karusell && !b.forMange) sjekkListe(p);
  renderKarusellNav(b);
  skalerForhandsvisning(b.fmt);
  oppdaterMini(b);
}

// Bla mellom bildene i karusellen i forhåndsvisningen.
function renderKarusellNav(b) {
  if (!el.karusellNav) return;
  el.karusellNav.hidden = !b.karusell;
  if (!b.karusell) return;
  var navn = { forside: "forsiden", liste: "listen", info: "Godt å vite" }[b.side.type];
  settTekst(el.karusellTekst, "Bilde " + (b.aktiv + 1) + " av " + b.sider.length + ", " + navn);
  // Mens bildene lages, står bla-knappene stille, ellers tegnes feil side.
  el.karusellForrige.disabled = state.laster || b.aktiv === 0;
  el.karusellNeste.disabled = state.laster || b.aktiv >= b.sider.length - 1;
}

// Enkeltplakatene har ingen maksgrense som turkalenderen. I stedet måles
// det om innholdet faktisk får plass, og brukeren advares hvis ikke.
function sjekkPlass(p) {
  var trangt = false;
  var innhold = $(".a-innhold", p);
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
  }
  // På foto vokser teksten oppover fra bunnen (eller nedover fra toppen) og må ikke
  // treffe stempelet. offsetTop er upåvirket av skaleringen i forhåndsvisningen.
  var m = $(".m-innhold, .s-a", p);
  if (m) {
    // Avsenderlinjen øverst på Postkort-nivå er et hinder på samme måte som stempelet.
    var stempel = $(".m-stempel, .s-avsender", p);
    if (m.classList.contains("m-innhold--oppe")) {
      var grense = stempel ? stempel.offsetTop - 24 : p.offsetHeight - 48;
      trangt = m.offsetTop + m.offsetHeight > grense;
    } else {
      var min = stempel ? stempel.offsetTop + stempel.offsetHeight + 24 : 48;
      trangt = m.offsetTop < min;
    }
  }
  var plakatNivaa = aktivtNivaa() === "plakat";
  visAdvarsel(!trangt ? "" : plakatNivaa
    ? "Innholdet får ikke plass i dette formatet. Kort ned teksten, tøm et felt, eller bytt til Historie."
    : "Teksten får ikke plass på fotoet. Kort ned tittelen eller undertittelen, eller velg Plakat for mer tekst.",
    plakatNivaa ? "Innholdet får ikke plass" : "Teksten får ikke plass");
}

// Turkalender og program har maksgrenser som holder for vanlige turmål. Mange turmål over
// to linjer eller mange detaljer kan likevel gjøre listen for høy, og da sier vi fra.
// I «Bilde øverst» renner radene over nederst, i «Stort bilde» når kortet opp i tittelen.
function sjekkListe(p) {
  var trangt = false;
  var rader = $(".p-rader", p);
  if (rader) trangt = rader.scrollHeight > rader.clientHeight + 1;
  var kort = $(".p-kort", p), tekst = $(".p-hero__tekst", p);
  if (kort && tekst) trangt = kort.offsetTop < tekst.offsetTop + tekst.offsetHeight + 24;
  var hva = state.mal === "program" ? "Programmet" : "Turene";
  visAdvarsel(trangt ? hva + " får ikke plass i bildet. Kort ned teksten, fjern turleder og lengde, eller velg Karusell." : "",
    hva + " får ikke plass");
}

// Bildet er maks 540 px bredt. På brede skjermer (festet ved siden av skjemaet) og når det
// er åpnet over hele skjermen på mobil, krympes det i tillegg, så alt fra toppen av
// forhåndsvisningen til og med lagreknappen står innenfor vinduet: tittel, variant,
// karusellknapper og advarsel. Høydene måles, fordi teksten kan gå over flere linjer.
// De andre delene av forhåndsvisningen får samme bredde som bildet (--forh-bredde),
// men ikke smalere enn 380 px, så variantknappen og teksten ved siden av får plass.
export function skalerForhandsvisning(fmt) {
  fmt = fmt || FORMATER[state.format];
  var fv = el.forhandsvisning;
  if (!fv) return;
  var cs = getComputedStyle(fv);
  var kolonne = fv.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
  if (kolonne <= 0) return;
  var maksBredde = Math.min(540, kolonne);
  var tilpass = bredSkjerm() || arkApent();
  var gap = parseFloat(cs.rowGap) || 0;
  var luft = bredSkjerm() ? 28 + 20 : (parseFloat(cs.paddingTop) || 0);
  var skala = maksBredde / fmt.bredde;
  // To runder: bredden på teksten rundt bildet avhenger av skalaen, og høyden av bredden.
  for (var runde = 0; runde < 2; runde++) {
    fv.style.setProperty("--forh-bredde", Math.max(Math.round(fmt.bredde * skala), Math.min(kolonne, 380)) + "px");
    if (!tilpass) break;
    var rundt = 0;
    for (var i = 0; i < fv.children.length; i++) {
      var barn = fv.children[i];
      if (barn !== el.ramme && barn.offsetHeight) rundt += barn.offsetHeight + gap;
      if (barn === el.lagre) break;
    }
    var maksHoyde = window.innerHeight - luft - rundt;
    skala = Math.max(Math.min(maksBredde / fmt.bredde, maksHoyde / fmt.hoyde), 0.2);
  }
  el.skala.style.transform = "scale(" + skala + ")";
  el.ramme.style.width = Math.round(fmt.bredde * skala) + "px";
  el.ramme.style.height = Math.round(fmt.hoyde * skala) + "px";
}
