/* Karusellen: forside, listesider fordelt etter målt høyde, «Godt å vite»
   og beregnKarusell(). */
import { aktivtEksempel, bakgrunn, bildeAdresse, hytteBilder, kildeBilde, onsketSesong } from "./bilder.js";
import { $, esc, ikon, kalenderData, synligeTurer } from "./hjelpere.js";
import { FARGER, FORMATER, HYTTEMAPPE, LOGO, MAKS_KARUSELL, TITTELFONT, TITTELSPORING } from "./konstanter.js";
import { maaleElement, tilpassStorrelse, tilpassToLinjer } from "./maaling.js";
import { MALER_ARR, malDetaljer } from "./maler.js";
import { state } from "./tilstand.js";

// Velger ikon ut fra ordene i en linje i «Godt å vite». Ingen treff gir et i-ikon.
function ikonFor(tekst) {
  var t = String(tekst || "").toLowerCase();
  if (/e-post|@/.test(t)) return "post";
  if (/bestill|booking|seng|overnatt|\brom\b/.test(t)) return "seng";
  if (/parker|buss|\btog\b|båt|\bbil\b|kjør|transport|bagasje|kolli/.test(t)) return "rute";
  if (/\bsti\b|løype|\bkm\b|guid/.test(t)) return "sted";
  if (/mat\b|middag|frokost|lunsj|kafé|kafe|meny|buffet|vaffel|pizza/.test(t)) return "bestikk";
  if (/kl\.|klokk|åpen|åpent|\bope\b|stengt|tider/.test(t)) return "klokke";
  if (/dato|påske|påska|vinterferie|sommer|sommar|\buke\b|\bveke\b/.test(t)) return "kalender";
  return "info";
}

function karusellInfoLinjer() {
  return String(state.karusellInfo || "").split("\n")
    .map(function (l) { return l.trim(); }).filter(Boolean).slice(0, 5);
}

// Punkter med samme dag og dato etter hverandre samles i én blokk med ett datofelt.
function grupperDager(rader) {
  var blokker = [];
  rader.forEach(function (t) {
    var siste = blokker[blokker.length - 1];
    if (siste && siste.dag === t.dag && siste.dato === t.dato) siste.poster.push(t);
    else blokker.push({ dag: t.dag, dato: t.dato, poster: [t] });
  });
  return blokker;
}

// Fotoet på siste side («Godt å vite»). En hytte bruker et annet av sine bilder enn
// forsiden, i samme sesong eller innefra, så karusellen får variasjon. Eget bilde brukes på begge.
function karusellBilde2() {
  if (state.egetBilde) return { src: state.bilde, eksempel: null };
  var hb = hytteBilder();
  var forside = state.eksempel.staaende || state.eksempel.liggende;
  if (hb && hb.length > 1 && forside) {
    var onsket = onsketSesong() || forside.sesong;
    var andre = hb.filter(function (b) { return b.fil !== forside.fil; });
    var passer = andre.filter(function (b) { return !onsket || b.sesong === onsket || b.sesong === "inne"; });
    var neste = (passer.length ? passer : andre)[0];
    var e = { fil: neste.fil, fotograf: neste.fotograf || null, mappe: HYTTEMAPPE, sesong: neste.sesong || "" };
    return { src: bildeAdresse(e), eksempel: e };
  }
  // Turlagene får det liggende eksempelbildet her, forsiden har det stående.
  return { src: state.bilde, eksempel: state.eksempel.liggende };
}

// Forsiden er bygget som Merkelapp: perioden i merkelappen, tittelen og «Bla videre».
function malForside(b) {
  var bla = '<div class="k-bla"><span>Bla videre</span>' +
    '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></div>';
  return MALER_ARR.merkelapp(Object.assign({}, b, { ekstra: b.sider.length > 1 ? bla : "" }));
}

