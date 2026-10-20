// מרכז מיילים, הסכמות: מייל הסכמה ניטרלי אחד לכל עסק, ושלב 2 רק למי שענה "כן" ואושר ידנית.
// כל הכללים נאכפים במסד (מיגרציה 005); המסך הזה רק מציג, מאשר ומפעיל. אין כאן שליחה עוקפת.
import { $, $$, sb, A, C, esc, heDate, heTime, say, options, reloadS, invoke, openDlg, SEG, OS } from "../lib.js";

/** מצבי ההסכמה (consent_status) בעברית, וצבע התגית. */
const CONSENT = { none: ["לא נשלח", ""], requested: ["נשלח, אין תשובה", "new"], pending_review: ["לבדיקה ידנית", "warn"], opted_in: ["הסכים", "ok"], other: ["ענה, לא הסכמה", ""], removed: ["הוסר", "bad"], bounced: ["חזר", "bad"] };
/** תוויות לסיבות החסימה שהמסד מחזיר. */
const REASON = {
  not_new: "כבר טופל", already_requested: "כבר נשלחה בקשה", suppressed: "ברשימת ההסרה", no_evidence: "אין צילום ראיה",
  email_not_on_page: "הכתובת לא נמצאה בעמוד (סמנו 'בדקתי ידנית')", personal_not_approved: "דומיין פרטי בלי אישור נפרד",
  duplicate_company: "כבר נשלח לחברה הזו", not_approved: "לא אושר", already_sent: "כבר נשלח", already_sent_log: "כבר נשלח (ביומן)",
  disabled: "השליחה כבויה (מצב ניסיון)", outside_window: "מחוץ לשעות (א'-ה' 09:00-17:00)", daily_limit: "המכסה היומית נוצלה",
  too_soon: "פחות מדקה מהמייל הקודם", not_opted_in: "לא ענה כן", stage2_not_approved: "שלב 2 לא אושר", nobody_ready: "אין מאושרים שמוכנים לשליחה",
};
const EVENT = {
  collected: "נאסף", screenshot: "צולם עמוד המקור", approved: "אושר לשליחה", personal_approved: "אושר דומיין פרטי",
  consent_request_sent: "נשלח מייל הסכמה", consent_request_failed: "שליחה נכשלה", replied_yes: "ענה כן", replied_remove: "ביקש הסרה",
  replied_other: "ענה (לא הסכמה)", reply_unmatched: "תשובה מכתובת לא מוכרת", unsubscribed_link: "הוסר בקישור", bounced: "המייל חזר",
  complained: "דווח כספאם", stage2_approved: "שלב 2 אושר", stage2_sent: "נשלח שלב 2", stage2_failed: "שלב 2 נכשל", send_released: "שוחרר לניסיון חוזר",
};

let ROWS = [];

// ---------- שורת המצב והמונים ----------

/** שורת המצב: האם יוצאים מיילים עכשיו, ולמה לא. */
function gatesHTML(g) {
  const on = (ok, yes, no) => `<span class="${ok ? "on" : "off"}">${ok ? yes : no}</span>`;
  return [
    `<b>שליחה:</b> ${on(g.enabled, "פועלת", "כבויה (מצב ניסיון)")}`,
    `<b>חלון:</b> ${on(g.window_ok, "בתוך השעות", "מחוץ לשעות")} <small>(${esc(g.now_il)})</small>`,
    `<b>היום:</b> ${g.sent_today} / ${g.limit}${g.first_sent_on ? "" : " <small>(שבוע חימום)</small>"}`,
    `<b>בדיקה אליך:</b> ${on(!!g.test_sent_at, "נשלחה " + heDate(g.test_sent_at), "עוד לא")}`,
    `<b>קליטת תשובות:</b> ${on(!!g.reply_to_email, esc(g.reply_to_email || ""), "לא הוגדרה")}`,
  ].join("");
}

/** המונים: נאספו, צולמו, אושרו, נשלחו, כן, הסר, לא ענו, חזרו. */
function kpiHTML(k) {
  const box = (label, n, sub = "") => `<div><span>${label}</span><b>${n ?? 0}</b>${sub ? `<span>${sub}</span>` : ""}</div>`;
  return box("נאספו", k.collected, `${k.personal} בדומיין פרטי`) + box("צולמו", k.screenshotted, `${k.email_on_page} נמצאו בעמוד`) +
    box("אושרו, ממתינים", k.approved) + box("נשלחו", k.sent) + box("ענו כן", k.yes, k.stage2_sent ? `שלב 2: ${k.stage2_sent}` : "") +
    box("הסרה", k.remove) + box("לא ענו", k.no_answer) + box("לבדיקה", k.review) + box("חזרו", k.bounced);
}

