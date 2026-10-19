/* Plakatmalene: turkalender og program (MALER) og enkeltmalene på tre nivåer
   (MALER_ARR). Bare html, all utregning skjer i beregn.js. */
import { avsenderMeta, avsenderNavn, detaljerFor, esc, ikon, overlinjeNavn } from "./hjelpere.js";
import { underEllerDato } from "./innhold.js";
import { GRAD, LOGO, PLASSERINGER, SIGNATURER, TURBO } from "./konstanter.js";
import { state } from "./tilstand.js";

// Turleder, lengde, gradering og påmelding under turmålet. Tom streng uten detaljer.
export function malDetaljer(t) {
  var detaljer = detaljerFor(t);
  if (!detaljer && !t.grad && !t.pamelding) return "";
  var html = '<div class="p-detaljer">';
  if (detaljer) html += '<span class="p-detaljer__tekst">' + esc(detaljer) + '</span>';
  if (t.grad) html += '<span class="p-grad" style="color:' + (GRAD[t.grad] || "#0F0F0F") + '"><span class="p-grad__prikk"></span><span>' + esc(t.grad) + '</span></span>';
  if (t.pamelding) html += '<span class="p-pamelding">Påmelding</span>';
  return html + '</div>';
}

// Én tur eller ett programpunkt i turkalenderen og programmet. Ekstra argumenter fra map() ignoreres.
export function malRad(t) {
  return '<div class="p-rad">' +
    '<div class="p-chip"><div class="p-chip__dag">' + esc(t.dag) + '</div><div class="p-chip__dato">' + esc(t.dato) + '</div></div>' +
    '<div class="p-info">' +
      '<div class="p-info__tittel">' + esc(t.tittel) + '</div>' +
      '<div class="p-info__sted">' + esc(t.sted) + '</div>' +
      malDetaljer(t) +
    '</div>' +
    '<div class="p-tid">' + esc(t.tid) + '</div>' +
  '</div>';
}

// Den runde T-en kan skrus av, uavhengig av båndet nederst. Logoen er alltid
// dnt-logo.png, kvadratisk og uendret, i en hvit sirkel. Brukes bare i turkalender
// og program. De andre malene har logoen i stempelet i stedet (14. oktober 2026).
function malLogo(klasse) {
  if (!state.visLogo) return "";
  return '<div class="p-logo ' + (klasse || "") + '"><img src="' + LOGO + '" alt="DNT"></div>';
}

// Turbo, Barnas Turlags maskot. Valgfri, står alltid i tillegg til DNT-logoen.
function malTurbo(klasse) {
  if (!state.visTurbo) return "";
  return '<img class="p-turbo ' + (klasse || "") + '" src="' + TURBO + '" alt="Turbo">';
}

// Det røde båndet med nettadresse nederst. Valgfritt, av som standard.
// Logoen står i hvit sirkel også her, siden den røde T-en ellers forsvinner mot rødt.
function malBunn(klasse) {
  if (!state.visBand) return "";
  return '<div class="p-bunn ' + (klasse || "") + '"><span class="p-bunn__logo"><img src="' + LOGO + '" alt="DNT"></span>' +
    '<span class="p-bunn__lenke">' + esc(state.lenke) + '</span></div>';
}

export var MALER = {
  topp: function (b) {
    return '<div class="p-flate">' +
      '<div class="p-hero">' +
        '<div class="p-foto" data-foto></div><div class="p-scrim p-scrim--topp"></div>' +
        '<div class="p-hero__tekst"><span class="p-overlinje p-overlinje--topp">' + esc(b.kal.navn.toUpperCase()) + '</span><span class="p-tittel' + (b.tittelBryt ? " p-tittel--bryt" : "") + '">' + esc(b.kal.tittel) + '</span></div>' +
        malLogo() + malTurbo("p-turbo--hero") +
        '<div class="p-periode">' + esc(b.kal.periode) + '</div>' +
      '</div>' +
      '<div class="p-rader">' + b.synlige.map(malRad).join("") + '</div>' +
      malBunn() +
    '</div>';
  },
  bakgrunn: function (b) {
    return '<div class="p-flate p-flate--bakgrunn">' +
      '<div class="p-foto p-foto--fyll" data-foto></div><div class="p-scrim p-scrim--bakgrunn"></div>' +
      '<div class="p-hero__tekst p-hero__tekst--lav"><span class="p-overlinje">' + esc(b.kal.navn.toUpperCase()) + (b.kal.navn ? '<span class="p-overlinje__skille"></span>' : "") + esc(b.kal.periode) + '</span><span class="p-tittel' + (b.tittelBryt ? " p-tittel--bryt" : "") + '">' + esc(b.kal.tittel) + '</span></div>' +
      malLogo("p-logo--lav") + malTurbo("p-turbo--underlogo") +
      '<div class="p-kort' + (state.kortGlass ? " p-kort--glass" : "") + '">' +
        '<div class="p-kort__liste p-kort__liste--bakgrunn">' + b.synlige.map(malRad).join("") + '</div>' +
        malBunn("p-bunn--tett") +
      '</div>' +
    '</div>';
  }
};


