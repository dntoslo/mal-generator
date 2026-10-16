/* Skjemaet: synlige felt, turlisten, hjelpetekster og knapper som følger
   tilstanden (renderSkjema()). */
import { hytteBilder } from "./bilder.js";
import { el, opplosningTekst, renderBunnlinjeStatus, settTekst, visAdvarsel } from "./forhandsvisning.js";
import { $, $$, aktivtNivaa, avsenderMeta, avsenderNavn, erKalender, listeNokkel, maksTurer, valgtFarge, valgtHytte } from "./hjelpere.js";
import { ARR_TYPER, MALVALG, NIVAA, PLASSERINGER, SESONG_TYPER, SIGNATURER } from "./konstanter.js";
import { byggPosttekst, fotograferFor } from "./posttekst.js";
import { state } from "./tilstand.js";
import { aktivTur, hytteLenke, hytteTurer } from "./valg.js";

function settVerdi(input, verdi) {
  if (document.activeElement === input) return; // ikke overskriv det brukeren skriver i
  if (input.type === "checkbox") input.checked = Boolean(verdi);
  else if (input.value !== String(verdi)) input.value = verdi;
}

// Turen eller programpunktet som er åpent for redigering. De andre er én linje hver.
// -1 betyr at alle er lukket. Hører til skjemaet, ikke til innholdet, og lagres ikke.
var apenTur = -1;
export function settApenTur(i) { apenTur = i; }

function byggTurliste() {
  var mal = $("#tur-rad");
  var program = state.mal === "program";
  el.turliste.innerHTML = "";
  state[listeNokkel()].forEach(function (t, i) {
    var rad = mal.content.firstElementChild.cloneNode(true);
    rad.setAttribute("data-index", i);
    $(".tur__nummer", rad).textContent = (program ? "PUNKT " : "TUR ") + (i + 1);
    // Knappene får nummeret i navnet, så skjermlesere skiller «Fjern tur 2» fra «Fjern tur 3».
    var hva = (program ? "punkt " : "tur ") + (i + 1);
    [["opp", "Flytt " + hva + " opp"], ["ned", "Flytt " + hva + " ned"], ["fjern", "Fjern " + hva], ["lukk", "Ferdig med " + hva]].forEach(function (par) {
      $("[data-handling=" + par[0] + "]", rad).setAttribute("aria-label", par[1]);
    });
    $(".tur__tittel-etikett", rad).textContent = program ? "Aktivitet" : "Turmål";
    $(".tur__sted-etikett", rad).textContent = program ? "Sted" : "Startsted";
    $("[data-felt=sted]", rad).placeholder = program ? "F.eks. peisestua" : "";
    el.turliste.appendChild(rad);
  });
  el.turliste.setAttribute("data-liste", listeNokkel());
}

export function renderTurliste(byggNy) {
  var liste = state[listeNokkel()];
  var program = state.mal === "program";
  if (el.turliste.getAttribute("data-liste") !== listeNokkel() || apenTur >= liste.length) apenTur = -1;
  if (byggNy || el.turliste.children.length !== liste.length || el.turliste.getAttribute("data-liste") !== listeNokkel()) byggTurliste();
  $$(".tur", el.turliste).forEach(function (rad, i) {
    var t = liste[i];
    $$("[data-felt]", rad).forEach(function (input) { settVerdi(input, t[input.getAttribute("data-felt")]); });
    var apen = i === apenTur;
    rad.classList.toggle("tur--apen", apen);
    $(".turrad", rad).hidden = apen;
    $(".tur__skjema", rad).hidden = !apen;
    // Linjen viser det som står i bildet: dag, dato, turmål, klokkeslett og sted.
    var tom = !((t.tittel || "").trim() || (t.sted || "").trim() || (t.dato || "").trim());
    settTekst($(".turrad__dag", rad), t.dag || "");
    settTekst($(".turrad__tall", rad), (t.dato || "").trim());
    settTekst($(".turrad__tittel", rad), (t.tittel || "").trim() || (program ? "Nytt punkt" : "Ny tur"));
    settTekst($(".turrad__meta", rad), tom ? "Tom, vises ikke i bildet"
      : [t.tid ? "kl. " + t.tid : "", (t.sted || "").trim()].filter(Boolean).join(", "));
    $("[data-handling=opp]", rad).disabled = i === 0;
    $("[data-handling=ned]", rad).disabled = i === liste.length - 1;
  });
  $("#legg-til").disabled = liste.length >= maksTurer();
}

