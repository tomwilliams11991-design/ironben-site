// ההליכה בתוך הסדנה: אחרי שהשער נפתח, הגלילה מזיזה "מצלמה" על תמונת הסדנה.
//   1. בתוך #gate (אחרי הכותרת): פונים ימינה אל ארון העבודות, הדלתות שלו נפתחות ונכנסים פנימה → #wall.
//   2. ב-#forge: יוצאים מהארון, פונים שמאלה אל התנור, מתקרבים לאש, ותגי המחיר נתלים → #bench.
// כאן רק החישוב: התקדמות הגלילה → מיקום, זום וסיבוב קל של המצלמה, שנכתבים כמשתנים על הבמה עצמה
// (לא על html, כדי שלא יחלחלו לכל העמוד). כל הציור ב-CSS (css/walk.css).
import { $, still, track } from "./util.js";

const RATIO = 3856 / 2160; // תמונת הסדנה

/** נקודות עניין בתמונה: מרכז (שבר מהרוחב/גובה), וכמה מגובה/רוחב התמונה הן תופסות. */
const SPOT = {
  entry: { x: 0.5, y: 0.5 },
  cabinet: { x: 0.809, y: 0.44, h: 0.58, w: 0.09 },
  forge: { x: 0.335, y: 0.43, h: 0.54, w: 0.22 },
};

/** אורכי הגלילה בתוך #gate, ביחידות של גובה מסך (חייב להתאים ל-.gate{height} ב-css/gate.css). */
export const GATE = { open: 1, dwell: 0.5, walk: 2 };

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const span = (v, a, b) => clamp01((v - a) / (b - a));          // v בטווח [a,b] → 0..1
const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const lerp = (a, b, k) => a + (b - a) * k;

/** מידות התמונה על המסך כשהיא מכסה אותו (כמו --gw ב-css/tokens.css). */
function frame() {
  const vw = innerWidth, vh = innerHeight, w = Math.max(vw, vh * RATIO);
  return { vw, vh, w, h: w / RATIO };
}

/** הזום שבו נקודת עניין ממלאת את המסך (גובה 86%, ולא יותר מ-90% מהרוחב). לפחות 1. */
function zoomFor(spot, f) {
  return Math.max(1, Math.min((0.86 * f.vh) / (spot.h * f.h), (0.9 * f.vw) / (spot.w * f.w)));
}

/** מיקום המצלמה: הזזה שמביאה את (x,y) למרכז, מוגבלת כך שקצוות התמונה לא נחשפים. */
function aim(x, y, s, f) {
  const mx = Math.max(0, (f.w * s - f.vw) / 2), my = Math.max(0, (f.h * s - f.vh) / 2);
  return { cx: Math.min(mx, Math.max(-mx, (0.5 - x) * f.w * s)), cy: Math.min(my, Math.max(-my, (0.5 - y) * f.h * s)), s };
}

/** הליכה מנקודה לנקודה: מרכז וזום באינטרפולציה, וסיבוב ראש קל באמצע הדרך (כמו פנייה). */
function walkBetween(a, b, sa, sb, k, turn, f) {
  const e = easeInOut(k);
  return { ...aim(lerp(a.x, b.x, e), lerp(a.y, b.y, e), lerp(sa, sb, e), f), cr: turn * Math.sin(Math.PI * e) };
}

/** כותב את המצלמה ואת שאר המשתנים לבמה. */
function paint(stage, cam, vars) {
  const st = stage.style;
  st.setProperty("--cx", `${cam.cx.toFixed(1)}px`);
  st.setProperty("--cy", `${cam.cy.toFixed(1)}px`);
  st.setProperty("--cs", cam.s.toFixed(4));
  st.setProperty("--cr", `${(cam.cr || 0).toFixed(2)}deg`);
  for (const [k, v] of Object.entries(vars)) st.setProperty(k, v.toFixed(4));
}

/** כמה גללנו בתוך סקשן, בפיקסלים (0 כשהראש שלו בראש המסך). */
const scrolled = (el) => -el.getBoundingClientRect().top;