function malChip(d) {
  return '<div class="a-chip">' +
    '<div class="a-chip__dag">' + esc(d.dag) + '</div>' +
    '<div class="a-chip__dato"><span class="a-chip__tall">' + esc(d.dato) + '</span><span class="a-chip__maaned">' + esc(d.maaned) + '</span></div>' +
  '</div>';
}

function malMerke(tekst) {
  return tekst ? '<div class="a-merke">' + esc(tekst) + '</div>' : "";
}

function malArrTittel(b) {
  var inn = b.innhold;
  return '<div class="a-tittel' + (b.tittelBryt ? " a-tittel--bryt" : "") + '">' + esc(inn.tittel) + '</div>' +
    (inn.under ? '<div class="a-under">' + esc(inn.under) + '</div>' : "");
}

function malArrInfo(b) {
  if (!b.info.length) return "";
  return '<div class="a-info">' + b.info.map(function (r) {
    var prikk = r.farge ? '<span class="a-grad" style="background:' + r.farge + '"></span>' : "";
    return '<div class="a-info__rad"><span class="a-info__etikett">' + esc(r.etikett) + '</span><span class="a-info__verdi">' + prikk + esc(r.verdi) + '</span></div>';
  }).join("") + '</div>';
}

function malArrTekst(b) {
  return b.innhold.tekst ? '<div class="a-tekst">' + esc(b.innhold.tekst) + '</div>' : "";
}

function malMeny(b) {
  if (!b.innhold.meny.length) return "";
  return '<div class="a-meny">' + b.innhold.meny.map(function (l) {
    return '<div class="a-meny__rad"><span class="a-meny__prikk"></span><span>' + esc(l) + '</span></div>';
  }).join("") + '</div>';
}

// Toppen av Plakat. Med dato står datofeltet ved siden av merkelapp og tittel,
// uten dato står merkelappen over tittelen.
function malArrTopp(b) {
  var inn = b.innhold;
  if (inn.dato) {
    return '<div class="a-topp">' + malChip(inn.dato) +
      '<div class="a-topp__tekst">' + malMerke(inn.merke) + malArrTittel(b) + '</div></div>';
  }
  return '<div class="a-topp a-topp--merke">' + malMerke(inn.merke) + '<div class="a-topp__tekst">' + malArrTittel(b) + '</div></div>';
}

// Innholdet under fotoet i Plakat. Samme html måles i beregnEnkelt(), så fotoet kan ta resten.
export function malPlakatInnhold(b) {
  return '<div class="a-innhold a-innhold--fyll">' + malArrTopp(b) + malMeny(b) + malArrInfo(b) + malArrTekst(b) + "</div>";
}

// Stempelet med logo, avsenderens navn og høyde. Står øverst til venstre i Merkelapp,
// eller nederst når teksten står øverst. Den eneste logoen i de organiske innleggene.
function malStempel(klasse) {
  var navn = avsenderNavn();
  if (!state.visMerke || !navn) return "";
  var meta = avsenderMeta();
  return '<div class="m-stempel ' + (klasse || "") + '"><img src="' + LOGO + '" alt="DNT">' +
    '<div class="m-stempel__tekst"><span class="m-stempel__navn">' + esc(navn) + '</span>' +
    (meta ? '<span class="m-stempel__meta">' + esc(meta) + '</span>' : "") + '</div></div>';
}

function malIkonFakta(b) {
  var fakta = b.innhold.fakta.slice(0, 2);
  if (!fakta.length) return "";
  return '<div class="m-fakta">' + fakta.map(function (f) {
    var merke = f.ikon ? '<span class="m-ikon">' + ikon(f.ikon) + '</span>'
      : '<span class="m-prikk" style="background:' + (f.prikk || "#0F0F0F") + '"></span>';
    return '<div class="m-fakta__rad">' + merke + '<span>' + esc(f.verdi) + '</span></div>';
  }).join("") + '</div>';
}

function malBandNede() {
  return state.visBand ? '<div class="m-band">' + malBunn() + '</div>' : "";
}

