// מצב הטופס של ההצעה הראשונית. אובייקט אחד שכל חלקי הטופס קוראים ממנו וכותבים אליו.
export const state = {
  products: [],   // רשימת המוצרים (מהשרת או products.json)
  product: null,  // המוצר שנבחר
  inputs: {},     // ערכי השדות: מידות, finish, wood
  measure: "home", // איך מודדים: home = מגיעים לבית, self = הלקוח מודד
  when: "גמיש",    // מתי נוח למדידה בבית
  model: null,    // ה-API של ההדמיה (model3d.mount), נטען בעצלתיים
  files: [],      // תמונות שהלקוח העלה (עד 5)
  step: 1,        // השלב הנוכחי 1..5 (5 = סיום)
};

/** איפוס לפני בקשה נוספת. */
export function resetState() {
  state.product = null; state.inputs = {}; state.measure = "home"; state.when = "גמיש"; state.files = []; state.step = 1;
}
