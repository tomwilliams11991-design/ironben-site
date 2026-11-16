// לידים: טבלה עם סינון וחיפוש, שינוי סטטוס והערות בשורה, תמונות והדמיות חתומות, כפתור "הצעה" וכפתור "PDF"
// (אותו דף שמגיע במייל, מהפונקציה lead-pdf).
import { $, $$, sb, C, esc, ils, heDate, heTime, say, waNumber, options, invoke, KIND, LSTATUS } from "./lib.js";
import { prefillFromLead } from "./builder.js";
import { go } from "./nav.js";

let LEADS = [];

/** שורת ליד אחת. */
function leadRow(L) {
  const dims = L.inputs ? Object.entries(L.inputs).filter(([k]) => !["finish", "wood"].includes(k)).map(([k, v]) => `${k}: ${v}`).join(" · ") : esc(L.dimensions);
  const est = L.estimate_low
    ? `<b class="n">${ils(L.estimate_low)} עד ${ils(L.estimate_high)}</b><small>${esc(L.qty)} ${esc(L.estimate?.unit || "")}${L.inputs?.finish ? " · " + esc(L.inputs.finish) : ""}${L.inputs?.wood ? " / " + esc(L.inputs.wood) : ""}</small>`
    : "<small>בלי הערכה</small>";
  return `<tr><td class="n">${heDate(L.created_at)}<small>${heTime(L.created_at).split(",")[1] || ""}</small></td>
    <td>${esc(L.name)}<small>${KIND[L.customer_kind] || ""}</small><a href="https://wa.me/${waNumber(L.phone)}" target="_blank" rel="noopener">${esc(L.phone)}</a>${L.email ? `<small>${esc(L.email)}</small>` : ""}</td>
    <td>${esc(L.city)}</td><td>${esc(L.product_type)}<small>${dims}</small>${L.message ? `<small>${esc(L.message)}</small>` : ""}</td>
    <td>${est}</td><td class="thumbs" data-id="${L.id}"></td>
    <td><select data-lead="${L.id}">${options(LSTATUS, L.status)}</select></td>
    <td><input class="wide" data-note="${L.id}" value="${esc(L.notes)}" placeholder="הערה"></td>
    <td><button class="btn small" data-q="${L.id}">הצעה</button> <button class="btn small" data-pdf="${L.id}">PDF</button></td></tr>`;
}

/** קישורים חתומים (שעה) להדמיות ולתמונות של ליד, לתוך התא שלו. */
async function fillThumbs(L) {
  const cell = $("leadsT").querySelector(`td.thumbs[data-id="${L.id}"]`); if (!cell) return;
  let html = "";
  const signed = async (bucket, paths) => (await sb.storage.from(bucket).createSignedUrls(paths, 3600)).data || [];
  if (L.render_paths?.length) (await signed(C.BUCKET_RENDERS || "ironben-renders", L.render_paths)).forEach((u) => { if (u.signedUrl) html += `<a href="${u.signedUrl}" target="_blank" rel="noopener"><img class="render" src="${u.signedUrl}" alt="הדמיה"></a>`; });
  if (L.photo_paths?.length) (await signed(C.BUCKET_PHOTOS || "ironben-lead-photos", L.photo_paths)).forEach((u) => { if (u.signedUrl) html += `<a href="${u.signedUrl}" target="_blank" rel="noopener"><img src="${u.signedUrl}" alt=""></a>`; });
  if (L.inspo_paths?.length) (await signed(C.BUCKET_PHOTOS || "ironben-lead-photos", L.inspo_paths)).forEach((u) => { if (u.signedUrl) html += `<a href="${u.signedUrl}" target="_blank" rel="noopener" title="תמונת השראה"><img class="inspo" src="${u.signedUrl}" alt="השראה"></a>`; });
  cell.innerHTML = html;
}

/** מצייר את הטבלה לפי הסינון והחיפוש, ומחבר את הפקדים בשורות. */
function renderLeads() {
  const f = $("leadFilter").value, q = $("leadSearch").value.trim();
  const list = LEADS.filter((L) => (!f || L.status === f) && (!q || [L.name, L.phone, L.city, L.email].join(" ").includes(q)));
  $("leadsT").innerHTML = "<thead><tr><th>תאריך</th><th>לקוח</th><th>עיר</th><th>מה צריך</th><th>הערכה</th><th>הדמיה / תמונות</th><th>סטטוס</th><th>הערות</th><th></th></tr></thead><tbody>" + list.map(leadRow).join("") + "</tbody>";
  $$("select[data-lead]", $("leadsT")).forEach((s) => s.onchange = async () => { const r = await sb.from("leads").update({ status: s.value }).eq("id", s.dataset.lead); say($("leadMsg"), r.error ? r.error.message : "עודכן", !r.error); });
  $$("input[data-note]", $("leadsT")).forEach((i) => i.onchange = async () => { await sb.from("leads").update({ notes: i.value.trim() || null }).eq("id", i.dataset.note); say($("leadMsg"), "ההערה נשמרה", true); });
  $$("button[data-q]", $("leadsT")).forEach((b) => b.onclick = () => { prefillFromLead(LEADS.find((x) => x.id === b.dataset.q)); go("builder"); });
  $$("button[data-pdf]", $("leadsT")).forEach((b) => b.onclick = () => downloadPdf(b));
  list.forEach(fillThumbs);
}

/** מוריד את ה-PDF של הליד (נבנה בשרת, lead-pdf). */
async function downloadPdf(b) {
  b.disabled = true; b.textContent = "...";
  const r = await invoke("lead-pdf", { lead_id: b.dataset.pdf });
  b.disabled = false; b.textContent = "PDF";
  if (!(r instanceof Blob)) { say($("leadMsg"), r.error || "ה-PDF לא נוצר", false); return; }
  const L = LEADS.find((x) => x.id === b.dataset.pdf), a = document.createElement("a");
  a.href = URL.createObjectURL(r); a.download = `ironben-lead-${(L?.name || "").replace(/\s+/g, "-")}.pdf`;
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export async function loadLeads() {
  LEADS = (await sb.from("leads").select("*").order("created_at", { ascending: false }).limit(300)).data || [];
  renderLeads();
}

export function initLeads() {
  $("leadFilter").innerHTML += options(LSTATUS);
  $("leadFilter").onchange = $("leadSearch").oninput = renderLeads;
}
