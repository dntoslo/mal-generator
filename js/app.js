/* =========================================================
   Turposten (DNT Oslo og Omegn), tidligere Turplakaten
   Ren JavaScript uten byggesteg, delt i ES-moduler (16. oktober 2026).
   Denne filen starter verktøyet. De andre modulene i js/:
     konstanter, tilstand, hjelpere, lagring    data og tilstand
     bilder, maaling, innhold, beregn, karusell  utregning
     maler, posttekst                            html og tekst
     forhandsvisning, skjema, render             tegning av siden
     valg, eksport, hendelser                    det brukeren gjør
   Hyttene, med fakta og eksempelbilder, ligger i js/hytter.js.
   Versjonsnummeret i index.html (?v=) må byttes når en fil i js/
   eller css/ endres, ellers kan nettleseren blande gamle og nye filer.
   ========================================================= */
import { brukEksempelbilder } from "./bilder.js";
import { el, finnElementer } from "./forhandsvisning.js";
import { kobleHendelser } from "./hendelser.js";
import { MAALTE_FONTER } from "./konstanter.js";
import { hent, lesLenke } from "./lagring.js";
import { fonterErKlare } from "./maaling.js";
import { render } from "./render.js";
import { state } from "./tilstand.js";
import { byggHytteliste } from "./valg.js";

function start() {
  finnElementer();
  // Inne i Messenger, Facebook og Instagram virker nedlasting sjelden. Da vises et varsel øverst.
  if (el.appVarsel && /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger/i.test(navigator.userAgent || "")) el.appVarsel.hidden = false;
  byggHytteliste();
  hent();
  lesLenke();
  Object.assign(state, brukEksempelbilder(), { utsnitt: state.utsnitt });
  kobleHendelser();
  render({ turliste: true, lagre: false });
  // Målingen trenger fontene. document.fonts.ready dekker bare snitt som allerede er i bruk,
  // så snittene som måles lastes eksplisitt (ABC Social 500 brukes f.eks. først i postkort C).
  // Hele siden rendres på nytt, så også knappetekst og antall karusellbilder bygger på riktige mål.
  var klare = function () { fonterErKlare(); render({ lagre: false }); };
  if (document.fonts && document.fonts.load) {
    Promise.all(MAALTE_FONTER.map(function (f) { return document.fonts.load(f); }))
      .then(function () { return document.fonts.ready; })
      .then(klare, klare);
  } else {
    klare();
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();