async function renderHeader() {
  const { data: k } = await sb.rpc("consent_counters");
  if (!k) return;
  $("c-gates").innerHTML = gatesHTML(k.gates);
  $("c-kpi").innerHTML = kpiHTML(k);
}

// ---------- הטבלה ----------

/** התא של הראיה: קישור לצילום (נחתם בלחיצה) והאם הכתובת נמצאה בעמוד. */
function evidenceCell(c) {
  if (!c.evidence_path) return c.source_url ? '<span class="pill warn">בלי צילום</span>' : '<span class="pill bad">אין מקור</span>';
  const found = c.evidence_email_found ? '<span class="pill ok">נמצאה בעמוד</span>' : '<span class="pill warn">לא נמצאה</span>';
  return `${found}<small><a href="#" data-ev="${esc(c.evidence_path)}">צילום</a> · <a href="${esc(c.evidence_url || c.source_url)}" target="_blank" rel="noopener">מקור</a></small>`;
}

/** כפתורי הפעולה לפי המצב. */
function actionsHTML(c) {
  const b = (act, label, cls = "") => `<button class="btn small ${cls}" data-act="${act}" data-id="${c.id}">${label}</button>`;
  return [
    b("preview1", "שלב 1"), b("preview2", "שלב 2"), b("timeline", "יומן"),
    c.status === "approved" && c.consent_status === "none" ? b("unapprove", "ביטול אישור") : "",
    c.status === "failed" ? b("release", "שחרור לניסיון חוזר") : "",
    c.consent_status === "opted_in" && !c.stage2_approved_at ? b("stage2_approve", "אישור שלב 2") : "",
    c.consent_status === "opted_in" && c.stage2_approved_at && !c.stage2_sent_at ? b("stage2_send", "שליחת שלב 2", "primary") : "",
  ].join(" ");
}

function rowHTML(c) {
  const [cl, cp] = CONSENT[c.consent_status] || [c.consent_status, ""];
  const personal = c.email_type === "personal_free_domain"
    ? `<span class="pill ${c.personal_approved_at ? "ok" : "warn"}">${c.personal_approved_at ? "פרטי, אושר" : "דומיין פרטי"}</span>` : "";
  return `<tr><td>${c.status === "new" ? `<input type="checkbox" data-sel="${c.id}" aria-label="בחירה">` : ""}</td>
    <td>${esc(c.company)}<small>${esc(c.contact_name || c.first_name || "")}${c.city ? " · " + esc(c.city) : ""}</small></td>
    <td>${esc(c.email)}${personal ? "<br>" + personal : ""}</td>
    <td>${SEG[c.segment] || esc(c.segment)}</td>
    <td>${evidenceCell(c)}</td>
    <td><span class="pill">${OS[c.status] || c.status}</span><br><span class="pill ${cp}">${cl}</span>${c.sent_at ? `<small>נשלח ${heDate(c.sent_at)}</small>` : ""}${c.last_error ? `<small class="warn">${esc(c.last_error).slice(0, 80)}</small>` : ""}</td>
    <td>${c.last_reply_text ? `<div class="reply">${esc(c.last_reply_text).slice(0, 160)}</div>` : ""}</td>
    <td style="white-space:nowrap">${actionsHTML(c)}</td></tr>`;
}

/** הסינון בצד הלקוח (כל הרשימה נטענת פעם אחת). */
function filtered() {
  const cs = $("c-consent").value, st = $("c-status").value, sg = $("c-seg").value, ty = $("c-type").value, ev = $("c-evid").value;
  const q = $("c-search").value.trim().toLowerCase();
  return ROWS.filter((c) => (!cs || c.consent_status === cs) && (!st || c.status === st) && (!sg || c.segment === sg) && (!ty || c.email_type === ty)
    && (!ev || (ev === "none" ? !c.evidence_path : ev === "found" ? c.evidence_email_found : c.evidence_path && !c.evidence_email_found))
    && (!q || [c.company, c.email, c.city, c.contact_name].join(" ").toLowerCase().includes(q)));
}

