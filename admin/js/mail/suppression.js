// מרכז מיילים, רשימת הסרה: כתובות שלא שולחים אליהן (הסרה עצמית, bounce, ספאם, ידני).
import { $, $$, sb, esc, heDate, say } from "../lib.js";

const REASON = { unsubscribe: "לחץ הסרה", bounced: "חזר", complained: "דווח כספאם", manual: "ידני" };

export async function loadSupp() {
  const rows = (await sb.from("suppression").select("*").order("created_at", { ascending: false }).limit(500)).data || [];
  $("suppT").innerHTML = "<thead><tr><th>כתובת</th><th>סיבה</th><th>מתי</th><th></th></tr></thead><tbody>" + rows.map((x) =>
    `<tr><td>${esc(x.email)}</td><td>${REASON[x.reason] || esc(x.reason)}</td><td class="n">${heDate(x.created_at)}</td><td><button class="btn small" data-rm="${esc(x.email)}">הסרה מהרשימה</button></td></tr>`).join("") + "</tbody>";
  $$("[data-rm]", $("suppT")).forEach((b) => b.onclick = async () => { if (!confirm("להחזיר את הכתובת לרשימה שמותר לשלוח אליה?")) return; await sb.from("suppression").delete().eq("email", b.dataset.rm); loadSupp(); });
}

/** הוספה ידנית: גם לרשימה וגם מסמן את איש הקשר כמוסר. */
async function addSupp() {
  const e = $("sp-email").value.trim().toLowerCase();
  if (!/\S+@\S+\.\S+/.test(e)) return say($("sp-msg"), "כתובת לא תקינה", false);
  const r = await sb.from("suppression").upsert({ email: e, reason: $("sp-reason").value.trim() || "manual" });
  await sb.from("outreach_contacts").update({ status: "opted_out", opted_out_at: new Date().toISOString() }).eq("email", e);
  say($("sp-msg"), r.error ? r.error.message : "נוסף.", !r.error); $("sp-email").value = ""; loadSupp();
}

export function initSupp() { $("sp-add").onclick = addSupp; }
