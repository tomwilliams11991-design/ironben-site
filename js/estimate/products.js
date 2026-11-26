// שלב 1: מה בונים. טוען את המוצרים ומציג כרטיסי בחירה.
import { $, $$, pic } from "../util.js?v=1db38d4";
import { rpc } from "../supabase.js?v=1db38d4";
import { state } from "./state.js?v=1db38d4";

/** המוצרים הגלויים: מהשרת (public_products), ואם אין חיבור, מ-products.json. נטען פעם אחת. */
let productsOnce = null;
export function loadProducts() {
  productsOnce ||= (async () => {
    const { data, error } = await rpc("public_products");
    if (!error && data?.length) return data;
    const r = await fetch("products.json").catch(() => null);
    return r?.ok ? r.json() : [];
  })();
  return productsOnce;
}

/** ברירות המחדל של מוצר: מידות, גימור ועץ ראשונים. */
export function defaultInputs(p) {
  const inputs = {};
  (p.input_schema.fields || []).forEach((f) => { inputs[f.key] = f.default; });
  inputs.finish = p.input_schema.finishes?.[0]?.key;
  inputs.wood = p.input_schema.woods?.[0]?.key;
  return inputs;
}

/** בוחר מוצר: מאפס את הקלטים לברירות המחדל של הסכמה. */
function selectProduct(p) {
  state.product = p;
  state.inputs = defaultInputs(p);
}

/**
 * מצייר את כרטיסי המוצרים ומאזין לבחירה.
 * @param {(p) => void} onPick נקרא אחרי שהמוצר והקלטים עודכנו ב-state
 */
export function renderPicks(onPick) {
  const picks = $("#picks");
  picks.innerHTML = state.products.map((p) =>
    `<button type="button" class="pick" role="radio" aria-checked="false" data-slug="${p.slug}"><div class="ph">${pic(p.image || "railing-white", p.name, "(max-width:820px) 50vw, 15vw")}</div><span>${p.name}</span></button>`).join("");
  picks.addEventListener("click", (e) => {
    const b = e.target.closest(".pick"); if (!b) return;
    $$(".pick").forEach((x) => x.setAttribute("aria-checked", x === b));
    selectProduct(state.products.find((p) => p.slug === b.dataset.slug));
    onPick(state.product);
  });
}
