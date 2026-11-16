// השער שנפתח אל הסדנה. המסך הראשון של הגלילה בתוך #gate מחושב ל---p בין 0 ל-1 על <html>,
// וכל התנועה עצמה (סיבוב הכנפיים, זום הסדנה, כניסת הכותרת) נעשית ב-CSS (css/gate.css).
// ההמשך של #gate (ההליכה אל ארון העבודות) שייך ל-js/walk.js.
import { $, $$, still, track } from "./util.js";
import { GATE } from "./walk.js";

/** כמה מהשער נפתח: 0 בראש העמוד, 1 אחרי GATE.open מסכים של גלילה. */
function progress(gate) {
  return Math.min(1, Math.max(0, -gate.getBoundingClientRect().top / (innerHeight * GATE.open)));
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

/** גחלים שעולות מהכבשן (16 נקודות עם מסלול אקראי), בכניסה וליד התנור. לא נוצרות כשמפחיתים תנועה. */
function initEmbers() {
  if (still()) return;
  $$(".embers").forEach((el) => {
    const [from, spread] = el.dataset.x ? el.dataset.x.split(",").map(Number) : [22, 22];
    el.innerHTML = Array.from({ length: 16 }, () =>
      `<i style="--x:${from + Math.random() * spread}%;--d:${5 + Math.random() * 6}s;--dl:${-Math.random() * 10}s;--dx:${(Math.random() - 0.5) * 80}px"></i>`).join("");
  });
}

export function initGate() {
  initScrollEngine();
  initHotspots();
  initEmbers();
}