export var MALER_ARR = {
  merkelapp: function (b) {
    var pl = PLASSERINGER[state.plassering] ? state.plassering : "nede";
    var inn = b.innhold;
    var topp = inn.merke ? malMerke(inn.merke) : (inn.dato ? malChip(inn.dato) : "");
    var under = underEllerDato(inn);
    return '<div class="m-flate">' +
      '<div class="p-foto p-foto--fyll" data-foto></div>' +
      '<div class="m-scrim m-scrim--' + (pl === "oppe" ? "oppe" : "nede") + '"></div>' +
      malStempel(pl === "oppe" ? "m-stempel--nede" : "") +
      malTurbo("p-turbo--band") +
      '<div class="m-innhold m-innhold--' + pl + (state.visTurbo ? " m-innhold--turbo" : "") + '">' +
        topp +
        '<div class="m-tittel' + (b.tittelBryt ? " m-tittel--bryt" : "") + '">' + esc(inn.tittel) + '</div>' +
        (under ? '<div class="m-under">' + esc(under) + '</div>' : "") +
        malIkonFakta(b) +
        (b.ekstra || "") +
      '</div>' +
      malBandNede() +
    '</div>';
  },
  plakat: function (b) {
    return '<div class="a-flate">' +
      '<div class="a-foto a-foto--topp">' +
        '<div class="p-foto" data-foto></div><div class="a-scrim a-scrim--topp"></div>' +
        '<div class="a-overlinje">' + esc(overlinjeNavn().toUpperCase()) + '</div>' + malTurbo("p-turbo--fotoflate") +
      '</div>' +
      malPlakatInnhold(b) +
      malBunn() +
    '</div>';
  },
  postkort: function (b) {
    var s = b.sig;
    var v = SIGNATURER[state.signatur] ? state.signatur : "a";
    // Sesong, Arrangement, Turtips og Meny på Postkort-nivå har ellers ingen avsender i bildet.
    // Navnet står da som overlinje øverst, som i Plakat (16. oktober 2026). Postkort-malen har
    // navnet i signaturen allerede.
    var navn = state.mal !== "postkort" ? avsenderNavn() : "";
    var avsender = navn ? '<div class="s-avsender-scrim"></div><div class="s-avsender">' + esc(navn.toUpperCase()) + "</div>" : "";
    if (v === "c") {
      // Får ikke navn og meta plass side om side, står meta under navnet (b.cUnder).
      // Side om side står de i samme rad, så meta følger grunnlinjen til navnet og ikke
      // midten av hele blokken med overlinjen (19. oktober 2026).
      var meta = s.metaLinjer.length ? '<div class="s-c__meta' + (b.cUnder ? " s-c__meta--under" : "") + '">' +
        s.metaLinjer.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join("") + '</div>' : "";
      var navnC = '<span class="s-navn s-navn--c' + (b.tittelBryt ? " s-navn--bryt" : "") + '">' + esc(s.navn) + '</span>';
      return '<div class="s-flate s-flate--c">' +
        '<div class="s-c__foto"><div class="p-foto" data-foto></div>' + avsender + "</div>" +
        '<div class="s-c__bunn"><div class="s-c__venstre">' +
          (s.over ? '<span class="s-over s-over--rod s-over--liten">' + esc(s.over) + '</span>' : "") +
          (b.cUnder ? navnC + meta : '<div class="s-c__rad">' + navnC + meta + '</div>') +
        '</div></div>' +
      '</div>';
    }
    if (v === "b") {
      return '<div class="s-flate">' +
        '<div class="p-foto p-foto--fyll" data-foto></div>' + avsender +
        '<div class="s-b"><img src="' + LOGO + '" alt="DNT"><div class="s-b__tekst">' +
          (s.over ? '<span class="s-over s-over--rod s-over--liten">' + esc(s.over) + '</span>' : "") +
          '<span class="s-navn s-navn--b">' + esc(s.navn) + '</span>' +
          (s.meta ? '<span class="s-meta s-meta--b">' + esc(s.meta) + '</span>' : "") +
        '</div></div>' +
        malTurbo("p-turbo--band") + malBandNede() +
      '</div>';
    }
    return '<div class="s-flate">' +
      '<div class="p-foto p-foto--fyll" data-foto></div><div class="s-scrim"></div>' + avsender +
      '<div class="s-a' + (state.visTurbo ? " m-innhold--turbo" : "") + '">' +
        (s.over ? '<span class="s-over">' + esc(s.over) + '</span>' : "") +
        '<span class="s-navn s-navn--a' + (b.tittelBryt ? " s-navn--bryt" : "") + '">' + esc(s.navn) + '</span>' +
        (s.meta ? '<span class="s-meta">' + esc(s.meta) + '</span>' : "") +
      '</div>' +
      malTurbo("p-turbo--band") + malBandNede() +
    '</div>';
  }
};
