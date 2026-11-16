// ארון העבודות: שידת מגירות מעץ אגוז בתוך החדר. כל קטגוריה היא מגירה סגורה עם לוחית פליז (שם + כמה עבודות)
// וידית פלדה מחושלת. החומרים הם צילומים (site/img/chest, tools/images/chest.py), לא ציור ב-CSS.
// לחיצה פותחת את המגירה (ורק אותה) ובתוכה התמונות: במחשב בגריד, בטלפון ברצועה שמחליקים עם חץ "עוד".
// לחיצה על תמונה פותחת את הלייטבוקס. כשהשידה נכנסת למסך בפעם הראשונה, המגירה הראשונה "נפתחת קצת" וחוזרת, כרמז.
import { $, $$, pic, track, still, scrollTo } from "./util.js";
import { DOORS, worksOf } from "./data/work.js";

const PHONE = matchMedia("(max-width:820px)");
/** הטיה קטנה וקבועה לכל תמונה במגירה, כמו הדפסות שהונחו ביד. */
const tilt = (i) => [-1.4, 0.9, -0.6, 1.2, -1, 0.5, -1.6, 0.8][i % 8];

/** מגירה אחת: חזית (כפתור) ותיבה עם התמונות. */
function drawerHTML(d) {
  const works = worksOf(d.key);
  return `<section class="drawer" data-key="${d.key}">
    <h3 class="drawer-h"><button type="button" class="drawer-front" aria-expanded="false" aria-controls="dw-${d.key}">
      <span class="plate"><b>${d.label}</b><small>${works.length} עבודות</small></span><img class="pull" src="img/chest/pull-240.png" srcset="img/chest/pull-240.png 1x, img/chest/pull-480.png 2x" width="240" height="39" alt="" loading="lazy" decoding="async">
    </button></h3>
    <div class="drawer-box" id="dw-${d.key}" inert><div class="tray-wrap"><div class="tray">
      <ul class="shots">${works.map((w, i) => `<li style="--t:${tilt(i)}deg"><button type="button" class="shot" data-i="${i}" aria-label="הגדלה: ${w[1]}">${pic(w[0], w[1], "(max-width:820px) 62vw, 220px")}<span class="shot-cap">${w[1]}</span></button></li>`).join("")}</ul>
      <button type="button" class="tray-more" aria-label="עוד עבודות: ${d.label}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
    </div></div></div>
  </section>`;
}

/** פותח מגירה אחת וסוגר את השאר. בטלפון, גולל כך שחזית המגירה בראש המסך. */
function openDrawer(drawer, open) {
  $$(".drawer").forEach((d) => {
    const on = d === drawer && open;
    d.classList.toggle("open", on);
    $(".drawer-front", d).setAttribute("aria-expanded", on);
    $(".drawer-box", d).inert = !on;
  });
  if (!open) return;
  track("drawer_open", { category: drawer.dataset.key });
  syncMore(drawer);
  if (PHONE.matches) setTimeout(() => scrollTo(drawer), still() ? 0 : 120);
}

/** כמה נשאר לגלול ברצועה (ב-RTL scrollLeft הולך מ-0 לשלילי). */
const remaining = (el) => el.scrollWidth - el.clientWidth - Math.abs(el.scrollLeft);

/** החץ "עוד" ברצועה של הטלפון: נעלם כשמגיעים לסוף. */
function syncMore(drawer) {
  const shots = $(".shots", drawer);
  drawer.classList.toggle("at-end", remaining(shots) < 8);
}

/** רמז חד-פעמי: המגירה הראשונה נשלפת קצת וחוזרת כשהשידה נכנסת למסך. */
function hintOnce(chest) {
  if (still() || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    const first = $(".drawer", chest);
    if (!$(".drawer.open", chest)) { first.classList.add("peek"); setTimeout(() => first.classList.remove("peek"), 900); }
  }, { threshold: 0.5 });
  io.observe(chest);
}

/**
 * @param {{open(list, i), isOpen(): boolean}} lightbox
 */
export function initWorks(lightbox) {
  const chest = $("#chest");
  if (!chest) return;
  chest.innerHTML = DOORS.map(drawerHTML).join("");
  chest.addEventListener("click", (e) => {
    const front = e.target.closest(".drawer-front");
    if (front) { const d = front.closest(".drawer"); openDrawer(d, !d.classList.contains("open")); return; }
    const more = e.target.closest(".tray-more");
    if (more) { const s = $(".shots", more.closest(".drawer")); s.scrollBy({ left: -s.clientWidth * 0.8, behavior: still() ? "auto" : "smooth" }); return; } // RTL: שמאלה = הלאה
    const shot = e.target.closest(".shot"); if (!shot) return;
    const key = shot.closest(".drawer").dataset.key;
    track("work_open", { category: key });
    lightbox.open(worksOf(key), Number(shot.dataset.i));
  });
  $$(".shots", chest).forEach((s) => s.addEventListener("scroll", () => syncMore(s.closest(".drawer")), { passive: true }));
  hintOnce(chest);
}
