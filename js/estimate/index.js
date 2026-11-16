// שולחן העבודה: ההצעה הראשונית בארבעה שלבים. כאן רק החיווט בין החלקים:
// products (שלב 1) → fields + photo + measure (שלב 2) → steps/photos (שלב 3) → submit (שלב 4). ar: התמונה בחדר דרך הטלפון.
import { $ } from "../util.js";
import { state, resetState } from "./state.js";
import { loadProducts, renderPicks } from "./products.js";
import { renderFields, bindFields } from "./fields.js";
import { initMeasure, resetMeasure } from "./measure.js";
import { showProduct, updateDims } from "./photo.js";
import { goStep, initStepNav, initPhotos } from "./steps.js";
import { initAR } from "./ar.js";
import { initSubmit } from "./submit.js";

/** כל שינוי בקלטים: קווי המידה על התמונה. */
function onInputsChanged() { updateDims(); }

/** בחירת מוצר: שדות, תמונה, ואפשר להמשיך. */
function onProductPicked(p) {
  $("[data-step='1'] [data-next]").disabled = false;
  renderFields();
  showProduct(p);
}

export async function initEstimate() {
  if (!$("#estForm")) return;
  bindFields(onInputsChanged);
  initStepNav();
  initPhotos();
  initMeasure();
  initAR();
  initSubmit();
  $("#restart").addEventListener("click", () => { $("#estForm").reset(); resetState(); resetMeasure(); $("#thumbs").innerHTML = ""; $("#inspoThumbs").innerHTML = ""; goStep(1); });
  state.products = await loadProducts();
  renderPicks(onProductPicked);
}
