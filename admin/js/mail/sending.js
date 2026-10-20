// מרכז מיילים, שליחה וחיבור: מתג השליחה האמיתית, מכסות, כתובת התשובות, והמפתחות (נשמרים ב-Vault דרך set_secret).
import { $, sb, A, C, say, reloadS, FN } from "../lib.js";

const SECRETS = ["resend_api_key", "mail_from", "resend_webhook_secret", "metals_api_key"];

export async function loadSending() {
  await reloadS();
  $("snd-enabled").value = String(!!A.S.outreach_enabled); $("snd-limit").value = A.S.outreach_daily_limit;
  $("snd-warmup").value = A.S.outreach_warmup_limit; $("snd-reply").value = A.S.reply_to_email || "";
  const st = (await sb.rpc("secrets_status")).data || {};
  SECRETS.forEach((k) => { $("st-" + k).innerHTML = st[k] ? '<span class="pill ok">מוגדר</span>' : '<span class="pill warn">חסר</span>'; $("sec-" + k).value = ""; });
  $("sec-urls").innerHTML = `כתובת ה-Webhook ל-Resend (אירועי bounce/complaint): <code>${C.SUPABASE_URL}/functions/v1/${FN("resend-webhook")}</code>`;
}

/** שמירה. הדלקת שליחה אמיתית נחסמת במסד עד שכל התנאים מתקיימים (ההודעה מהמסד אומרת מה חסר). */
async function saveSending() {
  const clamp = (v, d) => Math.max(1, Math.min(50, Number(v) || d));
  const r = await sb.from("settings").update({
    outreach_enabled: $("snd-enabled").value === "true", outreach_daily_limit: clamp($("snd-limit").value, 25),
    outreach_warmup_limit: clamp($("snd-warmup").value, 10), reply_to_email: $("snd-reply").value.trim().toLowerCase() || null,
    updated_at: new Date().toISOString(),
  }).eq("id", 1);
  say($("snd-msg"), r.error ? r.error.message : "נשמר.", !r.error);
  if (r.error) $("snd-enabled").value = "false";
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
