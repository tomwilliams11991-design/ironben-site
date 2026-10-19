// מרכז מיילים, לוג: כל מייל שנשלח (או נכשל), עם סינון סוג/מצב וחיפוש לפי כתובת.
import { $, sb, esc, heTime, SEG } from "../lib.js";

const KIND = { outreach: "פנייה", quote: "הצעה", lead_notify: "התראת ליד", lead_autoreply: "אישור ללקוח", steel_alert: "ברזל", test: "בדיקה" };
const STATUS = { sent: ["נשלח", "new"], delivered: ["נמסר", "ok"], failed: ["נכשל", "bad"], bounced: ["חזר", "bad"], complained: ["ספאם", "bad"] };

const logRow = (x) => `<tr><td class="n">${heTime(x.created_at)}</td><td>${KIND[x.kind] || esc(x.kind)}${x.segment ? `<small>${SEG[x.segment] || x.segment}</small>` : ""}</td><td>${esc(x.to_email)}</td><td>${esc(x.subject)}</td><td><span class="pill ${STATUS[x.status]?.[1] || ""}">${STATUS[x.status]?.[0] || esc(x.status)}</span></td><td><small>${esc(x.error)}</small></td></tr>`;

export async function loadLog() {
  let qb = sb.from("email_log").select("*").order("created_at", { ascending: false }).limit(300);
  if ($("l-kind").value) qb = qb.eq("kind", $("l-kind").value);
  if ($("l-status").value) qb = qb.eq("status", $("l-status").value);
  const q = $("l-search").value.trim(); if (q) qb = qb.ilike("to_email", `%${q}%`);
  const rows = (await qb).data || [];
  $("logT").innerHTML = "<thead><tr><th>מתי</th><th>סוג</th><th>אל</th><th>נושא</th><th>מצב</th><th>שגיאה</th></tr></thead><tbody>" + rows.map(logRow).join("") + "</tbody>";
}

export function initLog() {
  $("l-kind").onchange = $("l-status").onchange = $("l-refresh").onclick = $("l-search").oninput = loadLog;
}
