// שולחן העבודה: ההצעה הראשונית בארבעה שלבים. כאן רק החיווט בין החלקים:
// products (שלב 1) → fields + photo + measure (שלב 2) → steps/photos (שלב 3) → submit (שלב 4). ar: התמונה בחדר דרך הטלפון.
import { $ } from "../util.js?v=f82c330";
import { state, resetState } from "./state.js?v=f82c330";
import { loadProducts, renderPicks } from "./products.js?v=f82c330";
import { renderFields, bindFields } from "./fields.js?v=f82c330";
import { initMeasure, resetMeasure } from "./measure.js?v=f82c330";
import { showProduct, updateDims } from "./photo.js?v=f82c330";
import { goStep, initStepNav, initPhotos } from "./steps.js?v=f82c330";
import { initAR } from "./ar.js?v=f82c330";
import { initSubmit } from "./submit.js?v=f82c330";

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