function malPost(t) {
  return '<div class="k-post"><span class="k-post__tid">' + esc(t.tid) + '</span>' +
    '<div class="k-post__tekst"><span class="k-post__tittel">' + esc(t.tittel) + '</span>' +
    (t.sted ? '<span class="k-post__sted">' + esc(t.sted) + '</span>' : "") + malDetaljer(t) + '</div></div>';
}

function malBlokk(bl) {
  return '<div class="k-blokk"><div class="k-chip"><div class="k-chip__dag">' + esc(bl.dag) + '</div>' +
    '<div class="k-chip__dato">' + esc(bl.dato) + '</div></div>' +
    '<div class="k-poster">' + bl.poster.map(malPost).join("") + '</div></div>';
}

// Logo og navn øverst på listesidene, som stempelet på forsiden. Uten stempel bare navnet.
function malSidehode(kal, nr, totalt) {
  var logo = state.visMerke ? '<img src="' + LOGO + '" alt="DNT">' : "";
  var navn = kal.navn ? '<span class="k-avsender__navn">' + esc(kal.navn) + '</span>' : "";
  return '<div class="k-hode"><div class="k-avsender">' + logo + navn + '</div><span class="k-sidetall">' + nr + ' / ' + totalt + '</span></div>';
}

function malListeSide(kal, blokker, nr, totalt, tittelBryt) {
  return '<div class="k-liste">' + malSidehode(kal, nr, totalt) +
    '<div class="k-tittel' + (tittelBryt ? " k-tittel--bryt" : "") + '">' + esc(kal.tittel) + '</div>' +
    '<div class="k-rader">' + blokker.map(malBlokk).join("") + '</div></div>';
}

function malInfoSide(linjer, nr, totalt) {
  return '<div class="k-info">' +
    '<div class="k-info__foto"><div class="p-foto" data-foto></div><span class="k-sidetall k-sidetall--foto">' + nr + ' / ' + totalt + '</span></div>' +
    '<div class="k-info__innhold"><div class="k-tittel">Godt å vite</div><div class="k-info__liste">' +
      linjer.map(function (l) {
        return '<div class="k-info__rad"><span class="k-ikon">' + ikon(ikonFor(l)) + '</span><span>' + esc(l) + '</span></div>';
      }).join("") +
    '</div></div></div>';
}

export function malKarusellSide(b) {
  var nr = b.aktiv + 1, totalt = b.sider.length;
  if (b.side.type === "forside") return malForside(b);
  if (b.side.type === "info") return malInfoSide(b.side.linjer, nr, totalt);
  return malListeSide(b.kal, b.side.blokker, nr, totalt, b.listeTittelBryt);
}

// Fordeler dagene på listesidene. Høydene måles i et skjult element med samme stiler,
// så fordelingen følger fonter og tekststørrelse. En dag deles aldri på to bilder.
function delOppBlokker(blokker, kal, vars, tittelBryt) {
  if (!blokker.length) return { sider: [], forStor: false };
  var el = maaleElement(vars);
  el.innerHTML = malListeSide(kal, blokker, 1, 1, tittelBryt);
  var rader = $(".k-rader", el);
  var tilgjengelig = FORMATER.karusell.hoyde - rader.offsetTop - 48;
  var hoyder = Array.prototype.map.call(rader.children, function (e) { return e.offsetHeight; });
  var sider = [], naa = [], brukt = 0, forStor = false;
  blokker.forEach(function (bl, i) {
    var h = hoyder[i] || 0;
    if (h > tilgjengelig) forStor = true;
    if (naa.length && brukt + h > tilgjengelig) { sider.push(naa); naa = []; brukt = 0; }
    naa.push(bl);
    brukt += h;
  });
  if (naa.length) sider.push(naa);
  return { sider: sider, forStor: forStor };
}

