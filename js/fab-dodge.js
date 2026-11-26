// בטלפון, כפתור הוואטסאפ הצף יושב בתחתית המסך, בדיוק איפה שהסליידרים של המידות. כשהטופס של שולחן העבודה
// נמצא בתחתית המסך, מסמנים html.form-on, וה-CSS (fab.css, a11y.css) מסתיר את הוואטסאפ ומקטין את כפתור הנגישות.
// בטופס יש כפתור וואטסאפ משלו במסך הסיום, כך ששום דבר לא הולך לאיבוד.
import { $ } from "./util.js?v=1db38d4";

export function initFabDodge() {
  const form = $("#estForm");
  if (!form || !("IntersectionObserver" in window)) return;
  // השורש הוא רק 15% התחתונים של המסך: שם יושבים הכפתורים הצפים
  new IntersectionObserver(([e]) => document.documentElement.classList.toggle("form-on", e.isIntersecting),
    { rootMargin: "-85% 0px 0px 0px" }).observe(form);
}
