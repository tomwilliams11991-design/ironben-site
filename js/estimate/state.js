// מצב הטופס של ההצעה הראשונית. אובייקט אחד שכל חלקי הטופס קוראים ממנו וכותבים אליו.
export const state = {
  products: [],   // רשימת המוצרים (מהשרת או products.json)
  product: null,  // המוצר שנבחר
  inputs: {},     // ערכי השדות: מידות, finish, wood
  estimate: null, // התשובה האחרונה מ-estimate_quote
  model: null,    // ה-API של ההדמיה (model3d.mount), נטען בעצלתיים
  files: [],      // תמונות שהלקוח העלה (עד 5)
  step: 1,        // השלב הנוכחי 1..5 (5 = סיום)
};

/** איפוס לפני בקשה נוספת. */
export function resetState() {
  state.product = null; state.inputs = {}; state.estimate = null; state.files = []; state.step = 1;
}
