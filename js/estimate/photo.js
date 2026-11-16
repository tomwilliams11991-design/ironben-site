// התמונה של המוצר בשולחן העבודה: עבודה אמיתית שלנו (לא הדמיה מצוירת), עם קווי מידה מעליה שמתעדכנים
// עם הסליידרים: קו אופקי למידה הראשונה של רוחב/אורך, קו אנכי לגובה, ושאר המידות בשורה מתחת לתמונה.
// המסר: "זה המוצר, ואנחנו בונים אותו לפי המידות שלכם, אחרי מדידה אצלכם".
import { $, esc, pic } from "../util.js";
import { state } from "./state.js";

const H_KEYS = /^(length|width)/, V_KEYS = /^height/;

/** הערך של שדה עם היחידה שלו ("120 ס"מ"), או התווית של אפשרות בבחירה. */
function value(f) {
  const v = state.inputs[f.key];
  return f.type === "choice" ? f.options.find((o) => o.key === v)?.label ?? "" : `${v}${f.unit ? " " + f.unit : ""}`;
}

/** מציג את המוצר שנבחר: תמונה, כיתוב, וכרטיס גלוי בטלפון. */
export function showProduct(p) {
  $("#prodPic").innerHTML = pic(p.image || "railing-white", p.name, "(max-width:980px) 100vw, 40vw");
  $("#modelCap").textContent = `${p.name}: עבודה שלנו. אצלכם נבנה לפי המידות שלכם.`;
  $(".est-model").classList.add("has");
  updateDims();
}

/** קווי המידה על התמונה ורשימת המידות מתחתיה. */
export function updateDims() {
  const p = state.product; if (!p) return;
  const fields = p.input_schema.fields || [];
  const h = fields.find((f) => f.type !== "choice" && H_KEYS.test(f.key));
  const v = fields.find((f) => f.type !== "choice" && V_KEYS.test(f.key));
  $("#dims").innerHTML =
    (h ? `<div class="mline mline-w"><span>${esc(h.label)} ${esc(value(h))}</span></div>` : "") +
    (v ? `<div class="mline mline-h"><span>${esc(v.label)} ${esc(value(v))}</span></div>` : "");
  const rest = fields.filter((f) => f !== h && f !== v).map((f) => `${f.label}: ${value(f)}`);
  const S = p.input_schema, label = (list, k) => (list || []).find((o) => o.key === k)?.label;
  if (state.inputs.finish) rest.push(`גימור: ${label(S.finishes, state.inputs.finish)}`);
  if (state.inputs.wood) rest.push(`עץ: ${label(S.woods, state.inputs.wood)}`);
  // גם לקוראי מסך: כל המידות כטקסט (הקווים עצמם aria-hidden)
  $("#specList").innerHTML = [h && `${h.label}: ${value(h)}`, v && `${v.label}: ${value(v)}`, ...rest].filter(Boolean).map((t) => `<li>${esc(t)}</li>`).join("");
}