function renderTable() {
  const list = filtered();
  $("c-count").textContent = `${list.length} מתוך ${ROWS.length}`;
  $("outT").innerHTML = "<thead><tr><th><input type=checkbox id=c-all aria-label='בחירת הכל'></th><th>עסק</th><th>מייל</th><th>תחום</th><th>ראיה</th><th>מצב</th><th>תשובה</th><th></th></tr></thead><tbody>" + list.map(rowHTML).join("") + "</tbody>";
  $("c-all").onchange = (e) => $$("[data-sel]", $("outT")).forEach((x) => { x.checked = e.target.checked; });
}

/** תור הבדיקה הידנית: התשובה המלאה ושלושה כפתורי החלטה. */
function renderReview() {
  const list = ROWS.filter((c) => c.consent_status === "pending_review");
  $("c-review-w").hidden = !list.length;
  $("c-review").innerHTML = "<thead><tr><th>עסק</th><th>תשובה</th><th>מתי</th><th>החלטה</th></tr></thead><tbody>" + list.map((c) =>
    `<tr><td>${esc(c.company)}<small>${esc(c.email)}</small></td><td><div class="reply">${esc(c.last_reply_text || "")}</div></td><td class="n">${heTime(c.last_reply_at)}</td>
     <td style="white-space:nowrap"><button class="btn small" data-decide="yes" data-id="${c.id}">הסכמה</button> <button class="btn small" data-decide="other" data-id="${c.id}">לא הסכמה</button> <button class="btn small danger" data-decide="remove" data-id="${c.id}">הסרה</button></td></tr>`).join("") + "</tbody>";
}

export async function loadConsent() {
  await reloadS();
  const [{ data }] = await Promise.all([sb.from("outreach_contacts").select("*").order("id").limit(5000), renderHeader()]);
  ROWS = data || [];
  renderTable();
  renderReview();
}

// ---------- פעולות ----------

/** ה-ids המסומנים בטבלה. */
const selected = () => $$("[data-sel]:checked", $("outT")).map((x) => Number(x.dataset.sel));

/** סיכום של אישור: כמה אושרו, ומה דולג ולמה. */
function summarize(r, verb) {
  const sk = r.skipped || [];
  const by = {}; sk.forEach((s) => { by[s.reason] = (by[s.reason] || 0) + 1; });
  return `${r.approved} ${verb}.` + (sk.length ? " דולגו: " + Object.entries(by).map(([k, n]) => `${n} ${REASON[k] || k}`).join(", ") : "");
}

async function approveSelected() {
  const ids = selected(); if (!ids.length) return say($("c-msg"), "לא סומן אף עסק.", false);
  const { data, error } = await sb.rpc("approve_outreach", { p_ids: ids, p_confirm_unverified: $("c-unverified").checked });
  if (error) return say($("c-msg"), error.message, false);
  say($("c-msg"), summarize(data, "אושרו לשליחה"), true); loadConsent();
}

async function approvePersonal() {
  const ids = selected(); if (!ids.length) return say($("c-msg"), "לא סומן אף עסק.", false);
  if (!confirm("לאשר כתובות בדומיין פרטי (gmail וכו')? זה מתאים רק לכתובת שמופיעה באתר העסק כפרטי הקשר שלו.")) return;
  const { data, error } = await sb.rpc("approve_personal", { p_ids: ids });
  if (error) return say($("c-msg"), error.message, false);
  say($("c-msg"), `${data.approved} כתובות פרטיות אושרו. עכשיו אפשר לאשר אותן לשליחה.`, true); loadConsent();
}

/** תצוגה מקדימה של שלב 1 או 2 בדיוק כפי שיישלח (טקסט + HTML). */
async function preview(id, stage) {
  const r = await invoke("outreach-send", { action: "preview", contact_id: id, stage });
  if (r.error) return say($("c-msg"), r.error, false);
  openDlg(r.subject, `<p class="help">אל: ${esc(r.to)}</p><pre>${esc(r.text)}</pre><iframe class="preview" sandbox="" srcdoc="${esc(r.html)}" title="תצוגה מקדימה"></iframe>`);
}

