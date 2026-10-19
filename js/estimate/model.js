// ההדמיה לצד הטופס: נטענת בפעם הראשונה שבוחרים מוצר, ומתעדכנת עם כל שינוי.
import { $, $$ } from "../util.js";
import { loadModel } from "../model-loader.js";
import { state } from "./state.js";

/** בונה מחדש את ההדמיה לפי המוצר והקלטים הנוכחיים. */
export async function updateModel() {
  if (!state.product) return;
  if (!state.model) {
    const M = await loadModel(); if (!M) return;
    state.model = await M.mount($("#est3d"));
  }
  state.model.update(state.product.input_schema.model || state.product.slug, state.inputs, { finish: state.inputs.finish, wood: state.inputs.wood });
}

/** לשוניות הדמיה / תוכנית. */
export function initModelTabs() {
  $$(".model-tabs button").forEach((b) => b.addEventListener("click", () => {
    $$(".model-tabs button").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", x === b); });
    state.model?.setMode(b.dataset.mode);
  }));
}

/** מציג את כרטיס ההדמיה (בנייד הוא מוסתר עד שבוחרים מוצר). */
export function showModelCard(name) {
  $("#modelCap").textContent = name + ": גררו לסיבוב";
  $(".est-model").classList.add("has");
}
