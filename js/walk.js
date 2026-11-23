// הכוריאוגרפיה של הכניסה לסדנה. כל התנועה מוגדרת כאן כפונקציות של התקדמות הגלילה,
// ומנוע הגלילה (js/scroll-scene.js) מריץ אותן על כרטיס המסך.
//   #gate:  השער נפתח → שהייה על הכותרת → ארון העבודות (#works) עולה מלמטה.
//   ההליכה אל הארון ירדה (לבקשת תום, 23.11.2026): ארון שכבר נראה פתוח נראה כמו באג.
import { $, $$, frozen, track } from "./util.js";
import { createScene } from "./scroll-scene.js";

const RATIO = 3856 / 2160; // תמונות השער והסדנה

/** אורכי הגלילה בתוך #gate, ביחידות גובה מסך. הסכום + 1 = הגובה של .gate ב-css/gate.css (210vh, בטלפון 275vh). קצר בכוונה: בטלפון כל מסך הוא תנועת אצבע. */
export const GATE = matchMedia("(max-width:820px)").matches
  ? { open: 1.3, dwell: 0.45 }  // טלפון: 275vh. החלקה אחת עוברת יותר ממסך, אז הפתיחה ארוכה יותר
  : { open: 0.8, dwell: 0.3 };  // מחשב: 210vh

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const span = (v, a, b) => clamp01((v - a) / (b - a));          // v בטווח [a,b] → 0..1
const r2 = (v) => Math.round(v * 100) / 100;

/** ה-transform של .fit: זום כניסה לסדנה (1.16 → 1) בזמן שהשער נפתח. */
const fitTransform = (s) => `translate(-50%,-50%) scale(${s.toFixed(4)})`;
const op = (v) => ({ opacity: String(r2(v)) });

/* ===== השער ===== */

/** k (0..1 לאורך #gate) → p (פתיחת השער), h (הכותרת). */
function gatePhase(k) {
  const p = span(k * (GATE.open + GATE.dwell), 0, GATE.open);
  return { p, h: span(p, 0.6, 0.9) };
}

function gateTracks() {
  const ph = gatePhase;
  const T = (sel, fn) => $$(sel).map((el) => ({ el, fn }));
  return [
    ...T("#gate .leaf.l", (k) => ({ transform: `rotateY(${r2(ph(k).p * 104)}deg)`, opacity: String(r2(span(0.96 - ph(k).p, 0, 0.18))) })),
    ...T("#gate .leaf.r", (k) => ({ transform: `rotateY(${r2(ph(k).p * -104)}deg)`, opacity: String(r2(span(0.96 - ph(k).p, 0, 0.18))) })),
    ...T("#gate .leaf .shade", (k) => op(ph(k).p * 0.6)),
    ...T("#gate .fit", (k) => ({ transform: fitTransform(1.16 - 0.16 * ph(k).p) })),
    ...T("#gate .dim", (k) => op(0.9 - 0.9 * ph(k).p)),
    ...T("#gate .hero", (k) => ({ opacity: String(r2(ph(k).h)), transform: `translateY(${r2((1 - ph(k).h) * 28)}px)` })),
    ...T("#gate .spots, #gate .embers, #gate .glow", (k) => op(ph(k).h)),
    ...T("#gate .hint", (k) => op(1 - span(ph(k).p, 0, 0.2))),
  ];
}

/* ===== חיבור ===== */

/** מחלקות שתלויות במצב (לחיצות, אירועי מדידה): מתעדכנות בגלילה, זול. */
function gateClasses(stage) {
  let opened = false;
  return (k, gone) => {
    const open = gatePhase(k).p > 0.88;
    if (open && !opened) { opened = true; track("gate_opened"); }
    stage.classList.toggle("open", open);
    stage.style.visibility = gone ? "hidden" : ""; // אחרי שהסקשן כולו עבר: לא לצייר את הבמה בכלל
  };
}
/** עצירת תנועה: השער פתוח על הכותרת. */
const STATIC = { gate: GATE.open / (GATE.open + GATE.dwell) };

export function initWalk() {
  const gate = $("#gate");
  const scenes = [];
  if (gate) scenes.push([createScene(gate, gateTracks, gateClasses($("#gate .stage"))), STATIC.gate]);
  scenes.forEach(([s, k]) => s.start(frozen() ? k : null));
  document.documentElement.addEventListener("a11ychange", () => scenes.forEach(([s, k]) => s.restart(frozen() ? k : null)));
}