/** כל האירועים של כתובת, לפי הסדר (היומן לא ניתן לשינוי). */
async function timeline(id) {
  const c = ROWS.find((x) => x.id === id);
  const { data } = await sb.from("consent_events").select("*").eq("email", c.email).order("occurred_at");
  openDlg(`יומן: ${c.company}`, `<p class="help">${esc(c.email)}</p><ul class="timeline">` + (data || []).map((e) =>
    `<li><time>${heTime(e.occurred_at)}</time> · <b>${EVENT[e.event_type] || e.event_type}</b> <small>${esc(e.actor)}</small>${e.details?.text ? `<div class="reply">${esc(e.details.text)}</div>` : ""}${e.details?.subject ? `<small>${esc(e.details.subject)}</small>` : ""}${e.evidence_path ? ` <a href="#" data-ev="${esc(e.evidence_path)}">ראיה</a>` : ""}</li>`).join("") + "</ul>");
  $$("[data-ev]", $("dlg-body")).forEach((a) => a.onclick = openEvidence);
}

/** פותח קובץ ראיה מהבאקט הפרטי בקישור חתום לעשר דקות. */
async function openEvidence(e) {
  e.preventDefault();
  const { data } = await sb.storage.from("ironben-evidence").createSignedUrl(e.currentTarget.dataset.ev, 600);
  if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
}

async function runAction(act, id) {
  if (act === "preview1" || act === "preview2") return preview(id, act === "preview1" ? 1 : 2);
  if (act === "timeline") return timeline(id);
  let r;
  if (act === "unapprove") r = await sb.rpc("unapprove_outreach", { p_id: id });
  if (act === "release") r = await sb.rpc("release_failed_send", { p_contact_id: id, p_kind: "consent_request" });
  if (act === "stage2_approve") r = await sb.rpc("approve_stage2", { p_ids: [id] });
  if (act === "stage2_send") {
    if (!confirm("לשלוח עכשיו את המייל המלא (שלב 2) לכתובת הזו?")) return;
    const x = await invoke("outreach-send", { action: "stage2", contact_id: id });
    say($("c-msg"), x.ok ? "שלב 2 נשלח." : (REASON[x.reason] || x.error || x.reason), !!x.ok);
  }
  if (r?.error) say($("c-msg"), r.error.message, false);
  else if (r?.data?.ok === false) say($("c-msg"), REASON[r.data.reason] || r.data.reason, false);
  loadConsent();
}

async function decide(id, decision) {
  const labels = { yes: "לסמן הסכמה", other: "לסמן שזו לא הסכמה", remove: "להסיר את הכתובת לצמיתות" };
  if (!confirm(`${labels[decision]}?`)) return;
  const { data, error } = await sb.rpc("resolve_reply", { p_id: id, p_decision: decision, p_note: null });
  say($("c-msg"), error ? error.message : data.ok ? "נשמר ביומן." : REASON[data.reason] || data.reason, !error && data.ok);
  loadConsent();
}

/** מי הבאים בתור ולמה (בלי לשלוח). */
async function dryRun() {
  const r = await invoke("outreach-send", { action: "dry_run" });
  if (r.error) return say($("c-msg"), r.error, false);
  const rows = (r.candidates || []).map((c) => `<tr><td>${esc(c.company)}<small>${esc(c.email)}</small></td><td>${c.blockers.length ? c.blockers.map((b) => REASON[b] || b).join(", ") : '<span class="pill ok">מוכן</span>'}</td></tr>`).join("");
  openDlg("מי הבאים בתור", `<div class="gates">${gatesHTML(r.gates)}</div>${rows ? `<table>${rows}</table>` : '<p class="help">אין מאושרים בתור.</p>'}`);
}

/** שליחת בדיקה: שני הנוסחים לכתובת שלך, עם נתונים של ליד אמיתי (המסומן, או הראשון עם שורה אישית). */
async function sendTest() {
  const id = selected()[0];
  if (!confirm(`לשלוח אליך (${A.sess.user.email}) את שני הנוסחים, עם הנתונים של ${id ? "העסק המסומן" : "ליד לדוגמה מהרשימה"}? לא נשלח כלום לעסק עצמו.`)) return;
  const r = await invoke("outreach-send", { action: "test", contact_id: id || undefined });
  if (r.error) return say($("c-msg"), r.error, false);
  const bad = (r.results || []).filter((x) => !x.ok);
  say($("c-msg"), bad.length ? "הבדיקה נכשלה: " + bad.map((x) => x.error).join(" / ") : `נשלחו 2 מיילים ל-${r.to} (עם הנתונים של ${r.contact}).`, !bad.length);
  renderHeader();
}

