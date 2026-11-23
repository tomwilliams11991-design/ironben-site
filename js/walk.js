// הכוריאוגרפיה של הכניסה וההליכה בסדנה. כל התנועה מוגדרת כאן כפונקציות של התקדמות הגלילה,
// ומנוע הגלילה (js/scroll-scene.js) מריץ אותן על כרטיס המסך.
//   #gate:  השער נפתח → שהייה על הכותרת → פונים ימינה אל ארון העבודות, הדלתות נפתחות וצעד פנימה → #works
//   אחרי הארון: שולחן העבודה (#bench) עולה ישר, בלי עוד הליכה בסדנה.
import { $, $$, frozen, track } from "./util.js";
import { createScene } from "./scroll-scene.js";

const RATIO = 3856 / 2160; // תמונות השער והסדנה

/** נקודות עניין בתמונת הסדנה: מרכז (שבר מהרוחב/גובה), וכמה מגובה/רוחב התמונה הן תופסות. */
const SPOT = {
  entry: { x: 0.5, y: 0.5 },
  cabinet: { x: 0.809, y: 0.44, h: 0.58, w: 0.09 },
};

/** אורכי הגלילה בתוך #gate, ביחידות גובה מסך. הסכום + 1 = הגובה של .gate ב-css/gate.css (265vh, בטלפון 330vh). קצר בכוונה: בטלפון כל מסך הוא תנועת אצבע. */
export const GATE = matchMedia("(max-width:820px)").matches
  ? { open: 1.3, dwell: 0.45, walk: 0.3 }  // טלפון: 305vh. החלקה אחת עוברת יותר ממסך, אז הפתיחה ארוכה יותר
  : { open: 0.8, dwell: 0.3, walk: 0.3 };  // מחשב: 240vh. ההליכה לארון קצרה: בלי צעד ארוך פנימה, שלא ייראה כאילו האתר נתקע
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

/** מצלמת השער: זום כניסה (1.16 → 1), ואז ההליכה לארון (w 0..0.75) ורק צעד קטן פנימה (w 0.75..1), בזמן שהשידה כבר עולה מלמטה.
 *  הזום הכולל נשאר מתחת ל-~2: זום גדול יותר מחייב את הדפדפן לצייר שכבה ענקית, ובטלפון המסך נהיה שחור. */
function gateCamera(k, f) {
  const { p, w } = gatePhase(k);
  const sCab = zoomFor(SPOT.cabinet, f);
  let cam = walkBetween(SPOT.entry, SPOT.cabinet, 1, sCab, span(w, 0, 0.75), -5, f);
  const push = span(w, 0.75, 1);
  if (push > 0) cam = aim(SPOT.cabinet.x, SPOT.cabinet.y, sCab * (1 + 0.12 * push), f);
  cam.s *= 1.16 - 0.16 * p;
  return cam;
}

function gateTracks(vh) {
  const f = frame(vh), ph = gatePhase;
  const T = (sel, fn) => $$(sel).map((el) => ({ el, fn }));
  const doorOpen = (k) => easeOut(span(ph(k).w, 0.3, 0.75));
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
    ...T("#gate .walk-cap", (k) => op(span(ph(k).w, 0.05, 0.18) * (1 - span(ph(k).w, 0.5, 0.65)))),
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
/** עצירת תנועה: השער פתוח על הכותרת. */
const STATIC = { gate: GATE.open / GATE_LEN };

export function initWalk() {
  const gate = $("#gate");
  const scenes = [];
  if (gate) scenes.push([createScene(gate, gateTracks, gateClasses($("#gate .stage"))), STATIC.gate]);
  scenes.forEach(([s, k]) => s.start(frozen() ? k : null));
  document.documentElement.addEventListener("a11ychange", () => scenes.forEach(([s, k]) => s.restart(frozen() ? k : null)));
}
