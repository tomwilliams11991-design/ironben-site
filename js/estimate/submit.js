// שלב 4: שליחת הבקשה. מעלה תמונות והדמיות ל-Storage ויוצר ליד דרך create_lead (הערכה פנימית מחושבת בשרת, ללקוח לא מוצג מחיר).
import { $, track } from "../util.js";
import { C, sb, rpc, upload } from "../supabase.js";
import { waLink } from "../contact.js";
import { state } from "./state.js";
import { goStep } from "./steps.js";
import { measureLine } from "./measure.js";

/** בדיקת שם וטלפון. מחזיר הודעת שגיאה או null. */
function validate(name, phone) {
  if (name.length < 2) { $("#q-name").focus(); return "איך קוראים לכם?"; }
  if (!/^[0-9+\-\s()]{9,}$/.test(phone)) { $("#q-phone").focus(); return "מספר הטלפון לא נראה תקין."; }
  if (!sb) return "הטופס עוד לא מחובר. בינתיים אפשר לשלוח בוואטסאפ.";
  return null;
}

/** מעלה את תמונות הלקוח לתיקייה של הבקשה. */
async function uploadPhotos(key) {
  const paths = [];
  for (let i = 0; i < state.files.length; i++) {
    const f = state.files[i];
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
    const p = await upload(C.BUCKET_PHOTOS || "ironben-lead-photos", `${key}/${i}.${ext}`, f, f.type);
    if (p) paths.push(p);
  }
  return paths;
}

/** מצלם את ההדמיה (הדמיה + תוכנית) ומעלה כ-PNG. */
async function uploadRenders(key) {
  const paths = [];
  if (!state.model || !state.product) return paths;
  try {
    const shots = state.model.snapshot(1200);
    for (const [mode, url] of Object.entries(shots)) {
      const blob = await (await fetch(url)).blob();
      const p = await upload(C.BUCKET_RENDERS || "ironben-renders", `${key}/${mode === "3d" ? "view" : "plan"}.png`, blob, "image/png");
      if (p) paths.push(p);
    }
  } catch (e) { console.warn("snapshot", e); }
  return paths;
}

/** הרשומה שנשלחת ל-create_lead. */
function leadPayload(name, phone, photo_paths, render_paths) {
  const { product, inputs } = state;
  const dims = product ? Object.entries(inputs).filter(([k]) => !["finish", "wood"].includes(k)).map(([k, v]) => `${k}: ${v}`).join(", ") : null;
  return {
    name, phone, email: $("#q-email").value.trim() || null, city: $("#q-city").value.trim() || null,
    product_type: product?.name || null, customer_kind: $("#q-kind").value, dimensions: dims,
    message: [measureLine(), $("#q-msg").value.trim()].filter(Boolean).join("\n"), photo_paths, render_paths,
    product_slug: product?.slug || null, inputs: product ? inputs : null,
    sketch_params: product ? { model: product.input_schema.model || product.slug, ...inputs } : null,
    marketing_consent: $("#q-consent").checked, utm: location.search.slice(0, 300) || null,
  };
}

/** מסך הסיום: מה קורה עכשיו (מדידה בבית או הצעה לפי המידות), וכפתור וואטסאפ עם ההודעה המוכנה. */
function showDone() {
  const { product, measure, when } = state, home = measure === "home";
  const what = product ? ` ל${product.name}` : "";
  $("#doneTitle").textContent = home ? "קיבלנו. נחזור אליכם לתיאום מדידה." : "קיבלנו. נחזור אליכם עם הצעה.";
  $("#doneText").textContent = home ? `נתאם איתכם מדידה בבית${what}${when !== "גמיש" ? `, ב${when}` : ""}.` : `נעבור על המידות והתמונות ששלחתם${what} ונחזור אליכם.`;
  const msg = `היי, שלחתי בקשה באתר${what}. ` + (home ? "אשמח לתאם מדידה בבית." : "מדדתי בעצמי, אשמח להצעה.");
  const u = waLink(msg);
  if (u) $("#doneWa").href = u; else $("#doneWa").hidden = true;
  goStep(5);
}

export function initSubmit() {
  $("#estForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#formErr"), btn = $("#sendBtn");
    const name = $("#q-name").value.trim(), phone = $("#q-phone").value.trim();
    const problem = validate(name, phone);
    if (problem) { err.textContent = problem; return; }
    err.textContent = ""; btn.classList.add("loading"); btn.disabled = true;
    try {
      const key = crypto.randomUUID();
      const photo_paths = await uploadPhotos(key), render_paths = await uploadRenders(key);
      const { error } = await rpc("create_lead", { p: leadPayload(name, phone, photo_paths, render_paths) });
      if (error) throw error;
      track("lead_submitted", { product: state.product?.slug || null, measure: state.measure });
      showDone();
    } catch (e2) {
      console.error(e2); err.textContent = "השליחה נכשלה. אפשר לנסות שוב או לשלוח בוואטסאפ.";
    } finally { btn.classList.remove("loading"); btn.disabled = false; }
  });
}
