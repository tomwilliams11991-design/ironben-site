// ממשק הניהול: שכבת העזר המשותפת לכל המסכים. לקוח Supabase, מצב משותף (A), פורמטים, תוויות בעברית, דיאלוג.
export const C = window.IRONBEN_CONFIG || {};
export const P = window.IronPricing; // admin/pricing.js, התאום של estimate_quote בשרת

/** אלמנט לפי id / כל האלמנטים לפי בורר. */
export const $ = (id) => document.getElementById(id);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const ils = (n) => Math.round(Number(n) || 0).toLocaleString("he-IL") + " ₪";
export const heDate = (d) => (d ? new Date(d).toLocaleDateString("he-IL", { timeZone: "Asia/Jerusalem" }) : "");
export const heTime = (d) => (d ? new Date(d).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" }) : "");
export const todayIL = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
/** טלפון ישראלי → פורמט וואטסאפ בינלאומי. */
export const waNumber = (phone) => String(phone || "").replace(/\D/g, "").replace(/^0/, "972");
/** הודעת סטטוס ליד טופס: say(el, "נשמר", true) / say(el, "שגיאה", false). */
export const say = (el, t, ok) => { el.textContent = t || ""; el.className = "msg " + (ok === false ? "err" : ok ? "ok" : ""); };
/** שם פונקציית Edge עם הקידומת (ironben-). */
export const FN = (n) => (C.FUNCTIONS_PREFIX || "ironben-") + n;

/** תוויות בעברית לערכי הסטטוס במסד. */
export const KIND = { private: "לקוח פרטי", architect: "אדריכל / מעצב", business: "חברה / עסק" };
export const SEG = { architect: "אדריכלים", designer: "מעצבים", office: "משרדים", fitout: "קבלני גמר", hospitality: "אירוח", retail: "חנויות", other: "אחר" };
export const LSTATUS = { new: "חדש", contacted: "דיברנו", measured: "נמדד", quoted: "הצעה נשלחה", won: "נסגר", lost: "לא נסגר" };
export const QS = { draft: "טיוטה", sent: "נשלחה", viewed: "נצפתה", accepted: "אושרה", rejected: "נדחתה", expired: "פג תוקף" };
export const OS = { new: "חדש", approved: "מאושר לשליחה", sent: "נשלח", failed: "נכשל", replied: "ענה", opted_in: "אישר עדכונים", opted_out: "הוסר", bounced: "חזר" };
export const TKEYS = { outreach: "פנייה לחברות", quote: "הצעת מחיר ללקוח", lead_autoreply: "אישור קבלה ללקוח", lead_notify: "התראה על ליד", steel_alert: "התראת ברזל" };

/** <option> לכל ערך במפה, עם בחירה אופציונלית. */
export const options = (map, selected) => Object.entries(map).map(([k, v]) => `<option value="${k}"${k === selected ? " selected" : ""}>${v}</option>`).join("");

/** הלקוח (מפתח anon + JWT של המנהל אחרי כניסה). */
export const sb = C.SUPABASE_URL && C.SUPABASE_ANON_KEY ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, { db: { schema: C.SCHEMA || "ironben" } }) : null;

/** מצב משותף: המשתמש, ההגדרות (settings שורה 1), והמוצרים. */
export const A = { sess: null, S: null, PRODUCTS: [] };

/** טוען מחדש את ההגדרות (אחרי שמירה, או לפני תמחור). */
export async function reloadS() { A.S = (await sb.from("settings").select("*").eq("id", 1).single()).data; return A.S; }
/** המוצרים, פעם אחת. invalidateProducts() אחרי עריכה. */
export async function ensureProducts() { if (!A.PRODUCTS.length) A.PRODUCTS = (await sb.from("products").select("*").order("sort")).data || []; return A.PRODUCTS; }
export const invalidateProducts = () => { A.PRODUCTS = []; };

/** קריאה לפונקציית Edge. מחזיר את גוף התשובה, או {error: "..."}. */
export async function invoke(name, body) {
  const r = await sb.functions.invoke(FN(name), { body: body || {} });
  if (r.error) { let msg = r.error.message; try { const j = await r.error.context?.json(); if (j?.error) msg = j.error; } catch {} return { error: msg }; }
  return r.data || {};
}

/** דיאלוג כללי (תצוגות מקדימות). */
export function openDlg(title, html) { $("dlg-title").textContent = title; $("dlg-body").innerHTML = html; $("dlg").showModal(); }
export function initDialog() { $("dlg-close").onclick = () => $("dlg").close(); }
