// בתוך ארון העבודות: לכל קטגוריה חוט פלדה, והעבודות תלויות עליו כהדפסות עם אטב, כמו בסדנה.
// בטלפון מחליקים לאורך החוט (scroll-snap), במחשב גם גוררים עם העכבר. לחיצה על הדפסה פותחת את הלייטבוקס.
import { $, $$, FINE, pic, track } from "./util.js";
import { DOORS, worksOf } from "./data/work.js";

/** הטיה קטנה וקבועה לכל הדפסה (לא אקראית, כדי שלא תקפוץ בין טעינות). */
const tilt = (i) => [-2.2, 1.4, -0.8, 2, -1.6, 0.9, -2.4, 1.1, -0.5][i % 9];

/** חוט אחד: תגית פלדה עם שם הקטגוריה, ורשימת ההדפסות התלויות. */
function lineHTML(d) {
  const works = worksOf(d.key);
  return `<section class="line" aria-labelledby="ln-${d.key}">
    <h3 class="line-tag" id="ln-${d.key}">${d.label} <span>${works.length}</span></h3>
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
}
