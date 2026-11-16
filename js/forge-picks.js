// ליד התנור: מה אפשר לבדוק עכשיו. תגית פלדה לכל מוצר (בלי מחירים), ולחיצה בוחרת אותו בשולחן העבודה
// וקופצת ישר לשלב המידות, שם רואים הדמיה ובוחרים איך מודדים.
import { $, esc, track } from "./util.js";
import { loadProducts, pickProduct } from "./estimate/products.js";
import { goStep } from "./estimate/steps.js";

/** שם קצר לתגית (בלי " עם ..."), כדי שתיכנס בשורה אחת בטלפון. */
const shortName = (name) => name.replace(/ עם .*$/, "");

function tagHTML(p, i) {
  return `<li style="--i:${i}"><button type="button" class="tag" data-slug="${esc(p.slug)}">
    <span class="tag-name">${esc(shortName(p.name))}</span><span class="tag-go">בדיקה ←</span></button></li>`;
}

function onTagClick(e) {
  const b = e.target.closest(".tag"); if (!b) return;
  track("forge_pick", { product: b.dataset.slug });
  if (pickProduct(b.dataset.slug)) goStep(2);
  else $("#bench")?.scrollIntoView({ behavior: "smooth" });
}

export async function initForgePicks() {
  const list = $("#tags");
  if (!list) return;
  const products = await loadProducts();
  list.innerHTML = products.map(tagHTML).join("");
  list.addEventListener("click", onTagClick);
}
