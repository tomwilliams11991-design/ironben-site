// מרכז מיילים, שליחה וחיבור: מתג השליחה האוטומטית, מכסה יומית, והמפתחות (נשמרים ב-Vault דרך set_secret).
import { $, sb, A, C, say, reloadS, FN } from "../lib.js";

const SECRETS = ["resend_api_key", "mail_from", "resend_webhook_secret", "metals_api_key"];

export async function loadSending() {
  await reloadS();
  $("snd-enabled").value = String(!!A.S.outreach_enabled); $("snd-limit").value = A.S.outreach_daily_limit;
  const st = (await sb.rpc("secrets_status")).data || {};
  SECRETS.forEach((k) => { $("st-" + k).innerHTML = st[k] ? '<span class="pill ok">מוגדר</span>' : '<span class="pill warn">חסר</span>'; $("sec-" + k).value = ""; });
  $("sec-urls").innerHTML = `כתובת ה-Webhook ל-Resend (אירועי bounce/complaint): <code>${C.SUPABASE_URL}/functions/v1/${FN("resend-webhook")}</code>`;
}

async function saveSending() {
  const r = await sb.from("settings").update({ outreach_enabled: $("snd-enabled").value === "true", outreach_daily_limit: Math.max(1, Math.min(50, Number($("snd-limit").value) || 20)), updated_at: new Date().toISOString() }).eq("id", 1);
  say($("snd-msg"), r.error ? r.error.message : "נשמר.", !r.error);
}

/** שומר רק מפתחות שהוזנו (השדות ריקים אחרי טעינה בכוונה). */
async function saveSecrets() {
  let n = 0;
  for (const k of SECRETS) {
    const v = $("sec-" + k).value.trim(); if (!v) continue;
    const r = await sb.rpc("set_secret", { p_name: k, p_value: v });
    if (r.error) return say($("sec-msg"), r.error.message, false);
    n++;
  }
  say($("sec-msg"), n ? `נשמרו ${n} מפתחות.` : "לא הוזן כלום.", !!n); loadSending();
}

export function initSending() {
  $("snd-save").onclick = saveSending;
  $("sec-save").onclick = saveSecrets;
}
