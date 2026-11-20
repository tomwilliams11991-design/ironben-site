// איך מודדים: מדידה אצל הלקוח בבית (ברירת מחדל) או מדידה עצמית עם טיפים. בשלב הפרטים, כשבוחרים מדידה בבית,
// שואלים מתי נוח שנגיע. הבחירה נכנסת להודעה של הליד (submit.js), בלי מחיר ובלי הערכה מול הלקוח.
import { $, $$, track } from "../util.js?v=f82c330";
import { state } from "./state.js?v=f82c330";

/** מציג את הטיפים רק במדידה עצמית, ואת שאלת השעה רק במדידה בבית. */
function sync() {
  const home = state.measure === "home";
  $("#measureTips").hidden = home;
  $("#whenRow").hidden = !home;
}

/** השורה שנכנסת בראש ההודעה בליד, כדי שבסדנה יראו מיד מה ביקשו. */
export function measureLine() {
  return state.measure === "home" ? `מבקשים מדידה בבית (נוח: ${state.when}).` : "מודדים בעצמם ושולחים מידות.";
}

export function initMeasure() {
  $("#measure").addEventListener("change", (e) => {
    if (e.target.name !== "measure") return;
    state.measure = e.target.value;
    track("measure_choice", { choice: state.measure, product: state.product?.slug || null });
    sync();
  });
  $("#whenChips").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $$("#whenChips button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    state.when = b.dataset.when;
  });
  sync();
}

/** חזרה לברירת המחדל לפני בקשה נוספת (אחרי form.reset). */
export function resetMeasure() {
  $$("#whenChips button").forEach((x) => x.setAttribute("aria-pressed", x.dataset.when === "גמיש"));
  sync();
}
