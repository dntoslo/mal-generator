/* Måling av tekst (tittel på én eller to linjer) og det skjulte
   måleelementet (maalHoyde()). Målingene krever lastede fonter (fonterErKlare()). */
import { TITTELFONT, TITTELSPORING } from "./konstanter.js";

// Finner største skriftstørrelse mellom minPx og maksPx som får teksten på
// én linje innenfor maksBredde. Måler med canvas, så fontene må være lastet.
// Før det returneres maksPx, og plakaten rendres på nytt når fontene er klare.
var maaleCtx = null, maaleCache = {}, maaleAntall = 0;
var fonterKlare = false;

// Kalles når fontene er lastet (start()). Målinger med reservefont kastes.
export function fonterErKlare() { fonterKlare = true; maaleCache = {}; maaleAntall = 0; }
export function tilpassStorrelse(tekst, fontMal, sporing, maksBredde, maksPx, minPx) {
  tekst = String(tekst || "");
  if (!tekst || !fonterKlare) return { px: maksPx, bryt: false };
  var nokkel = [tekst, fontMal, sporing, maksBredde, maksPx, minPx].join("|");
  if (maaleCache[nokkel]) return maaleCache[nokkel];
  if (!maaleCtx) maaleCtx = document.createElement("canvas").getContext("2d");
  var px = maksPx, bredde;
  for (; px >= minPx; px -= 2) {
    maaleCtx.font = fontMal.replace("{px}", px);
    bredde = maaleCtx.measureText(tekst).width + tekst.length * sporing * px;
    if (bredde <= maksBredde) break;
  }
  var res = px < minPx ? { px: minPx, bryt: true } : { px: px, bryt: false };
  // Hvert tastetrykk gir en ny nøkkel. Bufferen tømmes før den vokser seg stor.
  if (++maaleAntall > 2000) { maaleCache = {}; maaleAntall = 0; }
  maaleCache[nokkel] = res;
  return res;
}

// Bredden på en tekst i px, målt med canvas. 0 før fontene er lastet.
export function maalBredde(tekst, fontMal, px) {
  if (!tekst || !fonterKlare) return 0;
  if (!maaleCtx) maaleCtx = document.createElement("canvas").getContext("2d");
  maaleCtx.font = fontMal.replace("{px}", px);
  return maaleCtx.measureText(String(tekst)).width;
}

// Titler på foto kan gå over to linjer. Først prøves én linje ned til 96 px,
// så to linjer fra maksPx og ned. To linjer er et anslag (1,8 ganger bredden),
// og sjekkPlass() sier fra hvis teksten likevel ikke får plass.
export function tilpassToLinjer(tekst, maksBredde, maksPx, minPx) {
  var en = tilpassStorrelse(tekst, TITTELFONT, TITTELSPORING, maksBredde, maksPx, Math.min(96, maksPx));
  if (!en.bryt) return en;
  var to = tilpassStorrelse(tekst, TITTELFONT, TITTELSPORING, maksBredde * 1.8, maksPx, minPx);
  return { px: to.px, bryt: true };
}

// Skjult element med plakatens bredde og stiler, der innhold måles før plakaten bygges.
// Brukes av karusellen (sidene), «Bilde øverst» (radene) og Plakat (innholdet under fotoet).
// Variablene settes på nytt hver gang, så ingenting henger igjen fra forrige mal.
var maaleEl = null;
export function maaleElement(vars) {
  if (!maaleEl) {
    maaleEl = document.createElement("div");
    maaleEl.className = "k-maal";
    maaleEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(maaleEl);
  }
  maaleEl.setAttribute("style", "");
  Object.keys(vars).forEach(function (k) { maaleEl.style.setProperty(k, vars[k]); });
  return maaleEl;
}

// Naturlig høyde på html, målt i det skjulte elementet. Krever lastede fonter,
// derfor rendres alt på nytt når fontene er klare (start()).
export function maalHoyde(html, vars) {
  var el = maaleElement(vars);
  el.innerHTML = html;
  return el.firstElementChild ? el.firstElementChild.offsetHeight : 0;
}
