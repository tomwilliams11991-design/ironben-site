// תגי המחיר ליד התנור: לכמה עבודות נפוצות, טווח מחיר אמיתי מהשרת (estimate_quote עם מידות ברירת המחדל של המוצר).
// לחיצה על תג בוחרת את המוצר בשולחן העבודה וממשיכה ישר למידות.
import { $, ils, esc, track } from "./util.js";
import { rpc } from "./supabase.js";
import { loadProducts, defaultInputs, specLine, pickProduct } from "./estimate/products.js";
import { goStep } from "./estimate/steps.js";

/** אילו מוצרים תלויים ליד התנור, לפי הסדר. */
const TAG_SLUGS = ["stairs", "gate", "pergola", "railing"];

/** HTML של תג אחד (המחיר נכנס אחר כך). */
function tagHTML(p, i) {
  return `<li style="--i:${i}"><button type="button" class="tag" data-slug="${esc(p.slug)}">
    <span class="tag-name">${esc(p.name)}</span><span class="tag-spec">${esc(specLine(p, defaultInputs(p)))}</span>
    <b class="tag-price" data-price>&nbsp;</b><span class="tag-go">לבנות הצעה משלכם ←</span></button></li>`;
}

/** טווח למוצר אחד, לפי מידות ברירת המחדל. בלי חיבור לשרת: התג נשאר בלי מחיר. */
async function fillPrice(li, p) {
  const { data, error } = await rpc("estimate_quote", { p_product_slug: p.slug, p_inputs: defaultInputs(p) });
  const el = $("[data-price]", li);
  if (error || !data || data.disabled) { el.textContent = "הצעה עם הדמיה"; return; }
  // בטלפון רואים רק "מ-" והמחיר הנמוך (css/walk.css מסתיר את .hi), במחשב את הטווח המלא
  el.innerHTML = `<span class="from">מ-</span>${ils(data.low)}<span class="hi"> עד ${ils(data.high)}</span><small>לפני מע"מ</small>`;
}

/** לחיצה על תג: בוחרים את המוצר בטופס ועוברים למידות (שם גם הגלילה). */
function onTagClick(e) {
  const b = e.target.closest(".tag"); if (!b) return;
  track("price_tag_click", { product: b.dataset.slug });
  if (pickProduct(b.dataset.slug)) goStep(2);
  else $("#bench")?.scrollIntoView({ behavior: "smooth" });
}

export async function initPriceTags() {
  const list = $("#tags");
  if (!list) return;
  const all = await loadProducts();
  const products = TAG_SLUGS.map((s) => all.find((p) => p.slug === s)).filter(Boolean);
  list.innerHTML = products.map(tagHTML).join("");
  list.addEventListener("click", onTagClick);
  [...list.children].forEach((li, i) => fillPrice(li, products[i]));
}
