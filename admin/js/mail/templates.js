// מרכז מיילים, תבניות: עריכת נושא ו-HTML לכל סוג מייל (וסגמנט), תצוגה מקדימה עם נתוני דוגמה, ומייל בדיקה.
import { $, sb, A, say, invoke, TKEYS, SEG } from "../lib.js";

let TPLS = [], cur = null;

/** מציג את התבנית שנבחרה בעורך. */
function showTemplate() {
  cur = TPLS.find((t) => String(t.id) === $("t-pick").value) || TPLS[0]; if (!cur) return;
  $("t-name").value = cur.name; $("t-subject").value = cur.subject; $("t-html").value = cur.html; $("t-enabled").checked = cur.enabled;
  $("t-frame").srcdoc = ""; $("t-psub").textContent = "";
}

export async function loadTemplates() {
  TPLS = (await sb.from("email_templates").select("*").order("key").order("segment", { nullsFirst: true })).data || [];
  $("t-pick").innerHTML = TPLS.map((t) => `<option value="${t.id}">${TKEYS[t.key] || t.key}${t.segment ? ": " + (SEG[t.segment] || t.segment) : ""}</option>`).join("");
  showTemplate();
}

async function saveTemplate() {
  const r = await sb.from("email_templates").update({ name: $("t-name").value.trim(), subject: $("t-subject").value, html: $("t-html").value, enabled: $("t-enabled").checked, updated_at: new Date().toISOString(), updated_by: A.sess.user.email }).eq("id", cur.id);
  say($("t-msg"), r.error ? r.error.message : "נשמר.", !r.error);
  if (!r.error) { const id = cur.id; await loadTemplates(); $("t-pick").value = id; showTemplate(); }
}

/** רינדור בשרת (email-preview) עם הטקסט שבעורך; test_to שולח מייל אמיתי. */
async function preview(test_to) {
  const r = await invoke("email-preview", { key: cur.key, segment: cur.segment, subject: $("t-subject").value, html: $("t-html").value, test_to });
  if (r.error) return say($("t-msg"), r.error, false);
  $("t-psub").textContent = "נושא: " + r.subject; $("t-frame").srcdoc = r.html;
  say($("t-msg"), test_to ? "נשלחה בדיקה ל-" + test_to : "תצוגה עם נתוני דוגמה", true);
}

export function initTemplates() {
  $("t-pick").onchange = showTemplate;
  $("t-save").onclick = saveTemplate;
  $("t-preview").onclick = () => preview();
  $("t-test").onclick = () => preview(A.sess.user.email);
}