/**
 * שלב 1, בתוך #gate: מהכניסה אל ארון העבודות.
 * w: 0..0.55 פונים והולכים לארון · 0.6..0.88 הדלתות נפתחות (--o) · 0.74..1 נכנסים פנימה · 0.86..1 החושך (--fade).
 */
function gateWalk(gate, stage, f) {
  const t = scrolled(gate) / f.vh;
  const w = span(t, GATE.open + GATE.dwell, GATE.open + GATE.dwell + GATE.walk);
  const sCab = zoomFor(SPOT.cabinet, f);
  const cam = walkBetween(SPOT.entry, SPOT.cabinet, 1, sCab, span(w, 0, 0.55), -5, f);
  const push = Math.pow(span(w, 0.74, 1), 2);
  if (push > 0) Object.assign(cam, aim(SPOT.cabinet.x, SPOT.cabinet.y, sCab * (1 + 2.2 * push), f));
  paint(stage, cam, { "--w": w, "--o": easeOut(span(w, 0.6, 0.88)), "--fade": span(w, 0.86, 1) });
  stage.classList.toggle("walking", w > 0.04);
  return w;
}

/**
 * שלב 2, ב-#forge: מהארון אל התנור.
 * f: 0..0.1 יוצאים מהחושך · 0.06..0.56 פונים שמאלה והולכים לתנור · 0.35..0.7 החום עולה (--heat) ·
 * 0.5..0.95 תגי המחיר תלויים (.tags-on) · 0.92..1 החושך לפני שולחן העבודה.
 */
function forgeWalk(sec, stage, fr) {
  const k = clamp01(scrolled(sec) / (sec.offsetHeight - fr.vh));
  const sCab = zoomFor(SPOT.cabinet, fr), sForge = zoomFor(SPOT.forge, fr);
  const cam = walkBetween(SPOT.cabinet, SPOT.forge, sCab, sForge, span(k, 0.06, 0.56), 5, fr);
  const lean = span(k, 0.5, 0.95);
  if (lean > 0) Object.assign(cam, aim(SPOT.forge.x, SPOT.forge.y, sForge * (1 + 0.1 * lean), fr));
  paint(stage, cam, { "--k": k, "--heat": span(k, 0.35, 0.7), "--fade": Math.max(1 - span(k, 0, 0.1), span(k, 0.92, 1)) });
  stage.classList.toggle("tags-on", k > 0.5 && k < 0.97);
  return k;
}

/** תנועה מופחתת: בלי הליכה. התנור מוצג ממוסגר, התגים גלויים, והשער בלי מצלמה. */
function staticView(gateStage, forgeStage) {
  const f = frame();
  gateStage && paint(gateStage, aim(0.5, 0.5, 1, f), { "--w": 0, "--o": 0, "--fade": 0 });
  forgeStage && paint(forgeStage, aim(SPOT.forge.x, SPOT.forge.y, zoomFor(SPOT.forge, f), f), { "--k": 1, "--heat": 0.6, "--fade": 0 });
  forgeStage?.classList.add("tags-on");
  gateStage?.classList.remove("walking");
}

export function initWalk() {
  const gate = $("#gate"), gateStage = $("#gate .stage"), forge = $("#forge"), forgeStage = $("#forge .walk-stage");
  if (!gate || !gateStage) return;
  let ticking = false, seen = { cabinet: false, forge: false };
  function tick() {
    ticking = false;
    if (still()) return staticView(gateStage, forgeStage);
    const f = frame();
    const w = gateWalk(gate, gateStage, f);
    const k = forgeStage ? forgeWalk(forge, forgeStage, f) : 0;
    if (w > 0.7 && !seen.cabinet) { seen.cabinet = true; track("walk_cabinet"); }
    if (k > 0.5 && !seen.forge) { seen.forge = true; track("walk_forge"); }
  }
  const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  document.documentElement.addEventListener("a11ychange", schedule);
  tick();
}
