/* Hendelser i skjemaet og forhåndsvisningen. */
import { brukEksempelbilder } from "./bilder.js";
import { lagreEllerDel, lastNed, visFeil } from "./eksport.js";
import { apneBildet, arkApent, bredSkjerm, el, lukkBildet, oppdaterMini, sist, skalerForhandsvisning } from "./forhandsvisning.js";
import { $, $$, listeNokkel, maksTurer, valgtHytte } from "./hjelpere.js";
import { tomLagring } from "./lagring.js";
import { oppdater, oppdaterSnart, render } from "./render.js";
import { renderTurliste, settApenTur } from "./skjema.js";
import { nyTur, nyttUtsnitt, sesongPreset, standardSkjema, state } from "./tilstand.js";
import { hytteLenke, nesteTur, nyVariant, velgAvsender, velgHytte, velgSesongType } from "./valg.js";

// Frigjør objektadressen til et eget bilde som ikke lenger brukes.
function frigjor(adresse) {
  if (/^blob:/.test(adresse || "")) URL.revokeObjectURL(adresse);
}

function kopier(tekst, knapp, ferdigTekst, vanligTekst, reserve) {
  var ferdig = function () {
    knapp.textContent = ferdigTekst;
    setTimeout(function () { knapp.textContent = vanligTekst; }, 2000);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(tekst).then(ferdig, function () { if (reserve) reserve.select(); });
  } else if (reserve) {
    reserve.select();
    try { document.execCommand("copy"); ferdig(); } catch (e) { /* brukeren kan kopiere manuelt */ }
  }
}