export function beregnKarusell() {
  var s = state;
  var fmt = FORMATER.karusell;
  var kal = kalenderData();
  var stor = s.tekst === "stor";
  var k = stor ? 1.12 : 1;
  var band = s.visBand ? 88 : 0;
  var farge = FARGER[s.farge] || FARGER.rod;
  var synlige = synligeTurer();
  var tekstBredde = fmt.bredde - 128;
  var forsideTittel = tilpassToLinjer(kal.tittel, tekstBredde - (s.visTurbo ? 300 : 0), 112, 64);
  var listeTittel = tilpassStorrelse(kal.tittel, TITTELFONT, TITTELSPORING, tekstBredde, 92, 60);
  var vars = {
    "--bredde": fmt.bredde + "px", "--hoyde": fmt.hoyde + "px",
    "--a-pad": "64px", "--a-merke-size": Math.round(26 * k) + "px",
    "--merke-bg": farge.bg, "--merke-fg": farge.fg,
    "--m-tittel-size": forsideTittel.px + "px",
    "--m-under-size": Math.round(36 * k) + "px",
    "--m-fakta-size": Math.round(34 * k) + "px",
    "--m-topp": "56px", "--m-bunn": (76 + band) + "px",
    "--m-innhold-topp": "72px", "--m-stempel-bunn": (56 + band) + "px",
    "--k-tittel-size": listeTittel.px + "px",
    "--k-chip": Math.round(150 * k) + "px",
    "--k-dato-size": Math.round(60 * k) + "px",
    // Løftet 16. oktober 2026, som turlistene: sted 30, aktivitet 36, klokkeslett 34.
    "--k-tid-size": Math.round(34 * k) + "px",
    "--k-post-size": Math.round(36 * k) + "px",
    "--k-sted-size": Math.round(30 * k) + "px",
    "--k-info-size": Math.round(30 * k) + "px",
    "--detalj-size": Math.round(26 * k) + "px",
    "--turbo-h": "200px", "--band-h": band + "px"
  };

  var deling = delOppBlokker(grupperDager(synlige), kal, vars, listeTittel.bryt);
  var sider = [{ type: "forside" }];
  deling.sider.forEach(function (bl) { sider.push({ type: "liste", blokker: bl }); });
  var linjer = karusellInfoLinjer();
  if (linjer.length) sider.push({ type: "info", linjer: linjer });
  var aktiv = Math.max(0, Math.min(s.karusellSide, sider.length - 1));
  var side = sider[aktiv];

  // Forsiden har fotoet over hele flaten, «Godt å vite» har et annet foto øverst.
  var u = s.utsnitt.karusell;
  var forsideBilde = kildeBilde(fmt.bredde, fmt.hoyde);
  var forsideEksempel = aktivtEksempel(fmt.bredde, fmt.hoyde);
  var info = linjer.length ? karusellBilde2() : null;
  var bilde = side.type === "info" ? info.src : forsideBilde;
  var flate = side.type === "info" ? [fmt.bredde, 540] : [fmt.bredde, fmt.hoyde];
  var bg = bakgrunn(bilde, flate[0], flate[1], u);
  vars["--bg-str"] = bg.bgStr;
  vars["--bg-pos"] = bg.bgPos;

  var fotografer = [];
  [forsideEksempel, info && info.eksempel].forEach(function (e) {
    if (e && e.fotograf && fotografer.indexOf(e.fotograf) < 0) fotografer.push(e.fotograf);
  });

  return {
    mal: s.mal, kal: kal, karusell: true, nivaa: "merkelapp",
    fmt: fmt,
    opp: { tekst: "" },
    sider: sider, aktiv: aktiv, side: side, synlige: synlige, maks: MAKS_KARUSELL,
    forMange: false, forStor: deling.forStor,
    stor: stor, u: bg.u, bilde: bilde,
    forstorrelse: bg.forstorrelse, langside: bg.langside,
    eksempel: forsideEksempel, fotografer: fotografer,
    tittelBryt: forsideTittel.bryt, listeTittelBryt: listeTittel.bryt,
    innhold: { merke: (kal.periode || "").trim(), tittel: kal.tittel, under: (s.karusellUnder || "").trim(),
               tekst: "", info: [], fakta: [], meny: [], dato: null },
    vars: vars
  };
}