function synlig(e) {
  var mal = e.getAttribute("data-mal");
  var avs = e.getAttribute("data-avsender");
  var niv = e.getAttribute("data-nivaa");
  var fmt = e.getAttribute("data-format");
  var arr = e.getAttribute("data-arr-type");
  if (mal && mal.split(" ").indexOf(state.mal) < 0) return false;
  if (avs && avs !== state.avsender) return false;
  if (niv && niv.split(" ").indexOf(aktivtNivaa()) < 0) return false;
  if (fmt && fmt.split(" ").indexOf(state.format) < 0) return false;
  if (arr && arr.split(" ").indexOf(state.arrType) < 0) return false;
  return true;
}

// Mobiler med delingsark kan dele alle bildene i karusellen på én gang.
export function mobilDeling() {
  return Boolean(navigator.canShare && window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
}

function variantTekst(b) {
  if (b.karusell) return "Forside: " + valgtFarge().beskrivelse + " merkelapp, " + PLASSERINGER[state.plassering] + ".";
  if (erKalender(b.mal)) return "Oppsett: " + (state.oppsett === "topp" ? "Bilde øverst." : "Stort bilde.");
  if (b.nivaa === "postkort") return "Signatur: " + SIGNATURER[state.signatur].navn + ". " + SIGNATURER[state.signatur].tekst;
  var f = valgtFarge().beskrivelse;
  if (b.nivaa === "plakat") return "Variant: " + f + " merkelapp.";
  return "Variant: " + f + " merkelapp, " + PLASSERINGER[state.plassering] + ".";
}

// Statusteksten i bunnlinjen på mobil når det ikke er noen advarsel. Settes i renderSkjema().
export var vanligStatus = "";

export function renderSkjema(b, byggTurlisteNy) {
  var enkelt = !erKalender(state.mal);

  $$("[data-gruppe]").forEach(function (gruppe) {
    var navn = gruppe.getAttribute("data-gruppe");
    $$("button", gruppe).forEach(function (kn) {
      var aktiv = kn.getAttribute("data-verdi") === state[navn];
      kn.classList.toggle("aktiv", aktiv);
      kn.setAttribute("aria-pressed", aktiv ? "true" : "false");
    });
  });

  $$(".panel [data-mal], .panel [data-avsender], .panel [data-nivaa], .panel [data-format], .panel [data-arr-type]").forEach(function (e) { e.hidden = !synlig(e); });
  // Valg som ikke endrer bildet, vises ikke: signaturene har faste størrelser, og
  // postkortet med lys kant (C) har verken bånd eller Turbo.
  var postkort = aktivtNivaa() === "postkort";
  if ($("#tekst-felt") && postkort) $("#tekst-felt").hidden = true;
  if ($("#detaljer-felt")) $("#detaljer-felt").hidden = postkort && state.signatur === "c";
  if ($("#mal-hjelp")) $("#mal-hjelp").textContent = MALVALG[state.mal].hjelp;
  if ($("#nivaa-hjelp") && enkelt) $("#nivaa-hjelp").textContent = NIVAA[aktivtNivaa()].tekst;
  if ($("#signatur-hjelp")) $("#signatur-hjelp").textContent = SIGNATURER[state.signatur].tekst;
  if ($("#arr-type-hjelp")) $("#arr-type-hjelp").textContent = ARR_TYPER[state.arrType].hjelp;
  if ($("#sesong-type-hjelp")) $("#sesong-type-hjelp").textContent = SESONG_TYPER[state.sesongType].hjelp + " Eksempelteksten byttes når du velger type, det du har skrevet selv blir stående.";
  var def = SESONG_TYPER[state.sesongType].fakta;
  if ($("#sesong-fakta1-etikett")) settTekst($("#sesong-fakta1-etikett"), def[0][0]);
  if ($("#sesong-fakta2-etikett")) settTekst($("#sesong-fakta2-etikett"), def[1][0]);

  // Hyttelisten og lenken til hytta
  if (el.hytteValg) settVerdi(el.hytteValg, state.hytte);
  var h = valgtHytte();
  var lenkeBoks = $("#hytte-lenke");
  if (lenkeBoks) {
    lenkeBoks.hidden = !h;
    if (h) $("#hytte-lenke-tekst").textContent = hytteLenke(h);
  }
  if ($("#post-navn")) $("#post-navn").placeholder = "Tomt gir " + (avsenderNavn() || "hyttas navn");
  if ($("#post-meta")) $("#post-meta").placeholder = avsenderMeta() ? "Tomt gir " + avsenderMeta() : "F.eks. Østmarka";

  $("#format-hjelp").textContent = b.fmt.navn + ", " + b.fmt.tekst;
  // Fra 16. oktober 2026 er det man leser for å bli med, minst 30 px i normal størrelse.
  var normalTekst = "Normal tekst: steder og klokkeslett er minst 30 px, som er lett å lese på mobil.";
  $("#tekst-hjelp").textContent = b.karusell
    ? (b.stor ? "Stor tekst: lettere å lese, og listen fordeles på flere bilder." : normalTekst)
    : enkelt
    ? (b.stor ? "Stor tekst: litt større informasjon og brødtekst." : "Normal tekst: lett å lese på mobil.")
    : (b.stor ? "Stor tekst: enda lettere å lese i feeden, men det blir plass til én tur mindre." : normalTekst);
  if (!enkelt && !b.karusell) $("#oppsett-hjelp").textContent = b.opp.tekst + " Plass til " + b.maks + (state.mal === "program" ? " punkter" : " turer") + " i dette formatet.";
  if ($("#liste-etikett")) settTekst($("#liste-etikett"), (state.mal === "program" ? "Programmet" : "Turene") + " (" + state[listeNokkel()].length + ")");
  $("#legg-til").textContent = state.mal === "program" ? "+ Legg til punkt" : "+ Legg til tur";
  el.bildenavn.textContent = state.bildenavn;
  // Med turforslag kommer fotoet fra turen. «Nytt turforslag» bytter tur og foto.
  var tur = aktivTur();
  el.nyttEksempel.hidden = state.egetBilde || Boolean(tur && tur.bilde);
  var turBoks = $("#tur-boks");
  if (turBoks) {
    var turer = hytteTurer();
    turBoks.hidden = !synlig(turBoks) || !turer.length;
    $("#nytt-turforslag").hidden = turer.length < 2;
    $("#tur-hjelp").textContent = tur
      ? "Tur " + (turer.indexOf(tur) + 1) + " av " + turer.length + " ved " + valgtHytte().kortnavn +
        ". Lenken til UT.no kommer med i posteteksten. Endre gjerne teksten."
      : "";
  }
  el.nyttEksempel.textContent = hytteBilder() ? "Nytt bilde fra hytta" : "Nytt eksempelbilde";
  if (state.egetBilde) {
    el.kreditering.hidden = true;
  } else {
    el.kreditering.hidden = false;
    var fotografer = fotograferFor(b);
    el.kreditering.textContent = fotografer.length
      ? (fotografer.length > 1 ? "Bildene er tatt av " : "Bildet er tatt av ") + fotografer.join(" og ") +
        ". Husk å kreditere i posteteksten: Foto: " + fotografer.join(" og ") + "."
      : "Husk å kreditere fotografen i posteteksten når du bruker et eksempelbilde.";
  }

  $$("[data-utsnitt]").forEach(function (r) { settVerdi(r, b.u[r.getAttribute("data-utsnitt")]); });
  if (el.opplosning) {
    var myk = opplosningTekst(b);
    el.opplosning.hidden = !myk;
    settTekst(el.opplosning, myk);
  }
  $$(".tekstfelt[data-felt]").forEach(function (f) {
    var k = f.getAttribute("data-felt");
    if (state[k] !== undefined) settVerdi(f, state[k]);
  });
  if ($("#vis-logo")) settVerdi($("#vis-logo"), state.visLogo);
  if ($("#vis-merke")) settVerdi($("#vis-merke"), state.visMerke);
  if ($("#vis-band")) settVerdi($("#vis-band"), state.visBand);
  if ($("#lenke-felt")) $("#lenke-felt").hidden = !state.visBand;
  if ($("#vis-turbo")) settVerdi($("#vis-turbo"), state.visTurbo);
  if ($("#kort-glass")) settVerdi($("#kort-glass"), state.kortGlass);
  if ($("#kort-glass-felt")) $("#kort-glass-felt").hidden = enkelt || state.oppsett !== "bakgrunn";

  renderTurliste(byggTurlisteNy);

  // Statuslinjen nederst på mobil. Advarsler går foran (visAdvarsel).
  var klare = state.delingsFiler ? state.delingsFiler.length : 0;
  vanligStatus = state.laster ? (b.karusell ? "Lager bildene …" : "Lager bildet …")
    : klare ? (klare > 1 ? "Bildene er klare" : "Bildet er klart")
    : b.karusell ? "Karusell, " + b.sider.length + " bilder" : b.fmt.navn + ", " + b.fmt.bredde + " × " + b.fmt.hoyde;
  if (b.karusell) {
    visAdvarsel(b.forStor ? "En dag har flere punkter enn det er plass til på ett bilde. Kort ned teksten, fjern et punkt, eller velg Normal tekst." : "",
      "En dag får ikke plass");
  } else if (!enkelt) {
    var hvaListe = state.mal === "program" ? " punkter" : " turer";
    visAdvarsel(b.forMange ? b.synlige.length + hvaListe + " får ikke plass i dette oppsettet (maks " + b.maks +
      "). Velg «Bilde øverst», bytt til Karusell eller Historie, eller del listen i to bilder." : "",
      b.synlige.length + hvaListe + " får ikke plass");
  } else {
    renderBunnlinjeStatus();
  }

  // Lagring. På mobil med delingsark lages bildet først, og neste trykk åpner delingsarket,
  // fordi telefonen krever et nytt trykk før delingsarket kan åpnes. På datamaskin lastes
  // bildet ned med en gang.
  el.lastNed.disabled = b.forMange || state.laster;
  var deling = mobilDeling();
  if (b.karusell) {
    var antall = b.sider.length;
    el.lastNed.textContent = state.laster ? "Lager bildene …"
      : klare > 1 ? "Lagre eller del de " + klare + " bildene"
      : klare === 1 ? "Lagre eller del bildet"
      : deling ? "Lag de " + antall + " bildene" : "Last ned alle " + antall + " bildene";
    el.nedlastingHjelp.textContent = klare ? ""
      : "Karusellen blir " + antall + " bilder i 1080 × 1350 px. Legg dem i samme innlegg, i denne rekkefølgen." +
        (deling ? "" : " Nettleseren kan spørre om lov til å laste ned flere filer.");
  } else {
    el.lastNed.textContent = state.laster ? "Lager bildet …" : b.forMange ? "For mange punkter for dette oppsettet"
      : deling || klare ? "Lagre eller del" : "Last ned bildet";
    el.nedlastingHjelp.textContent = klare ? "" : "Bildet lagres i " + b.fmt.tekst + " og er klart til å legges rett ut.";
  }
  el.klar.hidden = !klare;
  if (klare) {
    el.klar.innerHTML = klare > 1
      ? "<strong>Bildene er klare.</strong> Trykk på knappen en gang til, og velg «Lagre bilder», eller del dem rett til Instagram."
      : "<strong>Bildet er klart.</strong> Trykk på knappen en gang til, og velg «Lagre bilde» for å legge det i Bilder.";
  }
  if (el.lastNedEtt) el.lastNedEtt.hidden = !b.karusell || state.laster;
  if (el.bunnlinjeLagre) {
    el.bunnlinjeLagre.disabled = el.lastNed.disabled;
    settTekst(el.bunnlinjeLagre, state.laster ? "Lager …" : deling || klare ? "Lagre eller del" : "Last ned");
  }
  if ($("#variant-hjelp")) $("#variant-hjelp").textContent = variantTekst(b);
  if (el.posttekst) el.posttekst.value = byggPosttekst(b);

}
