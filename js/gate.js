// השער: הכותרת העליונה, נקודות על הכלים והגחלים. התנועה בגלילה (פתיחת השער, ההליכה) נמצאת ב-js/walk.js.
import { $, $$, still } from "./util.js";

/** הכותרת העליונה: רקע מלא אחרי 40px גלילה (קורא רק scrollY, בלי מדידות). */
function initHeader() {
  const header = $("#top");
  if (!header) return;
  const update = () => header.classList.toggle("solid", scrollY > 40);
  addEventListener("scroll", update, { passive: true });
  update();
}

/** נקודות על הכלים: במחשב ריחוף (CSS), בנייד ובמקלדת נגיעה פותחת וסוגרת. */
function initHotspots() {
  $$(".spots button").forEach((b) => b.addEventListener("click", () => {
    const on = b.getAttribute("aria-expanded") === "true";
    $$(".spots button").forEach((x) => x.setAttribute("aria-expanded", "false"));
    b.setAttribute("aria-expanded", String(!on));
  }));
}

/** גחלים שעולות מהכבשן בכניסה (16 נקודות, 10 בטלפון, עם מסלול אקראי). לא נוצרות כשמפחיתים תנועה. */
function initEmbers() {
  if (still()) return;
  $$(".embers").forEach((el) => {
    const from = 22, spread = 22; // אחוז מרוחב התמונה: מעל הכבשן
    el.innerHTML = Array.from({ length: innerWidth < 820 ? 10 : 16 }, () =>
      `<i style="--x:${from + Math.random() * spread}%;--d:${5 + Math.random() * 6}s;--dl:${-Math.random() * 10}s;--dx:${(Math.random() - 0.5) * 80}px"></i>`).join("");
  });
}

export function initGate() {
  initHeader();
  initHotspots();
  initEmbers();
}
