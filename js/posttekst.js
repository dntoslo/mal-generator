/* Forslag til posttekst, to varianter per mal. */
import { avsenderNavn, datoTekst, erKalender } from "./hjelpere.js";
import { state } from "./tilstand.js";
import { aktivTur } from "./valg.js";

// Setter punktum på slutten hvis setningen mangler det.
function setning(t) {
  t = String(t || "").trim();
  if (!t) return "";
  return /[.!?:]$/.test(t) ? t : t + ".";
}

// «Etikett: verdi», én linje per opplysning i Plakat.
function infoLinjer(info) {
  return info.map(function (r) { return r.etikett + ": " + r.verdi; });
}

// Fotografene bak eksempelbildene som vises. Karusellen kan ha to: forsiden og «Godt å vite».
export function fotograferFor(b) {
  return b.fotografer || (b.eksempel && b.eksempel.fotograf ? [b.eksempel.fotograf] : []);
}

var AVSLUTNING = {
  apner:   ["Vi gleder oss til å se deg.", "Velkommen til fjells."],
  booking: ["Bestill tidlig, det blir fort fullt.", "Vi gleder oss til å ta imot deg."],
  ledig:   ["Velkommen til fjells.", "Vi har god plass til deg og turfølget ditt."],
  takk:    ["Takk for i år, vi gleder oss til neste sesong.", "Takk til alle gjester, frivillige og samarbeidspartnere."],
  soker:   ["Send oss en e-post hvis du er interessert.", "Del gjerne med noen som passer."]
};

// Lager et forslag til posteteksten ut fra det som er fylt inn. To varianter per mal,
// på bokmål. Teksten er et utgangspunkt, brukeren redigerer i Facebook eller Instagram.
export function byggPosttekst(b) {
  var v = state.postVariant % 2;
  var hytte = state.avsender === "hytte";
  var navn = avsenderNavn();
  var paa = navn ? " på " + navn : "";
  var fotografer = fotograferFor(b);
  var foto = fotografer.length ? "Foto: " + fotografer.join(" og ")
    : (state.egetBilde ? "Foto: [navnet på fotografen]" : "");
  var tagg = hytte ? "@dntoslo" : "";
  var linjer = [];
  var inn = b.innhold;

  if (erKalender(b.mal)) {
    var rader = b.synlige.map(function (t) {
      var dag = t.dag;
      var hode = dag.charAt(0) + dag.slice(1).toLowerCase() + (t.dato ? " " + t.dato + "." : "");
      return hode + ": " + setning([t.tittel, t.tid ? "kl. " + t.tid : ""].filter(Boolean).join(" ") + (t.sted ? ", " + t.sted.charAt(0).toLowerCase() + t.sted.slice(1) : ""));
    });
    var periode = (b.kal.periode || "").trim();
    var periodeLiten = periode ? periode.charAt(0) + periode.slice(1).toLowerCase() : "";
    if (v === 0) linjer = [b.kal.tittel + (periodeLiten ? ", " + periodeLiten.toLowerCase() : ""), ""].concat(rader);
    else linjer = [(b.mal === "program" ? "Dette skjer" + paa : "Bli med på tur") + (periodeLiten ? ", " + periodeLiten.toLowerCase() : "") + ":", ""].concat(rader);
    if (b.karusell && b.sider.length > 1) {
      linjer.splice(1, 0, b.mal === "program" ? "Bla gjennom bildene for hele programmet." : "Bla gjennom bildene for alle turene.");
    }
    linjer.push("", b.mal === "program" ? "Velkommen til oss." : "Velkommen på tur.");
  } else if (b.mal === "postkort") {
    var s = b.sig;
    if (v === 0) linjer = [setning([s.over, s.navn].filter(Boolean).join(" ")), setning(s.meta)];
    else linjer = [setning(s.navn + (s.meta ? ", " + s.meta : "")), "Stikk innom når du er på tur i området."];
  } else if (b.mal === "sesong") {
    var slutt = AVSLUTNING[state.sesongType][v];
    var faktaLinjer = infoLinjer(inn.info);
    // Står ikke datoen i tittelen («Booking åpner»), kommer den etter: «Booking åpner torsdag 15. oktober.»
    var d = inn.dato;
    var tittel = d && d.dato && inn.tittel.indexOf(d.dato) < 0 ? inn.tittel + " " + datoTekst(d).toLowerCase() : inn.tittel;
    if (v === 0) {
      linjer = [inn.merke ? inn.merke + paa : navn, "", setning(tittel), setning(inn.under), setning(inn.tekst), ""].concat(faktaLinjer, ["", slutt]);
    } else {
      linjer = [setning(tittel + (inn.merke ? " (" + inn.merke.toLowerCase() + ")" : "")), setning(inn.tekst || inn.under), ""].concat(faktaLinjer, ["", slutt]);
    }
  } else if (b.mal === "meny") {
    var meny = inn.meny.length ? [""].concat(inn.meny) : [];
    var fakta = infoLinjer(inn.info);
    // Etter kolon fortsetter setningen med liten forbokstav: «Dagens middag på Litlos: egenfisket aure.»
    var rett = setning(inn.tittel);
    if (inn.merke) rett = inn.merke + paa + ": " + rett.charAt(0).toLowerCase() + rett.slice(1);
    if (v === 0) linjer = [rett, setning(inn.under)].concat(meny, [""], fakta, ["", "Velkommen til bords."]);
    else linjer = [setning(inn.tittel + paa), setning(inn.under)].concat(meny, [""], fakta, ["", "Vi ses ved bordet."]);
  } else if (b.mal === "arrangement") {
    var datoLinje = datoTekst(inn.dato);
    var info = infoLinjer(inn.info.filter(function (r) { return r.etikett !== "Tid"; }));
    if (v === 0) linjer = [inn.tittel, inn.under, "", [datoLinje, (state.arrTid || "").trim()].filter(Boolean).join(", "), "", setning(inn.tekst), ""].concat(info);
    else linjer = [setning((inn.under ? inn.under + ": " : "") + inn.tittel + (datoLinje ? ", " + datoLinje.toLowerCase() : "")), setning(inn.tekst), ""].concat(info);
  } else if (b.mal === "turtips") {
    var tipsInfo = infoLinjer(inn.info);
    if (v === 0) linjer = ["Turtips: " + inn.tittel, inn.under, "", setning(inn.tekst), ""].concat(tipsInfo);
    else linjer = [setning(inn.tittel + (inn.under ? ". " + inn.under : "")), setning(inn.tekst), ""].concat(tipsInfo, ["", "God tur."]);
    var tur = aktivTur();
    // Lenken følger med så lenge tittel eller tekst fortsatt er turens egen.
    if (tur && tur.url && (state.tipsTittel === tur.tittel || state.tipsTekst === tur.tekst)) {
      linjer.push("", "Les mer på " + tur.url.replace(/^https?:\/\/(www\.)?/, ""));
    }
  }

  linjer.push("", foto, tagg);
  return linjer.join("\n").replace(/\n{3,}/g, "\n\n").replace(/^\s+|\s+$/g, "");
}