async function sendNow() {
  if (!confirm("לשלוח עכשיו מייל הסכמה אחד לבא בתור? (רק אם השליחה פועלת, בתוך השעות ובמכסה)")) return;
  const r = await invoke("outreach-send", {});
  if (r.error) return say($("c-msg"), r.error, false);
  say($("c-msg"), r.ok && r.email ? `נשלח ל-${r.email}.` : REASON[r.skipped || r.reason] || r.error || JSON.stringify(r), !!r.email);
  loadConsent();
}

// ---------- ייבוא וייצוא ----------

/** CSV עם מרכאות. מחזיר אובייקטים לפי שורת הכותרת. */
export function parseCSV(text) {
  const rows = []; let row = [], f = "", q = false;
  const t = text.replace(/^﻿/, "");
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (ch === '"') q = false; else f += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { row.push(f); f = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && t[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; }
    else f += ch;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  const keys = head.map((h) => h.trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

/** ייבוא: upsert לפי email במנות של 100. סטטוס והסכמה של כתובות קיימות לא משתנים. */
async function importCSV(e) {
  const file = e.target.files[0]; if (!file) return;
  const rows = parseCSV(await file.text());
  let ins = 0, upd = 0, bad = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const { data, error } = await sb.rpc("import_contacts", { p_rows: rows.slice(i, i + 100) });
    if (error) { say($("c-msg"), error.message, false); return; }
    ins += data.inserted; upd += data.updated; bad += (data.invalid || []).length;
  }
  say($("c-msg"), `חדשים: ${ins} · עודכנו: ${upd}${bad ? ` · לא תקינים: ${bad}` : ""}. לכתובות החדשות צריך לצלם ראיה (node tools/outreach/capture.mjs).`, true);
  e.target.value = ""; loadConsent();
}

/** ייצוא כל ההסכמות עם קישורים חתומים (7 ימים) לצילומים ולתשובות. קובץ CSV שנפתח נכון באקסל (BOM). */
async function exportCSV() {
  const { data, error } = await sb.rpc("consent_export");
  if (error) return say($("c-msg"), error.message, false);
  const paths = [...new Set(data.flatMap((r) => [r.evidence_path, r.reply_evidence_path]).filter(Boolean))];
  const links = {};
  for (let i = 0; i < paths.length; i += 100) {
    const { data: s } = await sb.storage.from("ironben-evidence").createSignedUrls(paths.slice(i, i + 100), 7 * 24 * 3600);
    (s || []).forEach((x) => { links[x.path] = x.signedUrl; });
  }
  const cols = ["email", "company", "segment", "email_type", "source_url", "found_at", "evidence_url", "evidence_email_found", "request_sent_at", "provider_id", "consent_status", "consent_at", "reply_text", "approved_by", "evidence_link", "reply_evidence_link", "evidence_path", "reply_evidence_path"];
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [cols.join(",")].concat(data.map((r) => cols.map((k) => cell(k === "evidence_link" ? links[r.evidence_path] : k === "reply_evidence_link" ? links[r.reply_evidence_path] : r[k])).join(",")));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
  a.download = `ironben-consents-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  say($("c-msg"), `יוצאו ${data.length} שורות. הקישורים לראיות בתוקף 7 ימים; הנתיבים בבאקט נשמרים לתמיד.`, true);
}

export function initConsent() {
  $("c-consent").innerHTML += Object.entries(CONSENT).map(([k, [v]]) => `<option value="${k}">${v}</option>`).join("");
  $("c-status").innerHTML += options(OS);
  $("c-seg").innerHTML += options(SEG);
  ["c-consent", "c-status", "c-seg", "c-type", "c-evid"].forEach((id) => $(id).onchange = renderTable);
  $("c-search").oninput = renderTable;
  $("c-approve").onclick = approveSelected;
  $("c-personal").onclick = approvePersonal;
  $("c-dry").onclick = dryRun;
  $("c-test").onclick = sendTest;
  $("c-send").onclick = sendNow;
  $("c-file").onchange = importCSV;
  $("c-export").onclick = exportCSV;
  $("outT").addEventListener("click", (e) => {
    const ev = e.target.closest("[data-ev]"); if (ev) return openEvidence(e);
    const b = e.target.closest("[data-act]"); if (b) runAction(b.dataset.act, Number(b.dataset.id));
  });
  $("c-review").addEventListener("click", (e) => { const b = e.target.closest("[data-decide]"); if (b) decide(Number(b.dataset.id), b.dataset.decide); });
}
