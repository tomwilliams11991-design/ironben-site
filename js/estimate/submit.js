// שלב 4: שליחת הבקשה. מעלה את תמונות הלקוח ל-Storage ויוצר ליד דרך create_lead (הערכה פנימית מחושבת בשרת, ללקוח לא מוצג מחיר).
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

/** מעלה תמונות מסוג אחד לתיקייה של הבקשה: של המקום כ-0.jpg, 1.jpg..., והשראה כ-i0.jpg, i1.jpg... */
async function uploadPhotos(key, files, prefix = "") {
  const paths = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
    const p = await upload(C.BUCKET_PHOTOS || "ironben-lead-photos", `${key}/${prefix}${i}.${ext}`, f, f.type);
    if (p) paths.push(p);
  }
  return paths;
}

/** הרשומה שנשלחת ל-create_lead. */
function leadPayload(name, phone, photo_paths, inspo_paths) {
  const { product, inputs } = state;
  const dims = product ? Object.entries(inputs).filter(([k]) => !["finish", "wood"].includes(k)).map(([k, v]) => `${k}: ${v}`).join(", ") : null;
  return {
    name, phone, email: $("#q-email").value.trim() || null, city: $("#q-city").value.trim() || null,
    product_type: product?.name || null, customer_kind: $("#q-kind").value, dimensions: dims,
    message: [measureLine(), $("#q-msg").value.trim()].filter(Boolean).join("\n"), photo_paths, inspo_paths, render_paths: [],
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
    let sent = false;
    try {
      const key = crypto.randomUUID();
      const photo_paths = await uploadPhotos(key, state.files), inspo_paths = await uploadPhotos(key, state.inspo, "i");
      const { error } = await rpc("create_lead", { p: leadPayload(name, phone, photo_paths, inspo_paths) });
      if (error) throw error;
      sent = true;
    } catch (e2) {
      console.error(e2);
      err.textContent = /rate_limited/.test(e2?.message || "") ? "כבר קיבלנו ממך כמה פניות בשעה האחרונה. נחזור אליך בקרוב, ואפשר גם לכתוב לנו בוואטסאפ." : "השליחה נכשלה. אפשר לנסות שוב או לשלוח בוואטסאפ.";
    } finally { btn.classList.remove("loading"); btn.disabled = false; }
    // הבקשה נשמרה. מכאן שום תקלה בתצוגה לא תציג "נכשלה" (אחרת הלקוח שולח שוב ונוצרת פנייה כפולה).
    if (!sent) return;
    try { track("lead_submitted", { product: state.product?.slug || null, measure: state.measure }); showDone(); }
    catch (e3) { console.error(e3); goStep(5); }
  });
}
