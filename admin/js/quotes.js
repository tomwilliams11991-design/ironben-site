// הצעות: רשימה עם סינון סטטוס, צפייה, העתקת קישור, עריכת טיוטה ושליחה חוזרת במייל.
import { $, $$, sb, A, esc, ils, heDate, say, options, QS, invoke } from "./lib.js";
import { editQuote } from "./builder.js";
import { go } from "./nav.js";

/** צבע התגית לפי סטטוס. */
const pillOf = (s) => (s === "accepted" ? "ok" : s === "expired" || s === "rejected" ? "bad" : s === "draft" ? "" : "new");

function quoteRow(q) {
  const link = (A.S.site_url || location.origin) + "/quote.html?t=" + q.token;
  return `<tr><td class="n">${q.number}</td><td class="n">${heDate(q.created_at)}</td><td>${esc(q.customer_name)}<small>${esc(q.customer_email || q.customer_phone)}</small></td><td>${esc(q.title)}</td><td class="n">${ils(q.total)}</td><td class="n">${ils(q.subtotal - q.cost_total)}</td>
    <td><span class="pill ${pillOf(q.status)}">${QS[q.status] || q.status}</span>${q.accepted_name ? `<small>${esc(q.accepted_name)} · ${heDate(q.accepted_at)}</small>` : ""}${q.viewed_at && !q.accepted_at ? `<small>נצפתה ${heDate(q.viewed_at)}</small>` : ""}</td><td class="n">${q.valid_until || ""}</td>
    <td><a href="${link}" target="_blank" rel="noopener">צפייה</a> · <button class="btn small" data-copy="${link}">העתקת קישור</button> ${q.status === "draft" ? `<button class="btn small" data-edit="${q.id}">עריכה</button>` : ""} ${!["accepted", "rejected"].includes(q.status) && q.customer_email ? `<button class="btn small" data-send="${q.id}">שליחה במייל</button>` : ""}</td></tr>`;
}

export async function loadQuotes() {
  let qb = sb.from("quotes").select("*").order("created_at", { ascending: false }).limit(300);
  if ($("quoteFilter").value) qb = qb.eq("status", $("quoteFilter").value);
  const rows = (await qb).data || [];
  $("quotesT").innerHTML = "<thead><tr><th>#</th><th>תאריך</th><th>לקוח</th><th>כותרת</th><th>סה\"כ</th><th>רווח</th><th>סטטוס</th><th>בתוקף עד</th><th></th></tr></thead><tbody>" + rows.map(quoteRow).join("") + "</tbody>";
  $$("[data-send]", $("quotesT")).forEach((b) => b.onclick = async () => { b.disabled = true; const x = await invoke("send-quote", { quote_id: b.dataset.send }); b.textContent = x.error ? "נכשל" : "נשלח"; say($("qMsg"), x.error || "נשלח", !x.error); });
  $$("[data-copy]", $("quotesT")).forEach((b) => b.onclick = () => { navigator.clipboard.writeText(b.dataset.copy); b.textContent = "הועתק"; });
  $$("[data-edit]", $("quotesT")).forEach((b) => b.onclick = async () => { const q = rows.find((x) => x.id === b.dataset.edit); if (q) { await editQuote(q); go("builder"); } });
}

export function initQuotes() {
  $("quoteFilter").innerHTML += options(QS);
  $("quoteFilter").onchange = loadQuotes;
}
