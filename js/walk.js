// הכוריאוגרפיה של הכניסה וההליכה בסדנה. כל התנועה מוגדרת כאן כפונקציות של התקדמות הגלילה,
// ומנוע הגלילה (js/scroll-scene.js) מריץ אותן על כרטיס המסך.
//   #gate:  השער נפתח → שהייה על הכותרת → פונים ימינה אל ארון העבודות, הדלתות נפתחות ונכנסים לאור → #works (מתחיל באותו אור)
//   #forge: חוזרים ישר לסדנה → פונים שמאלה אל התנור, האש מתחממת, נתלות התגיות של מה אפשר לבדוק → #bench
import { $, $$, still, track } from "./util.js";
import { createScene } from "./scroll-scene.js";

const RATIO = 3856 / 2160; // תמונות השער והסדנה

/** נקודות עניין בתמונת הסדנה: מרכז (שבר מהרוחב/גובה), וכמה מגובה/רוחב התמונה הן תופסות. */
const SPOT = {
  entry: { x: 0.5, y: 0.5 },
  cabinet: { x: 0.809, y: 0.44, h: 0.58, w: 0.09 },
  forge: { x: 0.335, y: 0.43, h: 0.54, w: 0.22 },
};

/** אורכי הגלילה בתוך #gate, ביחידות גובה מסך. הסכום + 1 = הגובה של .gate ב-css/gate.css (310vh). קצר בכוונה: בטלפון כל מסך הוא תנועת אצבע. */
export const GATE = { open: 0.8, dwell: 0.3, walk: 1.0 };
const GATE_LEN = GATE.open + GATE.dwell + GATE.walk;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const span = (v, a, b) => clamp01((v - a) / (b - a));          // v בטווח [a,b] → 0..1
const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const lerp = (a, b, k) => a + (b - a) * k;
const r2 = (v) => Math.round(v * 100) / 100;

/** מידות התמונה על המסך כשהיא מכסה אותו (כמו --gw ב-css/tokens.css). */
function frame(vh) {
  const vw = innerWidth, w = Math.max(vw, vh * RATIO);
  return { vw, vh, w, h: w / RATIO };
}

/** הזום שבו נקודת עניין ממלאת את המסך (גובה 86%, ולא יותר מ-90% מהרוחב). לפחות 1. */
const zoomFor = (spot, f) => Math.max(1, Math.min((0.86 * f.vh) / (spot.h * f.h), (0.9 * f.vw) / (spot.w * f.w)));

/** מצלמה: הזזה שמביאה את (x,y) למרכז, מוגבלת כך שקצוות התמונה לא נחשפים. */
function aim(x, y, s, f) {
  const mx = Math.max(0, (f.w * s - f.vw) / 2), my = Math.max(0, (f.h * s - f.vh) / 2);
  return { cx: Math.min(mx, Math.max(-mx, (0.5 - x) * f.w * s)), cy: Math.min(my, Math.max(-my, (0.5 - y) * f.h * s)), s, cr: 0 };
}

/** הליכה מנקודה לנקודה: מרכז וזום באינטרפולציה, וסיבוב ראש קל באמצע הדרך (כמו פנייה). */
function walkBetween(a, b, sa, sb, k, turn, f) {
  const e = easeInOut(k);
  return { ...aim(lerp(a.x, b.x, e), lerp(a.y, b.y, e), lerp(sa, sb, e), f), cr: turn * Math.sin(Math.PI * e) };
}

/** ה-transform של .fit (אותה רשימת פונקציות בכל דגימה, כדי שהדפדפן יאנפלץ ביניהן חלק). */
const fitTransform = (c) => `translate(-50%,-50%) perspective(1600px) rotateY(${r2(c.cr)}deg) translate(${r2(c.cx)}px,${r2(c.cy)}px) scale(${c.s.toFixed(4)})`;
const op = (v) => ({ opacity: String(r2(v)) });

/* ===== השער וההליכה לארון ===== */

/** k (0..1 לאורך #gate) → p (פתיחת השער), h (הכותרת), w (ההליכה לארון). */
function gatePhase(k) {
  const t = k * GATE_LEN;
  const p = span(t, 0, GATE.open), w = span(t, GATE.open + GATE.dwell, GATE_LEN);
  return { p, w, h: span(p, 0.6, 0.9) * (1 - span(w, 0, 0.16)) };
}

/** מצלמת השער: זום כניסה (1.16 → 1), ואז ההליכה לארון (w 0..0.42), ואז צעד פנימה (w 0.5..0.85).
 *  הזום הכולל נשאר מתחת ל-~2: זום גדול יותר מחייב את הדפדפן לצייר שכבה ענקית, ובטלפון המסך נהיה שחור. */
function gateCamera(k, f) {
  const { p, w } = gatePhase(k);
  const sCab = zoomFor(SPOT.cabinet, f);
  let cam = walkBetween(SPOT.entry, SPOT.cabinet, 1, sCab, span(w, 0, 0.42), -5, f);
  const push = Math.pow(span(w, 0.5, 0.85), 2);
  if (push > 0) cam = aim(SPOT.cabinet.x, SPOT.cabinet.y, sCab * (1 + 0.3 * push), f);
  cam.s *= 1.16 - 0.16 * p;
  return cam;
}

