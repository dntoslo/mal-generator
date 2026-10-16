/* Eksport: PNG med html2canvas fra en skjult 1:1-klone, nedlasting og delingsark. */
import { beregn } from "./beregn.js";
import { bildeMal, malBilde } from "./bilder.js";
import { el, renderPlakat } from "./forhandsvisning.js";
import { erKalender, erKarusell, slug, valgtHytte } from "./hjelpere.js";
import { oppdater } from "./render.js";
import { mobilDeling } from "./skjema.js";
import { state } from "./tilstand.js";

export function visFeil(melding) {
  el.feil.textContent = melding;
  el.feil.hidden = !melding;
}

function ventPaaBilde(src) {
  return new Promise(function (resolve) {
    var img = new Image();
    img.onload = function () {
      if (img.decode) img.decode().then(resolve, resolve); else resolve();
    };
    img.onerror = resolve;
    img.src = src;
  });
}

function tilBlob(canvas) {
  return new Promise(function (resolve, reject) {
    if (!canvas.toBlob) {
      try { resolve(dataUrlTilBlob(canvas.toDataURL("image/png"))); } catch (e) { reject(e); }
      return;
    }
    canvas.toBlob(function (blob) { blob ? resolve(blob) : reject(new Error("Kunne ikke lage bildefil")); }, "image/png");
  });
}

function dataUrlTilBlob(url) {
  var deler = url.split(","), bin = atob(deler[1]), bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: "image/png" });
}

function lastNedBlob(blob, filnavn) {
  var url = URL.createObjectURL(blob);
  var stotterNedlasting = "download" in HTMLAnchorElement.prototype;
  if (stotterNedlasting) {
    var a = document.createElement("a");
    a.href = url; a.download = filnavn; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
  } else {
    var vindu = window.open(url, "_blank");
    if (!vindu) throw new Error("Nettleseren blokkerte åpning av bildet. Tillat popup-vinduer og prøv igjen.");
    visFeil("Bildet åpnet i en ny fane. Hold inne på bildet og velg «Lagre bilde».");
  }
  setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
}

function filnavn(b) {
  var h = valgtHytte();
  var forst = h ? h.id : slug(state.turlag);
  if (erKalender(b.mal)) return b.mal + "-" + forst;
  var tittel = b.nivaa === "postkort" ? b.sig.navn : b.innhold.tittel;
  return b.mal + "-" + (h ? forst + "-" : "") + slug(tittel);
}

