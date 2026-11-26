// שלב 2: מידות וגימור. השדות נבנים מ-input_schema של המוצר (סליידר לכל מידה, צ'יפים לבחירות).
import { $, $$ } from "../util.js?v=1db38d4";
import { state } from "./state.js?v=1db38d4";

/** HTML של שדה אחד: בחירה (צ'יפים) או מידה (סליידר עם ערך). */
function fieldHTML(f) {
  if (f.type === "choice") {
    return `<div class="field"><label>${f.label}</label><div class="chips" data-key="${f.key}">${f.options.map((o) =>
      `<button type="button" data-v="${o.key}" aria-pressed="${state.inputs[f.key] === o.key}">${o.label}</button>`).join("")}</div></div>`;
  }
  return `<div class="field"><label for="in-${f.key}">${f.label}</label><div class="slider"><input type="range" id="in-${f.key}" data-key="${f.key}" min="${f.min}" max="${f.max}" step="${f.step || 1}" value="${state.inputs[f.key]}"><output>${state.inputs[f.key]}<small>${f.unit || ""}</small></output></div></div>`;
}

/** צ'יפים של גימור / עץ. */
const chipsHTML = (list, cur) => (list || []).map((o) => `<button type="button" data-v="${o.key}" aria-pressed="${cur === o.key}">${o.label}</button>`).join("");

/** מצייר את כל השדות של המוצר הנוכחי. */
export function renderFields() {
  const S = state.product.input_schema;
  $("#fields").innerHTML = (S.fields || []).map(fieldHTML).join("");
  $("#finishChips").innerHTML = chipsHTML(S.finishes, state.inputs.finish);
  $("#woodChips").innerHTML = chipsHTML(S.woods, state.inputs.wood);
  $("#woodRow").hidden = !(S.woods || []).length;
}

/**
 * מאזין פעם אחת לשינויים בסליידרים ובצ'יפים ומעדכן את state.inputs.
 * @param {() => void} onChange נקרא אחרי כל שינוי (מעדכן את ההדמיה)
 */
export function bindFields(onChange) {
  $("#fields").addEventListener("input", (e) => {
    const r = e.target; if (r.type !== "range") return;
    state.inputs[r.dataset.key] = Number(r.value);
    r.nextElementSibling.firstChild.nodeValue = r.value;
    onChange();
  });
  $("#estForm").addEventListener("click", (e) => {
    const b = e.target.closest(".chips button"); if (!b) return;
    const chips = b.parentElement;
    const key = chips.dataset.key || (chips.id === "finishChips" ? "finish" : "wood");
    $$("button", chips).forEach((x) => x.setAttribute("aria-pressed", x === b));
    state.inputs[key] = b.dataset.v;
    onChange();
  });
}
