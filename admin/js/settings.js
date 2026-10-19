// הגדרות: תמחור (שעת עבודה, רווח, מע"מ, תוקף, מקדמה, הערכה באתר), פרטי העסק, ורשימת המנהלים.
import { $, $$, sb, A, esc, heDate, say, reloadS } from "./lib.js";

/** [שדה, כותרת, סוג]. bool = מתג פועל/כבוי. */
const FIELDS = [["labor_rate", "עלות שעת עבודה ₪", "number"], ["target_margin_pct", "יעד רווח %", "number"], ["vat_pct", 'מע"מ %', "number"], ["quote_valid_days", "תוקף הצעה (ימים)", "number"], ["deposit_pct", "מקדמה %", "number"],
  ["estimate_enabled", "הערכה ראשונית באתר", "bool"], ["estimate_spread_pct", "רוחב הטווח בהערכה (± %)", "number"],
  ["business_name", "שם העסק"], ["business_address", "כתובת"], ["business_phone", "טלפון"], ["business_email", "מייל העסק"], ["business_id", "ע.מ / ח.פ"], ["owner_notify_email", "מייל להתראות על לידים"], ["site_url", "כתובת האתר (https://...)"]];

const fieldHTML = (f, S) => f[2] === "bool"
  ? `<label class="l">${f[1]}<select data-f="${f[0]}"><option value="true"${S[f[0]] ? " selected" : ""}>פועלת</option><option value="false"${!S[f[0]] ? " selected" : ""}>כבויה</option></select></label>`
  : `<label class="l">${f[1]}<input data-f="${f[0]}" type="${f[2] || "text"}" step="any" value="${esc(S[f[0]])}"></label>`;

export async function loadSettings() {
  await reloadS();
  $("setForm").innerHTML = FIELDS.map((f) => fieldHTML(f, A.S)).join("");
  const admins = (await sb.from("admins").select("*").order("created_at")).data || [];
  $("admT").innerHTML = "<thead><tr><th>מייל</th><th>נוסף</th><th></th></tr></thead><tbody>" + admins.map((a) =>
    `<tr><td>${esc(a.email)}</td><td class="n">${heDate(a.created_at)}</td><td>${a.email === A.sess.user.email ? "<small>זה אתה</small>" : `<button class="btn small danger" data-rm="${esc(a.email)}">הסרה</button>`}</td></tr>`).join("") + "</tbody>";
  $$("[data-rm]", $("admT")).forEach((b) => b.onclick = async () => { if (!confirm("להסיר את " + b.dataset.rm + "?")) return; await sb.from("admins").delete().eq("email", b.dataset.rm); loadSettings(); });
}

async function saveSettings() {
  const o = { updated_at: new Date().toISOString() };
  $$("[data-f]", $("setForm")).forEach((el) => { const k = el.dataset.f; o[k] = el.tagName === "SELECT" ? el.value === "true" : el.type === "number" ? Number(el.value) : (el.value.trim() || null); });
  if (!o.business_name) o.business_name = "IRON BEN";
  if (!o.business_address) o.business_address = "בית עובד";
  const r = await sb.from("settings").update(o).eq("id", 1);
  say($("set-msg"), r.error ? r.error.message : "נשמר.", !r.error);
}

async function addAdmin() {
  const e = $("adm-email").value.trim().toLowerCase();
  if (!/\S+@\S+\.\S+/.test(e)) return say($("adm-msg"), "כתובת לא תקינה", false);
  const r = await sb.from("admins").insert({ email: e });
  say($("adm-msg"), r.error ? r.error.message : "נוסף.", !r.error); $("adm-email").value = ""; loadSettings();
}

export function initSettings() {
  $("set-save").onclick = saveSettings;
  $("adm-add").onclick = addAdmin;
}