function gateTracks(vh) {
  const f = frame(vh), ph = gatePhase;
  const T = (sel, fn) => $$(sel).map((el) => ({ el, fn }));
  const doorOpen = (k) => easeOut(span(ph(k).w, 0.38, 0.62));
  return [
    ...T("#gate .leaf.l", (k) => ({ transform: `rotateY(${r2(ph(k).p * 104)}deg)`, opacity: String(r2(span(0.96 - ph(k).p, 0, 0.18))) })),
    ...T("#gate .leaf.r", (k) => ({ transform: `rotateY(${r2(ph(k).p * -104)}deg)`, opacity: String(r2(span(0.96 - ph(k).p, 0, 0.18))) })),
    ...T("#gate .leaf .shade", (k) => op(ph(k).p * 0.6)),
    ...T("#gate .fit", (k) => ({ transform: fitTransform(gateCamera(k, f)) })),
    ...T("#gate .dim", (k) => op(0.9 - 0.9 * ph(k).p)),
    ...T("#gate .hero", (k) => ({ opacity: String(r2(ph(k).h)), transform: `translateY(${r2((1 - ph(k).h) * 28)}px)` })),
    ...T("#gate .spots, #gate .embers, #gate .glow", (k) => op(ph(k).h)),
    ...T("#gate .hint", (k) => op(1 - span(ph(k).p, 0, 0.2))),
    ...T("#gate .cab-leaf.l", (k) => ({ transform: `rotateY(${r2(doorOpen(k) * -112)}deg)` })),
    ...T("#gate .cab-leaf.r", (k) => ({ transform: `rotateY(${r2(doorOpen(k) * 112)}deg)` })),
    ...T("#gate .cab-leaf .shade", (k) => op(doorOpen(k) * 0.55)),
    ...T("#gate .cab-dark", (k) => op((1 - doorOpen(k)) * 0.5)),
    ...T("#gate .walk-cap", (k) => op(span(ph(k).w, 0.22, 0.34) * (1 - span(ph(k).w, 0.46, 0.54)))),
    // נכנסים לאור שבתוך הארון; בסוף הבמה נגללת למעלה וסקשן העבודות מתחיל באותו צבע בדיוק
    ...T("#gate .walk-light", (k) => op(span(ph(k).w, 0.55, 0.85))),
  ];
}

/* ===== התנור ===== */

/** k (0..1 לאורך #forge): 0..0.5 מהמבט הכללי על הסדנה אל התנור · 0.3..0.6 החום עולה · 0.35..0.47 הכותרת · 0.45.. התגיות. */
function forgeTracks(vh) {
  const f = frame(vh), sForge = zoomFor(SPOT.forge, f);
  const heat = (k) => span(k, 0.3, 0.6), head = (k) => span(k, 0.35, 0.47);
  const camera = (k) => {
    const lean = span(k, 0.5, 1);
    return lean > 0 ? aim(SPOT.forge.x, SPOT.forge.y, sForge * (1 + 0.1 * lean), f)
      : walkBetween(SPOT.entry, SPOT.forge, 1, sForge, span(k, 0, 0.5), 4, f);
  };
  const T = (sel, fn) => $$(sel).map((el) => ({ el, fn }));
  return [
    ...T("#forge .fit", (k) => ({ transform: fitTransform(camera(k)) })),
    ...T("#forge .heat, #forge .embers", (k) => op(heat(k) * 0.85)),
    ...T("#forge .forge-shade", (k) => op(0.35 + 0.65 * heat(k))),
    ...T("#forge .forge-head", (k) => ({ opacity: String(r2(head(k))), transform: `translateY(${r2((1 - head(k)) * 16)}px)` })),
  ];
}

/* ===== חיבור ===== */

/** מחלקות שתלויות במצב (לחיצות, אירועי מדידה): מתעדכנות בגלילה, זול. */
function gateClasses(stage) {
  let opened = false, seen = false;
  return (k, gone) => {
    const { p, w } = gatePhase(k);
    const open = p > 0.88 && w < 0.04;
    if (open && !opened) { opened = true; track("gate_opened"); }
    if (w > 0.7 && !seen) { seen = true; track("walk_cabinet"); }
    stage.classList.toggle("open", open);
    stage.classList.toggle("walking", w >= 0.04);
    stage.style.visibility = gone ? "hidden" : ""; // אחרי שהסקשן כולו עבר: לא לצייר את הבמה בכלל
  };
}
function forgeClasses(stage) {
  let seen = false;
  return (k, gone) => {
    if (k > 0.45 && !seen) { seen = true; track("walk_forge"); }
    stage.classList.toggle("tags-on", k > 0.45);
    stage.style.visibility = gone ? "hidden" : "";
  };
}

/** עצירת תנועה: השער פתוח על הכותרת, התנור ממוסגר עם התגים. */
const STATIC = { gate: GATE.open / GATE_LEN, forge: 0.75 };

export function initWalk() {
  const gate = $("#gate"), forge = $("#forge");
  const scenes = [];
  if (gate) scenes.push([createScene(gate, gateTracks, gateClasses($("#gate .stage"))), STATIC.gate]);
  if (forge) scenes.push([createScene(forge, forgeTracks, forgeClasses($("#forge .walk-stage"))), STATIC.forge]);
  scenes.forEach(([s, k]) => s.start(still() ? k : null));
  document.documentElement.addEventListener("a11ychange", () => scenes.forEach(([s, k]) => s.restart(still() ? k : null)));
}
