// מנוע הגלילה של הסצנות (השער וההליכה לארון). סצנה = סקשן ארוך עם במה נעוצה (sticky) + "רצועות":
// כל רצועה היא אלמנט + פונקציה שמקבלת התקדמות k (0..1 לאורך הסקשן) ומחזירה {transform, opacity}.
//
// דרך ראשית (כרום, ספארי 26+): הפונקציות "נאפות" פעם אחת לאנימציות WAAPI שמחוברות ל-ViewTimeline של הסקשן.
//   הדפדפן מריץ אותן בעצמו על כרטיס המסך, בלי JS ובלי חישוב סגנונות בזמן הגלילה, ולכן זה חלק גם בטלפון.
// גיבוי (דפדפן בלי ViewTimeline): rAF שמחיל את אותן פונקציות ישירות על style של כל אלמנט.
// אפייה מחדש רק כשרוחב המסך או הגובה הגדול שלו (lvh) משתנים, לא כשסרגל הכתובת בטלפון זז.
const SAMPLES = 72;
const HAS_TIMELINE = typeof window.ViewTimeline === "function";

/** גובה מסך יציב (100lvh): לא משתנה כשסרגל הכתובת של הטלפון נפתח ונסגר. */
let probe = null;
export function stableVH() {
  if (!probe) {
    probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;height:100vh;height:100lvh;width:0;visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
  }
  return probe.offsetHeight || innerHeight;
}

/** דוגם פונקציה לאורך 0..1 ומשמיט דגימות זהות באמצע רצף (נשארים רק קצוות של קטעים קבועים). */
function bake(fn) {
  const all = Array.from({ length: SAMPLES + 1 }, (_, i) => ({ k: i / SAMPLES, style: fn(i / SAMPLES) }));
  const same = (a, b) => JSON.stringify(a.style) === JSON.stringify(b.style);
  return all.filter((f, i) => i === 0 || i === all.length - 1 || !(same(f, all[i - 1]) && same(f, all[i + 1])));
}

/** מיקום על ציר ה-ViewTimeline (טווח cover: מהרגע שהסקשן נכנס מלמטה עד שיצא למעלה) של התקדמות k בתוך הנעיצה. */
const coverOffset = (k, H, vh) => (vh + k * (H - vh)) / (H + vh);

/**
 * @param {HTMLElement} section הסקשן הארוך (subject של ה-ViewTimeline)
 * @param {(vh:number) => Array<{el: Element, fn: (k:number) => object}>} makeTracks בונה את הרצועות למידות המסך הנוכחיות
 * @param {(k:number, gone:boolean) => void} onProgress נקרא בגלילה (זול: רק scrollY) לעדכון מחלקות כמו .open / .tags-on;
 *   gone = הסקשן כולו כבר מעל המסך (אפשר להפסיק לצייר את הבמה)
 */
export function createScene(section, makeTracks, onProgress = () => {}) {
  let anims = [], tracks = [], top = 0, H = 1, vh = 1, mode = "", size = "";

  function measure() {
    vh = stableVH();
    H = section.offsetHeight;
    top = section.getBoundingClientRect().top + scrollY;
  }
  const progress = () => Math.min(1, Math.max(0, (scrollY - top) / Math.max(1, H - vh)));
  const applyAt = (k) => tracks.forEach((t) => Object.assign(t.el.style, t.fn(k)));
  const clearInline = () => tracks.forEach((t) => { t.el.style.transform = ""; t.el.style.opacity = ""; });

  /** בונה מחדש: מבטל אנימציות קודמות, אופה רצועות חדשות, ומחבר לציר הגלילה (או לגיבוי). */
  function build(staticK) {
    anims.forEach((a) => a.cancel()); anims = [];
    clearInline();
    measure();
    tracks = makeTracks(vh);
    if (staticK != null) { mode = "static"; applyAt(staticK); return; }
    if (HAS_TIMELINE) {
      try {
        const timeline = new ViewTimeline({ subject: section, axis: "block" });
        anims = tracks.map((t) => {
          const frames = bake(t.fn).map((f) => ({ ...f.style, offset: coverOffset(f.k, H, vh) }));
          frames.unshift({ ...frames[0], offset: 0 });
          frames.push({ ...frames[frames.length - 1], offset: 1 });
          return t.el.animate(frames, { timeline, fill: "both", easing: "linear" });
        });
        mode = "timeline";
        return;
      } catch (e) { console.warn("scroll timeline", e); anims.forEach((a) => a.cancel()); anims = []; }
    }
    mode = "raf";
    applyAt(progress());
  }

  let ticking = false;
  function tick() {
    ticking = false;
    const k = progress();
    if (mode === "raf") applyAt(k);
    onProgress(k, scrollY >= top + H);
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };

  return {
    /** מפעיל (או מקפיא על staticK כשעוצרים תנועה). */
    start(staticK) {
      size = `${innerWidth}x${stableVH()}`;
      build(staticK);
      tick();
      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("resize", () => {
        const s = `${innerWidth}x${stableVH()}`;
        if (s === size) { measure(); return; } // רק סרגל הכתובת זז
        size = s; build(mode === "static" ? staticK : null); tick();
      });
      // גובה העמוד משתנה (טופס, תמונות): המיקום של הסקשן זז, הציר של ViewTimeline מתעדכן לבד
      new ResizeObserver(() => { measure(); onScroll(); }).observe(document.body);
    },
    /** מעבר בין תנועה מלאה לעצירה (תפריט הנגישות). */
    restart(staticK) { build(staticK); tick(); },
    progress,
  };
}