function vent(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

// Venter til malBilde() har målt bildet, så bakgrunnsstørrelsen er riktig før eksport.
async function ventPaaMaal(src) {
  malBilde(src);
  for (var i = 0; i < 100 && !bildeMal[src]; i++) await vent(20);
}

// Lager PNG av plakaten slik den står i forhåndsvisningen nå, fra en skjult 1:1-klone,
// så forhåndsvisningen ikke blinker og skaleringen ikke påvirker målene.
async function eksporterPlakat(b) {
  var klone = el.plakat.cloneNode(true);
  klone.id = "";
  klone.className = "eksport-klone";
  document.body.appendChild(klone);
  try {
    var canvas = await window.html2canvas(klone, {
      scale: 1, useCORS: true, backgroundColor: null, logging: false,
      width: b.fmt.bredde, height: b.fmt.hoyde,
      windowWidth: b.fmt.bredde, windowHeight: b.fmt.hoyde
    });
    if (canvas.width !== b.fmt.bredde || canvas.height !== b.fmt.hoyde) {
      console.warn("Uventet størrelse på eksport:", canvas.width, canvas.height);
    }
    return await tilBlob(canvas);
  } finally {
    if (klone.parentNode) klone.parentNode.removeChild(klone);
  }
}

// Delingsark virker bare med et nytt trykk fra brukeren, så på mobil lages bildene
// først og deles i neste trykk.
function kanDeleFiler(filer) {
  try { return mobilDeling() && navigator.canShare({ files: filer }); } catch (e) { return false; }
}

async function delFiler(filer) {
  try {
    await navigator.share({ files: filer });
  } catch (e) {
    if (e && e.name === "AbortError") return;
    visFeil("Delingen virket ikke på denne enheten. Prøv å laste ned bildene på en datamaskin.");
  }
}

// Lager alle bildene i karusellen ett for ett i forhåndsvisningen. På datamaskin lastes de
// ned etter hverandre, på mobil med delingsark kan de deles eller lagres i ett trykk.
async function lastNedKarusell() {
  if (state.laster) return;
  if (state.delingsFiler) { delFiler(state.delingsFiler); return; }
  if (!window.html2canvas) { visFeil("Eksportbiblioteket ble ikke lastet. Last siden på nytt og prøv igjen."); return; }

  visFeil("");
  oppdater({ laster: true }, { lagre: false });
  var aktiv = state.karusellSide;
  var filer = [];
  try {
    await document.fonts.ready;
    var antall = beregn().sider.length;
    for (var i = 0; i < antall; i++) {
      state.karusellSide = i;
      var b = beregn();
      await ventPaaBilde(b.bilde);
      await ventPaaMaal(b.bilde);
      // Siden settes på nytt rett før tegningen, i tilfelle noe har rendret i mellomtiden.
      state.karusellSide = i;
      b = beregn();
      renderPlakat(b);
      var blob = await eksporterPlakat(b);
      filer.push(new File([blob], filnavn(b) + "-karusell-" + (i + 1) + ".png", { type: "image/png" }));
    }
  } catch (e) {
    console.error(e);
    filer = [];
    visFeil("Det gikk ikke å lage bildene: " + (e && e.message ? e.message : "ukjent feil") +
      ". Prøv en annen nettleser (Chrome, Edge eller Safari), eller se «Får du ikke lastet ned?» under.");
  } finally {
    state.karusellSide = aktiv;
  }

  if (filer.length && kanDeleFiler(filer)) {
    oppdater({ laster: false, delingsFiler: filer }, { lagre: false, beholdFiler: true });
    return;
  }
  oppdater({ laster: false }, { lagre: false });
  for (var j = 0; j < filer.length; j++) {
    lastNedBlob(filer[j], filer[j].name);
    await vent(400);
  }
}

// Ett bilde. På mobil med delingsark lages bildet først og deles i neste trykk, som i
// karusellen, så det kan lagres i Bilder. Ellers lastes det ned som fil med en gang.
export async function lastNed() {
  if (state.laster) return;
  if (state.delingsFiler && state.delingsFiler.length === 1) { delFiler(state.delingsFiler); return; }
  var b = beregn();
  if (b.forMange) return;
  if (!window.html2canvas) { visFeil("Eksportbiblioteket ble ikke lastet. Last siden på nytt og prøv igjen."); return; }

  visFeil("");
  oppdater({ laster: true }, { lagre: false });
  var klar = null;

  try {
    await document.fonts.ready;
    await ventPaaBilde(b.bilde);
    // Bildet må være målt, ellers står bakgrunnen med «cover» i stedet for utsnittet.
    await ventPaaMaal(b.bilde);
    b = beregn();
    renderPlakat(b);
    var blob = await eksporterPlakat(b);
    var navn = filnavn(b) + "-" + state.format + (b.karusell ? "-" + (b.aktiv + 1) : "") + ".png";
    var fil = mobilDeling() ? new File([blob], navn, { type: "image/png" }) : null;
    if (fil && kanDeleFiler([fil])) klar = [fil];
    else lastNedBlob(blob, navn);
  } catch (e) {
    console.error(e);
    visFeil("Det gikk ikke å lage bildet: " + (e && e.message ? e.message : "ukjent feil") +
      ". Prøv en annen nettleser (Chrome, Edge eller Safari), eller se «Får du ikke lastet ned?» under.");
  } finally {
    oppdater({ laster: false, delingsFiler: klar }, { lagre: false, beholdFiler: Boolean(klar) });
  }
}

// Hovedknappen, både under bildet og i linjen nederst på mobil.
export function lagreEllerDel() {
  if (state.delingsFiler) { delFiler(state.delingsFiler); return; }
  if (erKarusell()) lastNedKarusell(); else lastNed();
}