export function kobleHendelser() {
  // Knappegrupper. Avsender og sesongtype har sideeffekter, resten settes rett.
  $$("[data-gruppe]").forEach(function (gruppe) {
    gruppe.addEventListener("click", function (e) {
      var kn = e.target.closest("button[data-verdi]");
      if (!kn) return;
      var navn = gruppe.getAttribute("data-gruppe");
      var verdi = kn.getAttribute("data-verdi");
      if (navn === "avsender") return velgAvsender(verdi);
      if (navn === "sesongType") return velgSesongType(verdi);
      var patch = {}; patch[navn] = verdi;
      oppdater(patch, { turliste: navn === "mal" });
    });
  });

  // Tekstfelter, nedtrekk og tekstområder utenfor turlisten
  $$(".tekstfelt[data-felt]").forEach(function (felt) {
    var handler = function (e) {
      var patch = {}; patch[felt.getAttribute("data-felt")] = felt.value;
      if (e.type === "input") oppdaterSnart(patch); else oppdater(patch);
    };
    felt.addEventListener("input", handler);
    if (felt.tagName === "SELECT") felt.addEventListener("change", handler);
  });

  if (el.hytteValg) el.hytteValg.addEventListener("change", function () { velgHytte(el.hytteValg.value); });
  if ($("#kopier-hyttelenke")) $("#kopier-hyttelenke").addEventListener("click", function (e) {
    var h = valgtHytte();
    if (h) kopier(hytteLenke(h), e.target, "Kopiert", "Kopier lenken", null);
  });

  // Avkryssinger. Sjekkes for null, så en hurtigbufret index.html uten
  // elementene ikke stopper resten av oppstarten.
  if ($("#vis-logo")) $("#vis-logo").addEventListener("change", function (e) { oppdater({ visLogo: e.target.checked }); });
  if ($("#vis-merke")) $("#vis-merke").addEventListener("change", function (e) { oppdater({ visMerke: e.target.checked }); });
  if ($("#vis-band")) $("#vis-band").addEventListener("change", function (e) { oppdater({ visBand: e.target.checked }); });
  if ($("#kort-glass")) $("#kort-glass").addEventListener("change", function (e) { oppdater({ kortGlass: e.target.checked }); });
  if ($("#vis-turbo")) $("#vis-turbo").addEventListener("change", function (e) { oppdater({ visTurbo: e.target.checked }); });

  // Utsnitt
  $$("[data-utsnitt]").forEach(function (r) {
    r.addEventListener("input", function () {
      var u = Object.assign({}, state.utsnitt);
      u[state.format] = Object.assign({}, u[state.format]);
      u[state.format][r.getAttribute("data-utsnitt")] = Number(r.value);
      oppdaterSnart({ utsnitt: u });
    });
  });
  // Midtstill går tilbake til standardutsnittet: motivet (fokuspunktet) i midten og 100 %.
  // Et eget bilde har ikke noe fokuspunkt og blir midtstilt.
  $("#midtstill").addEventListener("click", function () {
    var u = Object.assign({}, state.utsnitt);
    u[state.format] = nyttUtsnitt()[state.format];
    oppdater({ utsnitt: u });
  });

  if ($("#nytt-turforslag")) $("#nytt-turforslag").addEventListener("click", nesteTur);

  el.nyttEksempel.addEventListener("click", function () {
    $("#bilde-fil").value = "";
    var forrige = state.egetBilde ? state.bilde : "";
    oppdater(brukEksempelbilder(!state.egetBilde));
    frigjor(forrige);
  });

  // Eget bilde. En objektadresse (blob:) i stedet for data-URL, så ikke flere MB med tekst
  // følger med i hver render. Bildet prøves først, så filer nettleseren ikke kan vise
  // (f.eks. HEIC i Chrome) gir en melding i stedet for en tom plakat.
  $("#bilde-fil").addEventListener("change", function (e) {
    var fil = e.target.files && e.target.files[0];
    if (!fil) return;
    if (!/^image\//.test(fil.type)) { visFeil("Filen er ikke et bilde. Velg en JPG- eller PNG-fil."); return; }
    var url = URL.createObjectURL(fil);
    var proeve = new Image();
    proeve.onload = function () {
      visFeil("");
      var forrige = state.egetBilde ? state.bilde : "";
      oppdater({ bilde: url, egetBilde: true, bildenavn: fil.name, utsnitt: nyttUtsnitt() });
      frigjor(forrige);
    };
    proeve.onerror = function () {
      URL.revokeObjectURL(url);
      e.target.value = "";
      visFeil("Nettleseren kan ikke vise dette bildet. Velg en JPG- eller PNG-fil. Bilder fra iPhone (HEIC) kan du eksportere som JPG først.");
    };
    proeve.src = url;
  });

  // Turliste og program: skriving og valg
  function turHendelse(e) {
    var input = e.target.closest("[data-felt]");
    var rad = e.target.closest(".tur");
    if (!input || !rad) return;
    var i = Number(rad.getAttribute("data-index"));
    var felt = input.getAttribute("data-felt");
    var nokkel = listeNokkel();
    var liste = state[nokkel].slice();
    liste[i] = Object.assign({}, liste[i]);
    liste[i][felt] = input.type === "checkbox" ? input.checked : input.value;
    var patch = {}; patch[nokkel] = liste;
    if (e.type === "input") oppdaterSnart(patch); else oppdater(patch);
  }
  el.turliste.addEventListener("input", turHendelse);
  el.turliste.addEventListener("change", turHendelse);

  // Turliste og program: åpne, lukke, flytte og fjerne
  el.turliste.addEventListener("click", function (e) {
    var kn = e.target.closest("button[data-handling]");
    var rad = e.target.closest(".tur");
    if (!kn || !rad) return;
    var i = Number(rad.getAttribute("data-index"));
    var handling = kn.getAttribute("data-handling");
    // Åpne og lukke endrer bare skjemaet, ikke bildet. Ved åpning får nummeret fokus,
    // ikke et tekstfelt, så tastaturet på mobil ikke spretter opp før brukeren vil skrive.
    if (handling === "apne" || handling === "lukk") {
      settApenTur(handling === "apne" ? i : -1);
      renderTurliste();
      var denne = el.turliste.children[i];
      if (denne) $(handling === "apne" ? ".tur__nummer" : ".turrad", denne).focus();
      return;
    }
    var nokkel = listeNokkel();
    var liste = state[nokkel].slice();
    var j = i;
    if (handling === "fjern") {
      liste.splice(i, 1);
      j = Math.min(i, liste.length - 1);
      settApenTur(-1);
    } else {
      j = handling === "opp" ? i - 1 : i + 1;
      if (j < 0 || j >= liste.length) return;
      var t = liste[i]; liste[i] = liste[j]; liste[j] = t;
      settApenTur(j);
    }
    var patch = {}; patch[nokkel] = liste;
    oppdater(patch, { turliste: true });
    // Listen er bygd på nytt. Fokus følger raden, eller går til linjen der raden sto
    // etter «Fjern», så tastaturbrukere ikke havner øverst på siden.
    var nyRad = el.turliste.children[j];
    var neste = null;
    if (nyRad && handling === "fjern") neste = $(".turrad", nyRad);
    else if (nyRad) {
      neste = $("[data-handling=" + handling + "]", nyRad);
      if (neste && neste.disabled) neste = $("[data-handling=" + (handling === "opp" ? "ned" : "opp") + "]", nyRad);
    }
    (neste && !neste.disabled ? neste : $("#legg-til")).focus();
  });

  $("#legg-til").addEventListener("click", function () {
    var nokkel = listeNokkel();
    if (state[nokkel].length >= maksTurer()) return;
    var patch = {}; patch[nokkel] = state[nokkel].concat([nyTur()]);
    // Den nye turen åpnes, og turmålet får fokus.
    settApenTur(state[nokkel].length);
    oppdater(patch, { turliste: true });
    var siste = el.turliste.lastElementChild;
    if (siste) { var felt = $("[data-felt=tittel]", siste); if (felt) felt.focus(); }
  });

  // Variant og posttekst
  if ($("#ny-variant")) $("#ny-variant").addEventListener("click", nyVariant);
  if ($("#annen-posttekst")) $("#annen-posttekst").addEventListener("click", function () {
    oppdater({ postVariant: state.postVariant + 1 }, { lagre: false });
  });
  if ($("#kopier-posttekst")) $("#kopier-posttekst").addEventListener("click", function (e) {
    kopier(el.posttekst.value, e.target, "Kopiert", "Kopier", el.posttekst);
  });

  // Karusell: bla i forhåndsvisningen. Ferdige bilder til deling beholdes.
  // Mens bildene lages, styrer eksporten hvilken side som vises.
  if (el.karusellForrige) el.karusellForrige.addEventListener("click", function () {
    if (state.laster || !sist || !sist.karusell) return;
    oppdater({ karusellSide: Math.max(0, sist.aktiv - 1) }, { lagre: false, beholdFiler: true });
  });
  if (el.karusellNeste) el.karusellNeste.addEventListener("click", function () {
    if (state.laster || !sist || !sist.karusell) return;
    oppdater({ karusellSide: Math.min(sist.sider.length - 1, sist.aktiv + 1) }, { lagre: false, beholdFiler: true });
  });

  // Nedlasting og tømming
  el.lastNed.addEventListener("click", lagreEllerDel);
  if (el.lastNedEtt) el.lastNedEtt.addEventListener("click", lastNed);

  // Linjen nederst på mobil. Begge knappene åpner bildet over hele skjermen, så det alltid
  // er sett før det lagres. «Lagre eller del» starter i tillegg lagringen.
  if (el.seBildet) el.seBildet.addEventListener("click", function () { apneBildet(el.seBildet); });
  if (el.bunnlinjeLagre) el.bunnlinjeLagre.addEventListener("click", function () {
    apneBildet(el.bunnlinjeLagre);
    lagreEllerDel();
  });
  if (el.lukkBildet) el.lukkBildet.addEventListener("click", lukkBildet);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && arkApent()) lukkBildet(); });

  $("#tom-skjema").addEventListener("click", function () {
    if (!window.confirm("Vil du tømme skjemaet? Alle tekster nullstilles til eksempelinnholdet.")) return;
    tomLagring();
    frigjor(state.egetBilde ? state.bilde : "");
    var behold = { mal: state.mal, avsender: state.avsender, hytte: state.hytte };
    Object.assign(state, standardSkjema(), behold);
    var h = valgtHytte();
    Object.assign(state, sesongPreset(state.sesongType, h), brukEksempelbilder());
    $("#bilde-fil").value = "";
    visFeil("");
    render({ turliste: true, lagre: false });
  });

  // Blir vinduet bredt nok til to kolonner, lukkes forhåndsvisningen over hele skjermen.
  window.addEventListener("resize", function () {
    if (bredSkjerm()) lukkBildet();
    skalerForhandsvisning();
    if (sist) oppdaterMini(sist);
  });
}
