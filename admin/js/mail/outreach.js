// מרכז מיילים, תור פניות: אנשי קשר לפנייה יזומה. ייבוא CSV, אישור לשליחה, תצוגה מקדימה, שליחה ידנית, הסרה.
import { $, $$, sb, A, esc, heDate, say, options, reloadS, invoke, openDlg, SEG, OS } from "../lib.js";

/** צבע התגית לפי סטטוס איש הקשר. */
const pillOf = (s) => (s === "approved" ? "new" : ["replied", "opted_in"].includes(s) ? "ok" : ["opted_out", "bounced", "failed"].includes(s) ? "bad" : "");

/** כפתורי הפעולה לשורה, לפי הסטטוס. */
function actionsHTML(c) {
  const btn = (act, label, cls = "") => `<button class="btn small ${cls}" data-act="${act}" data-id="${c.id}">${label}</button>`;
  return [
    btn("preview", "תצוגה"),
    c.status === "approved" ? btn("unapprove", "ביטול אישור") : "",
    ["sent", "failed"].includes(c.status) ? btn("replied", "ענה") + btn("opted_in", "אישר עדכונים") : "",
    c.status !== "opted_out" ? btn("opted_out", "הסרה") : "",
    c.status === "failed" ? btn("retry", "נסה שוב") : "",
    btn("delete", "מחיקה", "danger"),
  ].join(" ");
}

function contactRow(c) {
  return `<tr><td>${c.status === "new" ? `<input type=checkbox data-sel="${c.id}">` : ""}</td><td>${esc(c.company)}${c.source_url ? `<small><a href="${esc(c.source_url)}" target="_blank" rel="noopener">מקור</a></small>` : ""}</td><td>${esc(c.contact_name)}</td><td>${esc(c.email)}</td>
    <td><select data-edit="segment" data-id="${c.id}">${options(SEG, c.segment)}</select></td><td><input class="wide" data-edit="personal_line" data-id="${c.id}" value="${esc(c.personal_line)}" placeholder="איזה פרויקט שלהם ראית"></td>
    <td><span class="pill ${pillOf(c.status)}">${OS[c.status] || c.status}</span>${c.sent_at ? `<small>נשלח ${heDate(c.sent_at)}</small>` : ""}${c.replied_at ? `<small>ענה ${heDate(c.replied_at)}</small>` : ""}${c.last_error ? `<small class="warn">${esc(c.last_error).slice(0, 80)}</small>` : ""}</td><td style="white-space:nowrap">${actionsHTML(c)}</td></tr>`;
}

/** שורת ה-KPI: נשלחו היום, בתור, סה"כ, ענו, מצב השליחה האוטומטית. */
async function renderKpi() {
  const sent = (await sb.rpc("outreach_sent_today")).data || 0;
  const counts = {}; ((await sb.from("outreach_contacts").select("status")).data || []).forEach((x) => counts[x.status] = (counts[x.status] || 0) + 1);
  $("o-kpi").innerHTML = `<div><span>נשלחו היום</span><b>${sent} / ${A.S.outreach_daily_limit}</b></div><div><span>מאושרים בתור</span><b>${counts.approved || 0}</b></div><div><span>נשלחו סה"כ</span><b>${(counts.sent || 0) + (counts.replied || 0) + (counts.opted_in || 0)}</b></div><div><span>ענו</span><b>${(counts.replied || 0) + (counts.opted_in || 0)}</b></div><div><span>שליחה אוטומטית</span><b>${A.S.outreach_enabled ? "פועלת" : "כבויה"}</b></div>`;
}

/** פעולה על איש קשר אחד. */
async function runAction(act, id) {
  const now = new Date().toISOString(), T = sb.from("outreach_contacts");
  if (act === "preview") {
    const p = await invoke("outreach-send", { preview: true, contact_id: id });
    if (p.error) return say($("o-msg"), p.error, false);
    return openDlg(p.subject, `<p class="help">אל: ${esc(p.to)}</p><iframe class="preview" sandbox="" srcdoc="${esc(p.html)}" title="תצוגה מקדימה"></iframe>`);
  }
  if (act === "delete") { if (!confirm("למחוק את איש הקשר?")) return; await T.delete().eq("id", id); }
  else if (act === "unapprove" || act === "retry") await T.update({ status: act === "retry" ? "approved" : "new", attempts: 0, last_error: null }).eq("id", id);
  else if (act === "opted_out") {
    const c = (await sb.from("outreach_contacts").select("email").eq("id", id).single()).data;
    await sb.from("suppression").upsert({ email: c.email, reason: "manual" });
    await sb.from("outreach_contacts").update({ status: "opted_out", opted_out_at: now }).eq("id", id);
  }
  else await sb.from("outreach_contacts").update({ status: act, replied_at: now }).eq("id", id);
  loadOutreach();
}

