// שולחן העבודה: ההצעה הראשונית בארבעה שלבים. כאן רק החיווט בין החלקים:
// products (שלב 1) → fields + model + pricing-view (שלב 2) → steps/photos (שלב 3) → submit (שלב 4). ar: ההדמיה במצלמה של הטלפון.
import { $ } from "../util.js";
import { state, resetState } from "./state.js";
import { loadProducts, renderPicks } from "./products.js";
import { renderFields, bindFields } from "./fields.js";
import { requestEstimate } from "./pricing-view.js";
import { updateModel, initModelTabs, showModelCard } from "./model.js";
import { goStep, initStepNav, initPhotos } from "./steps.js";
import { initSubmit } from "./submit.js";
import { initAR } from "./ar.js";

/** כל שינוי בקלטים: הדמיה חדשה ומחיר חדש. */
function onInputsChanged() { updateModel(); requestEstimate(); }

/** בחירת מוצר: שדות, הדמיה, מחיר, ואפשר להמשיך. */
function onProductPicked(p) {
  $("[data-step='1'] [data-next]").disabled = false;
  renderFields();
  showModelCard(p.name);
  onInputsChanged();
}

export async function initEstimate() {
  if (!$("#estForm")) return;
  bindFields(onInputsChanged);
  initModelTabs();
  initStepNav();
  initPhotos();
  initSubmit();
  initAR();
  $("#restart").addEventListener("click", () => { $("#estForm").reset(); resetState(); $("#thumbs").innerHTML = ""; goStep(1); });
  state.products = await loadProducts();
  renderPicks(onProductPicked);
}
