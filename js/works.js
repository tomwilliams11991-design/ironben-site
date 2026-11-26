// ארון העבודות: שידת מגירות מעץ אגוז בתוך החדר. כל קטגוריה היא מגירה סגורה עם לוחית פליז (שם + "לחצו לפתיחה")
// וידית פלדה מחושלת. החומרים הם צילומים (site/img/chest, tools/images/chest.py), לא ציור ב-CSS.
// לחיצה פותחת את המגירה (ורק אותה) ובתוכה התמונות: העבודה הראשונה גדולה, השאר סביבה (בטלפון שתי עמודות ו"עוד").
// בסוף כל מגירה כפתור להמשך: הצעה ראשונית למוצר המתאים בשולחן העבודה, או וואטסאפ.
// לחיצה על תמונה פותחת את הלייטבוקס. כשהשידה נכנסת למסך בפעם הראשונה, המגירה הראשונה "נפתחת קצת" וחוזרת, כרמז.
import { $, $$, pic, track, still, scrollTo } from "./util.js?v=1db38d4";
import { DOORS, worksOf } from "./data/work.js?v=1db38d4";

const PHONE = matchMedia("(max-width:820px)");
/** כמה עבודות מוצגות בטלפון לפני הכפתור "עוד" (בטלפון שתי עמודות, הראשונה ברוחב מלא) */
const PHONE_FIRST = 7;
/** לאן מוביל הכפתור בסוף המגירה: מוצר בשולחן העבודה (הצעה ראשונית), או וואטסאפ לעבודות שמתכננים אישית */
const NEXT = {
  stairs: { wa: "היי, ראיתי באתר את גרמי המדרגות ואשמח לדבר על מדרגות אצלי.", label: "דברו איתנו על מדרגות" },
  gates: { product: "gate", label: "הצעה ראשונית לשער או מעקה" },
  outdoor: { wa: "היי, ראיתי באתר את הפרגולות ועבודות החוץ ואשמח לדבר על פרויקט.", label: "דברו איתנו על פרגולה או מטבח חוץ" },
  interior: { product: "shelving", label: "הצעה ראשונית לספריה או שולחן" },
  business: { product: "office_partition", label: "הצעה ראשונית לעסק" },
};

/** מגירה אחת: חזית (כפתור) ותיבה עם התמונות. הראשונה גדולה (עבודה מובחרת), השאר סביבה. */
function drawerHTML(d) {
  const works = worksOf(d.key), next = NEXT[d.key] || {};
  const more = works.length - PHONE_FIRST;
  return `<section class="drawer" data-key="${d.key}">
    <h3 class="drawer-h"><button type="button" class="drawer-front" aria-expanded="false" aria-controls="dw-${d.key}">
      <span class="plate"><b>${d.label}</b><small class="push">${works.length} עבודות · לחצו לפתיחה</small><small class="pushed">לחצו לסגירה</small></span><img class="pull" src="img/chest/pull-240.png" srcset="img/chest/pull-240.png 1x, img/chest/pull-480.png 2x" width="240" height="39" alt="" loading="lazy" decoding="async">
    </button></h3>
    <div class="drawer-box" id="dw-${d.key}" inert><div class="tray-wrap"><div class="tray">
      <ul class="shots">${works.map((w, i) => `<li${i >= PHONE_FIRST ? ' class="later"' : ""}><button type="button" class="shot" data-i="${i}" aria-label="הגדלה: ${w[1]}">${pic(w[0], w[1], i === 0 ? "(max-width:820px) 92vw, 460px" : "(max-width:820px) 46vw, 230px")}<span class="shot-cap">${w[1]}</span></button></li>`).join("")}</ul>
      ${more > 0 ? `<button type="button" class="tray-all">עוד ${more} עבודות</button>` : ""}
      <div class="tray-next"><span>אהבתם?</span>${next.product
        ? `<a class="btn primary small" href="#bench" data-product="${next.product}">${next.label}</a>`
        : `<a class="btn primary small js-wa" href="#" data-msg="${next.wa}">${next.label} בוואטסאפ</a>`}</div>
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
  if (PHONE.matches) setTimeout(() => scrollTo(drawer), still() ? 0 : 120);
}

/** הכפתור בסוף המגירה: גולל לשולחן העבודה ובוחר שם את המוצר המתאים (המוצרים נטענים מהשרת, אז מחכים להם רגע). */
function goToProduct(slug) {
  scrollTo($("#bench"));
  let tries = 0;
  const pick = () => {
    const b = $(`.pick[data-slug='${slug}']`);
    if (b) b.click(); else if (++tries < 20) setTimeout(pick, 150);
  };
  setTimeout(pick, still() ? 0 : 500);
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
 * @param {{open(list, i, fromImg), isOpen(): boolean}} lightbox
 */
export function initWorks(lightbox) {
  const chest = $("#chest");
  if (!chest) return;
  chest.innerHTML = DOORS.map(drawerHTML).join("");
  chest.addEventListener("click", (e) => {
    const front = e.target.closest(".drawer-front");
    if (front) { const d = front.closest(".drawer"); openDrawer(d, !d.classList.contains("open")); return; }
    const all = e.target.closest(".tray-all");
    if (all) { all.closest(".drawer").classList.add("all"); all.remove(); return; }
    const prod = e.target.closest("[data-product]");
    if (prod) { e.preventDefault(); track("drawer_to_bench", { product: prod.dataset.product }); goToProduct(prod.dataset.product); return; }
    const shot = e.target.closest(".shot"); if (!shot) return;
    const key = shot.closest(".drawer").dataset.key;
    track("work_open", { category: key });
    lightbox.open(worksOf(key), Number(shot.dataset.i), $("img", shot));
  });
  hintOnce(chest);
}
