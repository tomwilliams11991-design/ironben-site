// בתוך ארון העבודות: לכל קטגוריה חוט פלדה, והעבודות תלויות עליו כהדפסות עם אטב, כמו בסדנה.
// בטלפון מחליקים לאורך החוט (scroll-snap), במחשב גם גוררים עם העכבר; בכל חוט חץ "עוד" ורמז תזוזה קטן בפעם הראשונה.
// לחיצה על הדפסה פותחת את הלייטבוקס.
import { $, $$, FINE, pic, track, still } from "./util.js";
import { DOORS, worksOf } from "./data/work.js";

/** הטיה קטנה וקבועה לכל הדפסה (לא אקראית, כדי שלא תקפוץ בין טעינות). */
const tilt = (i) => [-2.2, 1.4, -0.8, 2, -1.6, 0.9, -2.4, 1.1, -0.5][i % 9];

/** חוט אחד: תגית פלדה עם שם הקטגוריה, ורשימת ההדפסות התלויות. */
function lineHTML(d) {
  const works = worksOf(d.key);
  return `<section class="line" aria-labelledby="ln-${d.key}">
    <h3 class="line-tag" id="ln-${d.key}">${d.label} <span>${works.length}</span></h3>
    <button type="button" class="line-more" aria-label="עוד עבודות: ${d.label}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
    <ul class="prints" data-key="${d.key}">${works.map((w, i) => `<li style="--t:${tilt(i)}deg"><button type="button" class="print" data-i="${i}" aria-label="הגדלה: ${w[1]}">
      <span class="clip" aria-hidden="true"></span>${pic(w[0], w[1], "(max-width:820px) 130px, 190px")}<span class="print-cap">${w[1]}</span></button></li>`).join("")}</ul>
  </section>`;
}

/** במחשב: גרירה עם העכבר לאורך החוט (בטלפון זה טבעי ממילא). לחיצה אחרי גרירה לא פותחת תמונה. */
function dragToScroll(el) {
  let x0 = 0, s0 = 0, moved = false, down = false;
  el.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; moved = false; x0 = e.clientX; s0 = el.scrollLeft; });
  addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - x0;
    if (Math.abs(dx) > 4) { moved = true; el.classList.add("dragging"); }
    el.scrollLeft = s0 - dx;
  });
  addEventListener("pointerup", () => { down = false; el.classList.remove("dragging"); });
  el.addEventListener("click", (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
}

/** כמה נשאר לגלול לאורך החוט (ב-RTL scrollLeft הולך מ-0 לשלילי). */
const remaining = (el) => el.scrollWidth - el.clientWidth - Math.abs(el.scrollLeft);

/** החץ "עוד": מזיז את החוט בערך מסך אחד, ונעלם כשמגיעים לסוף. */
function initMoreArrow(line) {
  const prints = $(".prints", line), more = $(".line-more", line);
  const sync = () => line.classList.toggle("at-end", remaining(prints) < 8);
  more.addEventListener("click", () => prints.scrollBy({ left: -prints.clientWidth * 0.8, behavior: still() ? "auto" : "smooth" })); // RTL: שמאלה = הלאה
  prints.addEventListener("scroll", sync, { passive: true });
  addEventListener("resize", sync);
  sync();
}

/** רמז חד-פעמי: כשהחוט נכנס למסך הוא זז קצת הלאה וחוזר, כדי שיהיה ברור שאפשר להחליק. */
function nudgeOnce(lines) {
  if (still() || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const p = $(".prints", e.target);
    if (remaining(p) < 8 || p.scrollLeft !== 0) return;
    p.scrollBy({ left: -70, behavior: "smooth" });
    setTimeout(() => p.scrollBy({ left: 70, behavior: "smooth" }), 650);
  }), { threshold: 0.6 });
  lines.forEach((l) => io.observe(l));
}

/**
 * @param {{open(list, i), isOpen(): boolean}} lightbox
 */
export function initWorks(lightbox) {
  const host = $("#lines");
  if (!host) return;
  host.innerHTML = DOORS.map(lineHTML).join("");
  host.addEventListener("click", (e) => {
    const b = e.target.closest(".print"); if (!b) return;
    const key = b.closest(".prints").dataset.key;
    track("work_open", { category: key });
    lightbox.open(worksOf(key), Number(b.dataset.i));
  });
  if (FINE) $$(".prints", host).forEach(dragToScroll);
  $$(".line", host).forEach(initMoreArrow);
  nudgeOnce($$(".line", host));
}
