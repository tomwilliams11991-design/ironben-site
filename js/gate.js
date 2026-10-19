// השער שנפתח אל הסדנה. הגלילה בתוך #gate (גובה 200vh) מחושבת ל---p בין 0 ל-1 על <html>,
// וכל התנועה עצמה (סיבוב הכנפיים, זום הסדנה, כניסת הכותרת) נעשית ב-CSS (css/gate.css).
import { $, $$, still, track } from "./util.js";

/** כמה מהשער נפתח: 0 בראש העמוד, 1 כשהסקשן הנעוץ נגמר. */
function progress(gate) {
  const total = Math.max(1, gate.offsetHeight - innerHeight);
  return Math.min(1, Math.max(0, -gate.getBoundingClientRect().top / total));
}

/** כותב את ההתקדמות ל-CSS, מדליק את הטקסט והנקודות כשהשער כמעט פתוח, ומעביר את הניווט לזכוכית. */
function initScrollEngine() {
  const gate = $("#gate"), stage = $(".stage"), header = $("#top"), root = document.documentElement;
  if (!gate || !stage) return;
  let last = "", ticking = false;
  function tick() {
    ticking = false;
    const frozen = still();
    const p = frozen ? "" : progress(gate).toFixed(4);
    // כותבים ל-html רק כשהערך השתנה: משתנה על השורש מחלחל לכל העמוד
    if (p !== last) { if (frozen) root.style.removeProperty("--p"); else root.style.setProperty("--p", p); last = p; }
    const open = frozen || Number(p) > 0.88;
    if (open && !stage.classList.contains("open")) track("gate_opened");
    stage.classList.toggle("open", open);
    header.classList.toggle("solid", scrollY > 40);
  }
  const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  document.documentElement.addEventListener("a11ychange", schedule);
  tick();
}

/** נקודות על הכלים: במחשב ריחוף (CSS), בנייד ובמקלדת נגיעה פותחת וסוגרת. */
function initHotspots() {
  $$(".spots button").forEach((b) => b.addEventListener("click", () => {
    const on = b.getAttribute("aria-expanded") === "true";
    $$(".spots button").forEach((x) => x.setAttribute("aria-expanded", "false"));
    b.setAttribute("aria-expanded", String(!on));
  }));
}

/** גחלים שעולות מהכבשן (16 נקודות עם מסלול אקראי). לא נוצרות כשמפחיתים תנועה. */
function initEmbers() {
  const el = $(".embers");
  if (!el || still()) return;
  el.innerHTML = Array.from({ length: 16 }, () =>
    `<i style="--x:${22 + Math.random() * 22}%;--d:${5 + Math.random() * 6}s;--dl:${-Math.random() * 10}s;--dx:${(Math.random() - 0.5) * 80}px"></i>`).join("");
}

export function initGate() {
  initScrollEngine();
  initHotspots();
  initEmbers();
}