export async function loadOutreach() {
  await reloadS();
  await renderKpi();
  let qb = sb.from("outreach_contacts").select("*").order("created_at", { ascending: false }).limit(500);
  if ($("o-status").value) qb = qb.eq("status", $("o-status").value);
  if ($("o-seg").value) qb = qb.eq("segment", $("o-seg").value);
  const q = $("o-search").value.trim(); if (q) qb = qb.or(`company.ilike.%${q}%,email.ilike.%${q}%`);
  const rows = (await qb).data || [];
  $("outT").innerHTML = "<thead><tr><th><input type=checkbox id=o-all aria-label='בחירת הכל'></th><th>חברה</th><th>איש קשר</th><th>מייל</th><th>סגמנט</th><th>משפט אישי</th><th>סטטוס</th><th></th></tr></thead><tbody>" + rows.map(contactRow).join("") + "</tbody>";
  const all = $("o-all"); if (all) all.onchange = () => $$("[data-sel]", $("outT")).forEach((x) => x.checked = all.checked);
  $$("[data-edit]", $("outT")).forEach((el) => el.onchange = async () => { const r = await sb.from("outreach_contacts").update({ [el.dataset.edit]: el.value.trim() || null }).eq("id", el.dataset.id); say($("o-msg"), r.error ? r.error.message : "עודכן", !r.error); });
  $$("[data-act]", $("outT")).forEach((b) => b.onclick = () => runAction(b.dataset.act, Number(b.dataset.id)));
}

/** CSV פשוט עם תמיכה במרכאות. מחזיר שורות של תאים. */
export function parseCSV(t) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (ch === '"') q = false; else f += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { row.push(f); f = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && t[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; }
    else f += ch;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

/** ייבוא CSV: company, email חובה; contact_name, segment, personal_line, source_url רשות. כתובות קיימות לא משתנות. */
async function importCSV(e) {
  const file = e.target.files[0]; if (!file) return;
  const rows = parseCSV((await file.text()).replace(/^﻿/, "")), head = rows.shift().map((h) => h.trim().toLowerCase());
  const data = rows.map((r) => { const o = {}; head.forEach((h, i) => o[h] = (r[i] || "").trim()); return o; })
    .filter((o) => o.company && /\S+@\S+\.\S+/.test(o.email))
    .map((o) => ({ company: o.company, contact_name: o.contact_name || null, email: o.email.toLowerCase(), segment: SEG[o.segment] ? o.segment : "other", personal_line: o.personal_line || null, source_url: o.source_url || null }));
  const count = async () => (await sb.from("outreach_contacts").select("id", { count: "exact", head: true })).count || 0;
  const before = await count();
  const r = await sb.from("outreach_contacts").upsert(data, { onConflict: "email", ignoreDuplicates: true });
  const after = await count();
  say($("o-msg"), r.error ? r.error.message : `נוספו ${after - before} מתוך ${data.length} שורות תקינות. כתובות קיימות לא שונו.`, !r.error);
  e.target.value = ""; loadOutreach();
}

/** אישור המסומנים לשליחה (ה-RPC מדלג על כפילויות חברה ועל רשימת ההסרה). */
async function approveSelected() {
  const ids = $$("[data-sel]:checked", $("outT")).map((x) => Number(x.dataset.sel));
  if (!ids.length) return say($("o-msg"), "לא סומן אף איש קשר.", false);
  const r = await sb.rpc("approve_outreach", { p_ids: ids });
  if (r.error) return say($("o-msg"), r.error.message, false);
  const why = { duplicate_company: "כבר נשלח לחברה", suppressed: "ברשימת ההסרה", not_new: "לא במצב חדש" }, sk = r.data.skipped || [];
  say($("o-msg"), `${r.data.approved} אושרו.` + (sk.length ? " דולגו: " + sk.map((s) => `${s.company} (${why[s.reason] || s.reason})`).join(", ") : ""), true);
  loadOutreach();
}

async function sendNow() {
  if (!confirm("לשלוח עכשיו לכל המאושרים עד המכסה היומית?")) return;
  $("o-send").disabled = true; say($("o-msg"), "שולח...");
  const r = await invoke("outreach-send", {}); $("o-send").disabled = false;
  say($("o-msg"), r.error || (r.note || `נשלחו ${(r.results || []).filter((x) => x.ok).length}.`), !r.error); loadOutreach();
}

export function initOutreach() {
  $("o-status").innerHTML += options(OS);
  $("o-seg").innerHTML += options(SEG);
  $("o-status").onchange = $("o-seg").onchange = $("o-search").oninput = loadOutreach;
  $("o-file").onchange = importCSV;
  $("o-approve").onclick = approveSelected;
  $("o-preview").onclick = async () => { const r = await invoke("outreach-send", { dry_run: true }); say($("o-msg"), r.error || (r.results?.length ? "ישלחו ל: " + r.results.filter((x) => !x.skipped).map((x) => x.email).join(", ") : "אין מאושרים לשליחה"), !r.error); };
  $("o-send").onclick = sendNow;
}
