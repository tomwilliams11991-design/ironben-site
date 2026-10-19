(async () => {
// IRON BEN: ממשק הניהול. לידים, בונה הצעות, הצעות, מוצרים, מחיר ברזל, מרכז מיילים, הגדרות.
const C = window.IRONBEN_CONFIG || {}, P = window.IronPricing;
const $ = (id) => document.getElementById(id);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ils = (n) => Math.round(Number(n) || 0).toLocaleString("he-IL") + " ₪";
const heDate = (d) => d ? new Date(d).toLocaleDateString("he-IL", { timeZone: "Asia/Jerusalem" }) : "";
const heTime = (d) => d ? new Date(d).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" }) : "";
const say = (el, t, ok) => { el.textContent = t || ""; el.className = "msg " + (ok === false ? "err" : ok ? "ok" : ""); };
const FN = (n) => (C.FUNCTIONS_PREFIX || "ironben-") + n;
const todayIL = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
const KIND = { private: "לקוח פרטי", architect: "אדריכל / מעצב", business: "חברה / עסק" };
const SEG = { architect: "אדריכלים", designer: "מעצבים", office: "משרדים", fitout: "קבלני גמר", hospitality: "אירוח", retail: "חנויות", other: "אחר" };
const LSTATUS = { new: "חדש", contacted: "דיברנו", measured: "נמדד", quoted: "הצעה נשלחה", won: "נסגר", lost: "לא נסגר" };
const QS = { draft: "טיוטה", sent: "נשלחה", viewed: "נצפתה", accepted: "אושרה", rejected: "נדחתה", expired: "פג תוקף" };
const OS = { new: "חדש", approved: "מאושר לשליחה", sent: "נשלח", failed: "נכשל", replied: "ענה", opted_in: "אישר עדכונים", opted_out: "הוסר", bounced: "חזר" };
const TKEYS = { outreach: "פנייה לחברות", quote: "הצעת מחיר ללקוח", lead_autoreply: "אישור קבלה ללקוח", lead_notify: "התראה על ליד", steel_alert: "התראת ברזל" };

if (!C.SUPABASE_URL || !C.SUPABASE_ANON_KEY) { document.body.innerHTML = '<p style="padding:40px">חסרים SUPABASE_URL ו-SUPABASE_ANON_KEY בקובץ config.js.</p>'; return; }
const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, { db: { schema: C.SCHEMA || "ironben" } });
const invoke = async (name, body) => {
  const r = await sb.functions.invoke(FN(name), { body: body || {} });
  if (r.error) { let msg = r.error.message; try { const j = await r.error.context?.json(); if (j?.error) msg = j.error; } catch {} return { error: msg }; }
  return r.data || {};
};

// ---------- כניסה ----------
const sess = (await sb.auth.getSession()).data.session;
if (!sess) {
  $("login").hidden = false;
  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const r = await sb.auth.signInWithOtp({ email: $("lemail").value.trim().toLowerCase(), options: { emailRedirectTo: location.href.split("#")[0], shouldCreateUser: true } });
    say($("lmsg"), r.error ? "שליחת הקישור נכשלה: " + r.error.message : "נשלח קישור כניסה למייל. פתחו אותו באותו דפדפן.", !r.error);
  });
  return;
}
let S = (await sb.from("settings").select("*").eq("id", 1).maybeSingle()).data;
if (!S) { document.body.innerHTML = `<p style="padding:40px">המייל ${esc(sess.user.email)} לא ברשימת המנהלים. מנהל קיים מוסיף אותו בהגדרות, או דרך SQL: insert into ironben.admins(email) values ('${esc(sess.user.email)}');</p>`; return; }
$("app").hidden = false; $("who").textContent = sess.user.email;
$("logout").onclick = async () => { await sb.auth.signOut(); location.reload(); };
const reloadS = async () => { S = (await sb.from("settings").select("*").eq("id", 1).single()).data; return S; };

// ---------- ניווט ----------
const loaders = { leads: loadLeads, builder: renderBuilder, quotes: loadQuotes, products: loadProducts, steel: loadSteel, mail: loadMail, settings: loadSettings };
$$(".side button[data-p]").forEach((b) => b.onclick = () => {
  $$(".side button[data-p]").forEach((x) => x.setAttribute("aria-selected", x === b));
  $$(".panel").forEach((x) => x.classList.toggle("on", x.id === "p-" + b.dataset.p));
  loaders[b.dataset.p]();
});
const go = (p) => document.querySelector(`.side button[data-p="${p}"]`).click();
const dlg = $("dlg");
function openDlg(title, html) { $("dlg-title").textContent = title; $("dlg-body").innerHTML = html; dlg.showModal(); }
$("dlg-close").onclick = () => dlg.close();
let PRODUCTS = [];
async function ensureProducts() { if (!PRODUCTS.length) PRODUCTS = (await sb.from("products").select("*").order("sort")).data || []; return PRODUCTS; }

// ---------- לידים ----------
let LEADS = [], currentLead = null;
$("leadFilter").innerHTML += Object.entries(LSTATUS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
$("leadFilter").onchange = $("leadSearch").oninput = () => renderLeads();
async function loadLeads() {
  const r = await sb.from("leads").select("*").order("created_at", { ascending: false }).limit(300);
  LEADS = r.data || []; renderLeads();
}
function renderLeads() {
  const f = $("leadFilter").value, q = $("leadSearch").value.trim();
  const list = LEADS.filter((L) => (!f || L.status === f) && (!q || [L.name, L.phone, L.city, L.email].join(" ").includes(q)));
  let h = "<thead><tr><th>תאריך</th><th>לקוח</th><th>עיר</th><th>מה צריך</th><th>הערכה</th><th>הדמיה / תמונות</th><th>סטטוס</th><th>הערות</th><th></th></tr></thead><tbody>";
  for (const L of list) {
    const wa = String(L.phone).replace(/\D/g, "").replace(/^0/, "972");
    const opts = Object.entries(LSTATUS).map(([k, v]) => `<option value="${k}"${k === L.status ? " selected" : ""}>${v}</option>`).join("");
    const dims = L.inputs ? Object.entries(L.inputs).filter(([k]) => !["finish", "wood"].includes(k)).map(([k, v]) => `${k}: ${v}`).join(" · ") : esc(L.dimensions);
    const est = L.estimate_low ? `<b class="n">${ils(L.estimate_low)} עד ${ils(L.estimate_high)}</b><small>${esc(L.qty)} ${esc(L.estimate?.unit || "")}${L.inputs?.finish ? " · " + esc(L.inputs.finish) : ""}${L.inputs?.wood ? " / " + esc(L.inputs.wood) : ""}</small>` : "<small>בלי הערכה</small>";
    h += `<tr><td class="n">${heDate(L.created_at)}<small>${heTime(L.created_at).split(",")[1] || ""}</small></td>
      <td>${esc(L.name)}<small>${KIND[L.customer_kind] || ""}</small><a href="https://wa.me/${wa}" target="_blank" rel="noopener">${esc(L.phone)}</a>${L.email ? `<small>${esc(L.email)}</small>` : ""}</td>
      <td>${esc(L.city)}</td><td>${esc(L.product_type)}<small>${dims}</small>${L.message ? `<small>${esc(L.message)}</small>` : ""}</td>
      <td>${est}</td><td class="thumbs" data-id="${L.id}"></td>
      <td><select data-lead="${L.id}">${opts}</select></td>
      <td><input class="wide" data-note="${L.id}" value="${esc(L.notes)}" placeholder="הערה"></td>
      <td><button class="btn small" data-q="${L.id}">הצעה</button></td></tr>`;
  }
  $("leadsT").innerHTML = h + "</tbody>";
  $$("select[data-lead]", $("leadsT")).forEach((s) => s.onchange = async () => { const r = await sb.from("leads").update({ status: s.value }).eq("id", s.dataset.lead); say($("leadMsg"), r.error ? r.error.message : "עודכן", !r.error); });
  $$("input[data-note]", $("leadsT")).forEach((i) => i.onchange = async () => { await sb.from("leads").update({ notes: i.value.trim() || null }).eq("id", i.dataset.note); say($("leadMsg"), "ההערה נשמרה", true); });
  $$("button[data-q]", $("leadsT")).forEach((b) => b.onclick = () => { currentLead = LEADS.find((x) => x.id === b.dataset.q); prefill(currentLead); go("builder"); });
  list.forEach(async (L) => {
    const cell = $("leadsT").querySelector(`td.thumbs[data-id="${L.id}"]`); if (!cell) return;
    let html = "";
    if (L.render_paths?.length) { const r = await sb.storage.from(C.BUCKET_RENDERS || "ironben-renders").createSignedUrls(L.render_paths, 3600); (r.data || []).forEach((u) => { if (u.signedUrl) html += `<a href="${u.signedUrl}" target="_blank" rel="noopener"><img class="render" src="${u.signedUrl}" alt="הדמיה"></a>`; }); }
    if (L.photo_paths?.length) { const r = await sb.storage.from(C.BUCKET_PHOTOS || "ironben-lead-photos").createSignedUrls(L.photo_paths, 3600); (r.data || []).forEach((u) => { if (u.signedUrl) html += `<a href="${u.signedUrl}" target="_blank" rel="noopener"><img src="${u.signedUrl}" alt=""></a>`; }); }
    cell.innerHTML = html;
  });
}

// ---------- בונה הצעה ----------
let LINES = [], currentQuoteId = null;
function prefill(L) {
  currentQuoteId = null;
  $("b-name").value = L.name || ""; $("b-email").value = L.email || ""; $("b-phone").value = L.phone || "";
  $("b-title").value = (L.product_type || "") + (L.city ? ", " + L.city : ""); $("b-notes").value = "";
  LINES = L.product_slug ? [{ slug: L.product_slug, qty: Number(L.qty) || 1, override: "", note: "", finish: L.inputs?.finish, wood: L.inputs?.wood, sketch_params: L.sketch_params }] : [];
  $("b-ctx").textContent = L.estimate_low ? `מהליד של ${L.name}: הערכה ראשונית ${ils(L.estimate_low)} עד ${ils(L.estimate_high)}.` : `מהליד של ${L.name}.`;
}
$("b-new").onclick = () => { currentLead = null; currentQuoteId = null; LINES = []; ["b-name", "b-email", "b-phone", "b-title", "b-notes"].forEach((id) => $(id).value = ""); $("b-ctx").textContent = ""; renderBuilder(); };
function factorsFor(ln, p) { const S_ = p.input_schema || {}; return { finish_factor: P.factor(S_.finishes, ln.finish), wood_factor: P.factor(S_.woods, ln.wood) }; }
async function renderBuilder() {
  await ensureProducts(); await reloadS();
  if (!PRODUCTS.length) { $("b-lines").querySelector("tbody").innerHTML = "<tr><td colspan='10'>אין מוצרים פעילים. הוסיפו בלשונית מוצרים.</td></tr>"; return; }
  if (!LINES.length) LINES.push({ slug: PRODUCTS[0].slug, qty: 1, override: "", note: "" });
  const body = $("b-lines").querySelector("tbody"); body.innerHTML = "";
  LINES.forEach((ln, i) => {
    const p = PRODUCTS.find((x) => x.slug === ln.slug) || PRODUCTS[0]; ln.slug = p.slug;
    const sch = p.input_schema || {};
    if (!ln.finish && sch.finishes?.length) ln.finish = sch.finishes[0].key;
    if (!ln.wood && sch.woods?.length) ln.wood = sch.woods[0].key;
    const c = P.priceLine(p, S, ln.qty || 0, ln.override, factorsFor(ln, p));
    ln.calc = c; ln.p = p;
    const opts = PRODUCTS.filter((x) => x.active).map((x) => `<option value="${x.slug}"${x.slug === p.slug ? " selected" : ""}>${esc(x.name)}</option>`).join("");
    const fin = (sch.finishes || []).length ? `<select data-f="finish">${sch.finishes.map((o) => `<option value="${o.key}"${o.key === ln.finish ? " selected" : ""}>${esc(o.label)}</option>`).join("")}</select>` : "";
    const wd = (sch.woods || []).length ? `<select data-f="wood" style="margin-top:4px">${sch.woods.map((o) => `<option value="${o.key}"${o.key === ln.wood ? " selected" : ""}>${esc(o.label)}</option>`).join("")}</select>` : "";
    const mk = c.market === "above" ? '<small class="warn">מעל טווח השוק</small>' : c.market === "below" ? '<small class="warn">מתחת לטווח השוק</small>' : "";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><select data-f="slug">${opts}</select><input data-f="note" class="wide" placeholder="הערה לשורה" value="${esc(ln.note)}" style="margin-top:4px"></td>
      <td><input data-f="qty" type="number" step="0.1" min="0" value="${ln.qty}"></td><td>${esc(p.unit)}${p.assumptions_verified ? "" : '<small class="warn">הנחות לא אומתו</small>'}</td>
      <td>${fin}${wd}</td><td class="n">${ils(c.unit_cost.total)}</td><td class="n">${ils(c.unit_price)}${mk}</td><td><input data-f="override" type="number" min="0" value="${esc(ln.override)}"></td>
      <td class="n">${ils(c.line_total)}${c.min_applied ? "<small>מחיר מינימום</small>" : ""}</td><td class="n">${ils(c.profit)}<small>${c.margin_pct.toFixed(0)}%</small></td><td><button class="btn small" data-del>הסר</button></td>`;
    $$("[data-f]", tr).forEach((el) => el.onchange = () => { const k = el.dataset.f; ln[k] = k === "qty" ? Number(el.value) : el.value; if (k === "slug") { ln.finish = ln.wood = undefined; ln.sketch_params = null; } renderBuilder(); });
    tr.querySelector("[data-del]").onclick = () => { LINES.splice(i, 1); renderBuilder(); };
    body.appendChild(tr);
  });
  const t = P.totals(LINES.map((l) => l.calc), S);
  $("b-kpi").innerHTML = `<div><span>לפני מע"מ</span><b>${ils(t.subtotal)}</b></div><div><span>כולל מע"מ</span><b>${ils(t.total)}</b></div><div><span>עלות</span><b>${ils(t.cost)}</b></div><div><span>רווח</span><b>${ils(t.profit)} (${t.margin_pct.toFixed(0)}%)</b></div><div><span>מקדמה ${S.deposit_pct}%</span><b>${ils(t.deposit)}</b></div>`;
  const kg = LINES.reduce((a, l) => a + l.calc.steel_kg, 0);
  $("b-steel").textContent = `ברזל: ${kg.toFixed(0)} ק"ג × ${LINES[0] ? LINES[0].calc.unit_cost.steel_kg_price.toFixed(2) : ""} ₪ לק"ג (כולל סטייה ${S.steel_safety_pct}%)` + (currentQuoteId ? " · עורך טיוטה קיימת" : "");
}
$("b-add").onclick = () => { LINES.push({ slug: PRODUCTS[0].slug, qty: 1, override: "", note: "" }); renderBuilder(); };
async function saveQuote(status) {
  if (!$("b-name").value.trim()) { say($("b-msg"), "חסר שם לקוח.", false); return null; }
  if (!LINES.length) { say($("b-msg"), "אין שורות בהצעה.", false); return null; }
  const t = P.totals(LINES.map((l) => l.calc), S);
  const valid = new Date(todayIL()); valid.setDate(valid.getDate() + Number(S.quote_valid_days));
  const row = {
    lead_id: currentLead ? currentLead.id : null,
    customer_name: $("b-name").value.trim(), customer_email: $("b-email").value.trim() || null, customer_phone: $("b-phone").value.trim() || null,
    title: $("b-title").value.trim() || null, notes: $("b-notes").value.trim() || null,
    items: LINES.map((l) => ({ product_slug: l.p.slug, name: l.p.name, unit: l.p.unit, qty: l.qty, note: l.note || null, finish: l.finish || null, wood: l.wood || null, unit_price: l.calc.unit_price, line_total: l.calc.line_total, unit_cost: Math.round(l.calc.unit_cost.total), steel_kg: l.calc.steel_kg, sketch_params: l.sketch_params || null })),
    steel_price_kg_used: LINES[0]?.calc.unit_cost.steel_kg_price ?? null, steel_safety_pct_used: S.steel_safety_pct,
    steel_kg_total: LINES.reduce((a, l) => a + l.calc.steel_kg, 0),
    cost_total: Math.round(t.cost), subtotal: Math.round(t.subtotal), vat_pct: S.vat_pct, total: Math.round(t.total),
    deposit_pct: S.deposit_pct, valid_until: valid.toISOString().slice(0, 10), status, updated_at: new Date().toISOString(),
  };
  const r = currentQuoteId ? await sb.from("quotes").update(row).eq("id", currentQuoteId).eq("status", "draft").select().single() : await sb.from("quotes").insert(row).select().single();
  if (r.error) { say($("b-msg"), "השמירה נכשלה: " + r.error.message, false); return null; }
  currentQuoteId = r.data.status === "draft" ? r.data.id : null;
  return r.data;
}
$("b-save").onclick = async () => { const q = await saveQuote("draft"); if (q) say($("b-msg"), `נשמר כטיוטה מספר ${q.number}. שמירה נוספת תעדכן אותה.`, true); };
$("b-send").onclick = async () => {
  const q = await saveQuote("draft"); if (!q) return;
  say($("b-msg"), "שולח...");
  const r = await invoke("send-quote", { quote_id: q.id });
  if (r.error) say($("b-msg"), "נשמר, אבל המייל לא נשלח: " + r.error, false); else { currentQuoteId = null; say($("b-msg"), "נשלח ללקוח: " + r.link, true); }
};
$("b-wa").onclick = async () => {
  const q = await saveQuote("sent"); if (!q) return;
  await sb.from("quotes").update({ sent_at: new Date().toISOString() }).eq("id", q.id);
  if (currentLead) await sb.from("leads").update({ status: "quoted" }).eq("id", currentLead.id).in("status", ["new", "contacted", "measured"]);
  currentQuoteId = null;
  const link = (S.site_url || location.origin) + "/quote.html?t=" + q.token;
  const ph = String($("b-phone").value).replace(/\D/g, "").replace(/^0/, "972");
  say($("b-msg"), "נשמר. הקישור: " + link, true);
  window.open(`https://wa.me/${ph}?text=${encodeURIComponent(`היי ${q.customer_name}, הנה הצעת המחיר מ-${S.business_name}: ${link}`)}`, "_blank");
};

// ---------- הצעות ----------
$("quoteFilter").innerHTML += Object.entries(QS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
$("quoteFilter").onchange = loadQuotes;
async function loadQuotes() {
  let qb = sb.from("quotes").select("*").order("created_at", { ascending: false }).limit(300);
  if ($("quoteFilter").value) qb = qb.eq("status", $("quoteFilter").value);
  const r = await qb;
  let h = "<thead><tr><th>#</th><th>תאריך</th><th>לקוח</th><th>כותרת</th><th>סה\"כ</th><th>רווח</th><th>סטטוס</th><th>בתוקף עד</th><th></th></tr></thead><tbody>";
  (r.data || []).forEach((q) => {
    const link = (S.site_url || location.origin) + "/quote.html?t=" + q.token;
    const pill = q.status === "accepted" ? "ok" : q.status === "expired" || q.status === "rejected" ? "bad" : q.status === "draft" ? "" : "new";
    h += `<tr><td class="n">${q.number}</td><td class="n">${heDate(q.created_at)}</td><td>${esc(q.customer_name)}<small>${esc(q.customer_email || q.customer_phone)}</small></td><td>${esc(q.title)}</td><td class="n">${ils(q.total)}</td><td class="n">${ils(q.subtotal - q.cost_total)}</td>
      <td><span class="pill ${pill}">${QS[q.status] || q.status}</span>${q.accepted_name ? `<small>${esc(q.accepted_name)} · ${heDate(q.accepted_at)}</small>` : ""}${q.viewed_at && !q.accepted_at ? `<small>נצפתה ${heDate(q.viewed_at)}</small>` : ""}</td><td class="n">${q.valid_until || ""}</td>
      <td><a href="${link}" target="_blank" rel="noopener">צפייה</a> · <button class="btn small" data-copy="${link}">העתקת קישור</button> ${q.status === "draft" ? `<button class="btn small" data-edit="${q.id}">עריכה</button>` : ""} ${!["accepted", "rejected"].includes(q.status) && q.customer_email ? `<button class="btn small" data-send="${q.id}">שליחה במייל</button>` : ""}</td></tr>`;
  });
  $("quotesT").innerHTML = h + "</tbody>";
  $$("[data-send]", $("quotesT")).forEach((b) => b.onclick = async () => { b.disabled = true; const x = await invoke("send-quote", { quote_id: b.dataset.send }); b.textContent = x.error ? "נכשל" : "נשלח"; say($("qMsg"), x.error || "נשלח", !x.error); });
  $$("[data-copy]", $("quotesT")).forEach((b) => b.onclick = () => { navigator.clipboard.writeText(b.dataset.copy); b.textContent = "הועתק"; });
  $$("[data-edit]", $("quotesT")).forEach((b) => b.onclick = async () => {
    const q = (r.data || []).find((x) => x.id === b.dataset.edit); if (!q) return;
    await ensureProducts();
    currentQuoteId = q.id; currentLead = q.lead_id ? { id: q.lead_id, name: q.customer_name } : null;
    $("b-name").value = q.customer_name; $("b-email").value = q.customer_email || ""; $("b-phone").value = q.customer_phone || ""; $("b-title").value = q.title || ""; $("b-notes").value = q.notes || "";
    LINES = (q.items || []).map((i) => ({ slug: i.product_slug, qty: i.qty, override: "", note: i.note || "", finish: i.finish, wood: i.wood, sketch_params: i.sketch_params }));
    $("b-ctx").textContent = `עריכת טיוטה מספר ${q.number}.`;
    go("builder");
  });
}

// ---------- מוצרים ----------
const PF = [["name", "שם"], ["unit", "יחידה"], ["kg_per_unit", 'ק"ג ליחידה'], ["hours_per_unit", "שעות ליחידה"], ["wood_per_unit", "עץ ₪"], ["finish_per_unit", "גימור ₪"], ["other_per_unit", "אחר ₪"], ["min_price", "מינימום ₪"], ["market_low", "שוק מ-"], ["market_high", "שוק עד"]];
async function loadProducts() {
  PRODUCTS = (await sb.from("products").select("*").order("sort")).data || []; await reloadS();
  let h = "<thead><tr>" + PF.map((f) => `<th>${f[1]}</th>`).join("") + "<th>מחיר ליחידה</th><th>מחיר שרת</th><th>אומת</th><th>פעיל</th><th>באתר</th></tr></thead><tbody>";
  PRODUCTS.forEach((p) => {
    const c = P.priceLine(p, S, 1, null);
    h += `<tr data-id="${p.id}" data-slug="${p.slug}">` + PF.map((f) => `<td><input data-f="${f[0]}" value="${esc(p[f[0]])}"${f[0] === "name" || f[0] === "unit" ? ' class="wide"' : ' type="number" step="any"'}></td>`).join("") +
      `<td class="n" title="${esc(p.market_source)}">${ils(c.unit_price)}</td><td class="n" data-parity></td><td><input type="checkbox" data-f="assumptions_verified"${p.assumptions_verified ? " checked" : ""}></td><td><input type="checkbox" data-f="active"${p.active ? " checked" : ""}></td><td><input type="checkbox" data-f="visible"${p.visible ? " checked" : ""}></td></tr>`;
  });
  $("prodT").innerHTML = h + "</tbody>";
  $("schemaPick").innerHTML = PRODUCTS.map((p) => `<option value="${p.slug}">${esc(p.name)}</option>`).join("");
  showSchema();
}
function showSchema() { const p = PRODUCTS.find((x) => x.slug === $("schemaPick").value); $("schemaEd").value = p ? JSON.stringify(p.input_schema, null, 2) : ""; }
$("schemaPick").onchange = showSchema;
$("schemaSave").onclick = async () => {
  let js; try { js = JSON.parse($("schemaEd").value); } catch (e) { say($("schemaMsg"), "JSON לא תקין: " + e.message, false); return; }
  const r = await sb.from("products").update({ input_schema: js }).eq("slug", $("schemaPick").value);
  say($("schemaMsg"), r.error ? r.error.message : "נשמר.", !r.error); if (!r.error) { PRODUCTS = []; loadProducts(); }
};
$("prodSave").onclick = async () => {
  const num = ["kg_per_unit", "hours_per_unit", "wood_per_unit", "finish_per_unit", "other_per_unit", "min_price"];
  for (const tr of $$("tbody tr", $("prodT"))) {
    const o = {};
    $$("[data-f]", tr).forEach((el) => { const k = el.dataset.f; o[k] = el.type === "checkbox" ? el.checked : el.type === "number" ? (el.value === "" ? (num.includes(k) ? 0 : null) : Number(el.value)) : el.value.trim(); });
    if (!o.name || !o.unit) { say($("prodMsg"), "שם ויחידה הם חובה.", false); return; }
    const r = await sb.from("products").update(o).eq("id", Number(tr.dataset.id)); if (r.error) { say($("prodMsg"), r.error.message, false); return; }
  }
  say($("prodMsg"), "נשמר.", true); PRODUCTS = []; loadProducts();
};
$("prodParity").onclick = async () => {
  for (const tr of $$("tbody tr", $("prodT"))) {
    const p = PRODUCTS.find((x) => x.slug === tr.dataset.slug), cell = tr.querySelector("[data-parity]");
    const inputs = {}; (p.input_schema?.fields || []).forEach((f) => inputs[f.key] = f.default);
    inputs.finish = p.input_schema?.finishes?.[0]?.key; inputs.wood = p.input_schema?.woods?.[0]?.key;
    const r = await sb.rpc("estimate_quote", { p_product_slug: p.slug, p_inputs: inputs });
    if (r.error || !r.data?.mid) { cell.innerHTML = `<small class="warn">${esc(r.error?.message || "לא מוצג באתר")}</small>`; continue; }
    const q = P.qtyFromInputs(p.input_schema, inputs);
    const js = P.priceLine(p, S, q.qty, null, factorsFor({ finish: inputs.finish, wood: inputs.wood }, p));
    const same = Math.abs(js.line_total - r.data.mid) <= 100;
    cell.innerHTML = `${ils(r.data.low)} עד ${ils(r.data.high)}<small>${q.qty} ${esc(p.unit)} · ${same ? "תואם לניהול" : '<span class="warn">לא תואם: ' + ils(js.line_total) + "</span>"}</small>`;
  }
};

// ---------- ברזל ----------
async function loadSteel() {
  await reloadS();
  const cur = S.steel_current_price_kg || S.steel_base_price_kg;
  const ch = S.steel_base_index && S.steel_current_index ? ((S.steel_current_index / S.steel_base_index - 1) * 100).toFixed(1) + "%" : "עוד לא נמשך";
  const last = (await sb.from("steel_index_log").select("period,created_at").eq("source", "cbs").order("period", { ascending: false }).limit(1).maybeSingle()).data;
  $("steelKpi").innerHTML = `<div><span>מחיר לק"ג עכשיו</span><b>${Number(cur).toFixed(2)} ₪</b></div><div><span>בהצעות (כולל סטייה ${S.steel_safety_pct}%)</span><b>${(cur * (1 + S.steel_safety_pct / 100)).toFixed(2)} ₪</b></div><div><span>שינוי מאז הבסיס</span><b>${ch}</b></div><div><span>מדד אחרון</span><b>${last ? last.period.slice(0, 7) : "אין"}</b></div>`;
  $("s-base").value = S.steel_base_price_kg; $("s-date").value = S.steel_base_date; $("s-safety").value = S.steel_safety_pct; $("s-thr").value = S.reprice_threshold_pct; $("s-series").value = S.cbs_series_id || "";
  const r = await sb.from("steel_index_log").select("*").order("period", { ascending: false }).limit(36);
  $("steelT").innerHTML = `<thead><tr><th>חודש</th><th>מקור</th><th>ערך</th><th>שינוי</th><th>מחיר לק"ג</th><th>דולר</th></tr></thead><tbody>` + (r.data || []).map((x) => `<tr><td class="n">${x.period}</td><td>${esc(x.source)}</td><td class="n">${x.value}</td><td class="n">${x.change_pct == null ? "" : x.change_pct + "%"}</td><td class="n">${x.price_kg || ""}</td><td class="n">${x.usd_ils || ""}</td></tr>`).join("") + "</tbody>";
}
$("s-save").onclick = async () => {
  const r = await sb.from("settings").update({ steel_base_price_kg: Number($("s-base").value), steel_base_date: $("s-date").value, steel_safety_pct: Number($("s-safety").value), reprice_threshold_pct: Number($("s-thr").value), cbs_series_id: $("s-series").value.trim() || null, steel_base_index: null, updated_at: new Date().toISOString() }).eq("id", 1);
  say($("s-msg"), r.error ? r.error.message : 'נשמר. לחצו "עדכון עכשיו" כדי לחשב מחדש.', !r.error); loadSteel();
};
$("s-run").onclick = async () => { say($("s-msg"), 'מושך מהלמ"ס...'); const r = await invoke("update-steel-index", {}); $("s-out").hidden = false; $("s-out").textContent = JSON.stringify(r, null, 2); say($("s-msg"), r.error || "עודכן", !r.error); loadSteel(); };
$("s-disc").onclick = async () => { say($("s-msg"), "מחפש..."); const r = await invoke("update-steel-index", { discover: true }); $("s-out").hidden = false; $("s-out").textContent = JSON.stringify(r, null, 2); say($("s-msg"), r.error || 'חפשו בתוצאה סדרה בשם "ברזל לבנייה" והעתיקו את הקוד שלה.', !r.error); };

// ---------- מרכז מיילים ----------
const mailLoaders = { queue: loadOutreach, templates: loadTemplates, log: loadLog, supp: loadSupp, sending: loadSending };
$$(".subtabs button").forEach((b) => b.onclick = () => {
  $$(".subtabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
  $$(".sub").forEach((x) => x.classList.toggle("on", x.id === "m-" + b.dataset.s));
  mailLoaders[b.dataset.s]();
});
function loadMail() { mailLoaders[$$(".subtabs button").find((b) => b.getAttribute("aria-selected") === "true").dataset.s](); }

// תור פניות
$("o-status").innerHTML += Object.entries(OS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
$("o-seg").innerHTML += Object.entries(SEG).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
$("o-status").onchange = $("o-seg").onchange = $("o-search").oninput = () => loadOutreach();
async function loadOutreach() {
  await reloadS();
  const sent = (await sb.rpc("outreach_sent_today")).data || 0;
  const counts = {}; ((await sb.from("outreach_contacts").select("status")).data || []).forEach((x) => counts[x.status] = (counts[x.status] || 0) + 1);
  $("o-kpi").innerHTML = `<div><span>נשלחו היום</span><b>${sent} / ${S.outreach_daily_limit}</b></div><div><span>מאושרים בתור</span><b>${counts.approved || 0}</b></div><div><span>נשלחו סה"כ</span><b>${(counts.sent || 0) + (counts.replied || 0) + (counts.opted_in || 0)}</b></div><div><span>ענו</span><b>${(counts.replied || 0) + (counts.opted_in || 0)}</b></div><div><span>שליחה אוטומטית</span><b>${S.outreach_enabled ? "פועלת" : "כבויה"}</b></div>`;
  let qb = sb.from("outreach_contacts").select("*").order("created_at", { ascending: false }).limit(500);
  if ($("o-status").value) qb = qb.eq("status", $("o-status").value);
  if ($("o-seg").value) qb = qb.eq("segment", $("o-seg").value);
  const q = $("o-search").value.trim(); if (q) qb = qb.or(`company.ilike.%${q}%,email.ilike.%${q}%`);
  const r = await qb;
  let h = "<thead><tr><th><input type=checkbox id=o-all aria-label='בחירת הכל'></th><th>חברה</th><th>איש קשר</th><th>מייל</th><th>סגמנט</th><th>משפט אישי</th><th>סטטוס</th><th></th></tr></thead><tbody>";
  (r.data || []).forEach((c) => {
    const pill = c.status === "new" ? "" : c.status === "approved" ? "new" : ["replied", "opted_in"].includes(c.status) ? "ok" : ["opted_out", "bounced", "failed"].includes(c.status) ? "bad" : "";
    const segOpts = Object.entries(SEG).map(([k, v]) => `<option value="${k}"${k === c.segment ? " selected" : ""}>${v}</option>`).join("");
    const acts = [
      `<button class="btn small" data-act="preview" data-id="${c.id}">תצוגה</button>`,
      c.status === "approved" ? `<button class="btn small" data-act="unapprove" data-id="${c.id}">ביטול אישור</button>` : "",
      ["sent", "failed"].includes(c.status) ? `<button class="btn small" data-act="replied" data-id="${c.id}">ענה</button><button class="btn small" data-act="opted_in" data-id="${c.id}">אישר עדכונים</button>` : "",
      c.status !== "opted_out" ? `<button class="btn small" data-act="opted_out" data-id="${c.id}">הסרה</button>` : "",
      c.status === "failed" ? `<button class="btn small" data-act="retry" data-id="${c.id}">נסה שוב</button>` : "",
      `<button class="btn small danger" data-act="delete" data-id="${c.id}">מחיקה</button>`,
    ].join(" ");
    h += `<tr><td>${c.status === "new" ? `<input type=checkbox data-sel="${c.id}">` : ""}</td><td>${esc(c.company)}${c.source_url ? `<small><a href="${esc(c.source_url)}" target="_blank" rel="noopener">מקור</a></small>` : ""}</td><td>${esc(c.contact_name)}</td><td>${esc(c.email)}</td>
      <td><select data-edit="segment" data-id="${c.id}">${segOpts}</select></td><td><input class="wide" data-edit="personal_line" data-id="${c.id}" value="${esc(c.personal_line)}" placeholder="איזה פרויקט שלהם ראית"></td>
      <td><span class="pill ${pill}">${OS[c.status] || c.status}</span>${c.sent_at ? `<small>נשלח ${heDate(c.sent_at)}</small>` : ""}${c.replied_at ? `<small>ענה ${heDate(c.replied_at)}</small>` : ""}${c.last_error ? `<small class="warn">${esc(c.last_error).slice(0, 80)}</small>` : ""}</td><td style="white-space:nowrap">${acts}</td></tr>`;
  });
  $("outT").innerHTML = h + "</tbody>";
  const all = $("o-all"); if (all) all.onchange = () => $$("[data-sel]", $("outT")).forEach((x) => x.checked = all.checked);
  $$("[data-edit]", $("outT")).forEach((el) => el.onchange = async () => { const r2 = await sb.from("outreach_contacts").update({ [el.dataset.edit]: el.value.trim() || null }).eq("id", el.dataset.id); say($("o-msg"), r2.error ? r2.error.message : "עודכן", !r2.error); });
  $$("[data-act]", $("outT")).forEach((b) => b.onclick = async () => {
    const id = Number(b.dataset.id), act = b.dataset.act, now = new Date().toISOString();
    if (act === "preview") { const p = await invoke("outreach-send", { preview: true, contact_id: id }); if (p.error) return say($("o-msg"), p.error, false); openDlg(p.subject, `<p class="help">אל: ${esc(p.to)}</p><iframe class="preview" sandbox="" srcdoc="${esc(p.html)}" title="תצוגה מקדימה"></iframe>`); return; }
    if (act === "delete") { if (!confirm("למחוק את איש הקשר?")) return; await sb.from("outreach_contacts").delete().eq("id", id); }
    else if (act === "unapprove" || act === "retry") await sb.from("outreach_contacts").update({ status: act === "retry" ? "approved" : "new", attempts: 0, last_error: null }).eq("id", id);
    else if (act === "opted_out") { const c = (await sb.from("outreach_contacts").select("email").eq("id", id).single()).data; await sb.from("suppression").upsert({ email: c.email, reason: "manual" }); await sb.from("outreach_contacts").update({ status: "opted_out", opted_out_at: now }).eq("id", id); }
    else await sb.from("outreach_contacts").update({ status: act, replied_at: now }).eq("id", id);
    loadOutreach();
  });
}
function parseCSV(t) {
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
$("o-file").onchange = async (e) => {
  const file = e.target.files[0]; if (!file) return;
  const rows = parseCSV((await file.text()).replace(/^﻿/, "")), head = rows.shift().map((h) => h.trim().toLowerCase());
  const data = rows.map((r) => { const o = {}; head.forEach((h, i) => o[h] = (r[i] || "").trim()); return o; })
    .filter((o) => o.company && /\S+@\S+\.\S+/.test(o.email))
    .map((o) => ({ company: o.company, contact_name: o.contact_name || null, email: o.email.toLowerCase(), segment: SEG[o.segment] ? o.segment : "other", personal_line: o.personal_line || null, source_url: o.source_url || null }));
  const before = (await sb.from("outreach_contacts").select("id", { count: "exact", head: true })).count || 0;
  const r = await sb.from("outreach_contacts").upsert(data, { onConflict: "email", ignoreDuplicates: true });
  const after = (await sb.from("outreach_contacts").select("id", { count: "exact", head: true })).count || 0;
  say($("o-msg"), r.error ? r.error.message : `נוספו ${after - before} מתוך ${data.length} שורות תקינות. כתובות קיימות לא שונו.`, !r.error); e.target.value = ""; loadOutreach();
};
$("o-approve").onclick = async () => {
  const ids = $$("[data-sel]:checked", $("outT")).map((x) => Number(x.dataset.sel));
  if (!ids.length) return say($("o-msg"), "לא סומן אף איש קשר.", false);
  const r = await sb.rpc("approve_outreach", { p_ids: ids });
  if (r.error) return say($("o-msg"), r.error.message, false);
  const sk = r.data.skipped || [];
  const why = { duplicate_company: "כבר נשלח לחברה", suppressed: "ברשימת ההסרה", not_new: "לא במצב חדש" };
  say($("o-msg"), `${r.data.approved} אושרו.` + (sk.length ? " דולגו: " + sk.map((s) => `${s.company} (${why[s.reason] || s.reason})`).join(", ") : ""), true); loadOutreach();
};
$("o-preview").onclick = async () => { const r = await invoke("outreach-send", { dry_run: true }); say($("o-msg"), r.error || (r.results?.length ? "ישלחו ל: " + r.results.filter((x) => !x.skipped).map((x) => x.email).join(", ") : "אין מאושרים לשליחה"), !r.error); };
$("o-send").onclick = async () => {
  if (!confirm("לשלוח עכשיו לכל המאושרים עד המכסה היומית?")) return;
  $("o-send").disabled = true; say($("o-msg"), "שולח...");
  const r = await invoke("outreach-send", {}); $("o-send").disabled = false;
  say($("o-msg"), r.error || (r.note || `נשלחו ${(r.results || []).filter((x) => x.ok).length}.`), !r.error); loadOutreach();
};

// תבניות
let TPLS = [], curT = null;
async function loadTemplates() {
  TPLS = (await sb.from("email_templates").select("*").order("key").order("segment", { nullsFirst: true })).data || [];
  $("t-pick").innerHTML = TPLS.map((t) => `<option value="${t.id}">${TKEYS[t.key] || t.key}${t.segment ? ": " + (SEG[t.segment] || t.segment) : ""}</option>`).join("");
  showTemplate();
}
function showTemplate() {
  curT = TPLS.find((t) => String(t.id) === $("t-pick").value) || TPLS[0]; if (!curT) return;
  $("t-name").value = curT.name; $("t-subject").value = curT.subject; $("t-html").value = curT.html; $("t-enabled").checked = curT.enabled;
  $("t-frame").srcdoc = ""; $("t-psub").textContent = "";
}
$("t-pick").onchange = showTemplate;
$("t-save").onclick = async () => {
  const r = await sb.from("email_templates").update({ name: $("t-name").value.trim(), subject: $("t-subject").value, html: $("t-html").value, enabled: $("t-enabled").checked, updated_at: new Date().toISOString(), updated_by: sess.user.email }).eq("id", curT.id);
  say($("t-msg"), r.error ? r.error.message : "נשמר.", !r.error); if (!r.error) { const id = curT.id; await loadTemplates(); $("t-pick").value = id; showTemplate(); }
};
async function previewT(test_to) {
  const r = await invoke("email-preview", { key: curT.key, segment: curT.segment, subject: $("t-subject").value, html: $("t-html").value, test_to });
  if (r.error) return say($("t-msg"), r.error, false);
  $("t-psub").textContent = "נושא: " + r.subject; $("t-frame").srcdoc = r.html;
  say($("t-msg"), test_to ? "נשלחה בדיקה ל-" + test_to : "תצוגה עם נתוני דוגמה", true);
}
$("t-preview").onclick = () => previewT();
$("t-test").onclick = () => previewT(sess.user.email);

// לוג
$("l-kind").onchange = $("l-status").onchange = $("l-refresh").onclick = () => loadLog();
$("l-search").oninput = () => loadLog();
async function loadLog() {
  let qb = sb.from("email_log").select("*").order("created_at", { ascending: false }).limit(300);
  if ($("l-kind").value) qb = qb.eq("kind", $("l-kind").value);
  if ($("l-status").value) qb = qb.eq("status", $("l-status").value);
  const q = $("l-search").value.trim(); if (q) qb = qb.ilike("to_email", `%${q}%`);
  const r = await qb;
  const K = { outreach: "פנייה", quote: "הצעה", lead_notify: "התראת ליד", lead_autoreply: "אישור ללקוח", steel_alert: "ברזל", test: "בדיקה" };
  const ST = { sent: ["נשלח", "new"], delivered: ["נמסר", "ok"], failed: ["נכשל", "bad"], bounced: ["חזר", "bad"], complained: ["ספאם", "bad"] };
  $("logT").innerHTML = "<thead><tr><th>מתי</th><th>סוג</th><th>אל</th><th>נושא</th><th>מצב</th><th>שגיאה</th></tr></thead><tbody>" + (r.data || []).map((x) => `<tr><td class="n">${heTime(x.created_at)}</td><td>${K[x.kind] || esc(x.kind)}${x.segment ? `<small>${SEG[x.segment] || x.segment}</small>` : ""}</td><td>${esc(x.to_email)}</td><td>${esc(x.subject)}</td><td><span class="pill ${ST[x.status]?.[1] || ""}">${ST[x.status]?.[0] || esc(x.status)}</span></td><td><small>${esc(x.error)}</small></td></tr>`).join("") + "</tbody>";
}

// רשימת הסרה
async function loadSupp() {
  const r = await sb.from("suppression").select("*").order("created_at", { ascending: false }).limit(500);
  const R = { unsubscribe: "לחץ הסרה", bounced: "חזר", complained: "דווח כספאם", manual: "ידני" };
  $("suppT").innerHTML = "<thead><tr><th>כתובת</th><th>סיבה</th><th>מתי</th><th></th></tr></thead><tbody>" + (r.data || []).map((x) => `<tr><td>${esc(x.email)}</td><td>${R[x.reason] || esc(x.reason)}</td><td class="n">${heDate(x.created_at)}</td><td><button class="btn small" data-rm="${esc(x.email)}">הסרה מהרשימה</button></td></tr>`).join("") + "</tbody>";
  $$("[data-rm]", $("suppT")).forEach((b) => b.onclick = async () => { if (!confirm("להחזיר את הכתובת לרשימה שמותר לשלוח אליה?")) return; await sb.from("suppression").delete().eq("email", b.dataset.rm); loadSupp(); });
}
$("sp-add").onclick = async () => {
  const e = $("sp-email").value.trim().toLowerCase(); if (!/\S+@\S+\.\S+/.test(e)) return say($("sp-msg"), "כתובת לא תקינה", false);
  const r = await sb.from("suppression").upsert({ email: e, reason: $("sp-reason").value.trim() || "manual" });
  await sb.from("outreach_contacts").update({ status: "opted_out", opted_out_at: new Date().toISOString() }).eq("email", e);
  say($("sp-msg"), r.error ? r.error.message : "נוסף.", !r.error); $("sp-email").value = ""; loadSupp();
};

// שליחה וחיבור
async function loadSending() {
  await reloadS();
  $("snd-enabled").value = String(!!S.outreach_enabled); $("snd-limit").value = S.outreach_daily_limit;
  const st = (await sb.rpc("secrets_status")).data || {};
  ["resend_api_key", "mail_from", "resend_webhook_secret", "metals_api_key"].forEach((k) => { $("st-" + k).innerHTML = st[k] ? '<span class="pill ok">מוגדר</span>' : '<span class="pill warn">חסר</span>'; $("sec-" + k).value = ""; });
  $("sec-urls").innerHTML = `כתובת ה-Webhook ל-Resend (אירועי bounce/complaint): <code>${C.SUPABASE_URL}/functions/v1/${FN("resend-webhook")}</code>`;
}
$("snd-save").onclick = async () => {
  const r = await sb.from("settings").update({ outreach_enabled: $("snd-enabled").value === "true", outreach_daily_limit: Math.max(1, Math.min(50, Number($("snd-limit").value) || 20)), updated_at: new Date().toISOString() }).eq("id", 1);
  say($("snd-msg"), r.error ? r.error.message : "נשמר.", !r.error);
};
$("sec-save").onclick = async () => {
  let n = 0;
  for (const k of ["resend_api_key", "mail_from", "resend_webhook_secret", "metals_api_key"]) {
    const v = $("sec-" + k).value.trim(); if (!v) continue;
    const r = await sb.rpc("set_secret", { p_name: k, p_value: v }); if (r.error) return say($("sec-msg"), r.error.message, false); n++;
  }
  say($("sec-msg"), n ? `נשמרו ${n} מפתחות.` : "לא הוזן כלום.", !!n); loadSending();
};

// ---------- הגדרות ----------
const SF = [["labor_rate", "עלות שעת עבודה ₪", "number"], ["target_margin_pct", "יעד רווח %", "number"], ["vat_pct", 'מע"מ %', "number"], ["quote_valid_days", "תוקף הצעה (ימים)", "number"], ["deposit_pct", "מקדמה %", "number"],
  ["estimate_enabled", "הערכה ראשונית באתר", "bool"], ["estimate_spread_pct", "רוחב הטווח בהערכה (± %)", "number"],
  ["business_name", "שם העסק"], ["business_address", "כתובת"], ["business_phone", "טלפון"], ["business_email", "מייל העסק"], ["business_id", "ע.מ / ח.פ"], ["owner_notify_email", "מייל להתראות על לידים"], ["site_url", "כתובת האתר (https://...)"]];
async function loadSettings() {
  await reloadS();
  $("setForm").innerHTML = SF.map((f) => f[2] === "bool" ? `<label class="l">${f[1]}<select data-f="${f[0]}"><option value="true"${S[f[0]] ? " selected" : ""}>פועלת</option><option value="false"${!S[f[0]] ? " selected" : ""}>כבויה</option></select></label>` : `<label class="l">${f[1]}<input data-f="${f[0]}" type="${f[2] || "text"}" step="any" value="${esc(S[f[0]])}"></label>`).join("");
  const r = await sb.from("admins").select("*").order("created_at");
  $("admT").innerHTML = "<thead><tr><th>מייל</th><th>נוסף</th><th></th></tr></thead><tbody>" + (r.data || []).map((a) => `<tr><td>${esc(a.email)}</td><td class="n">${heDate(a.created_at)}</td><td>${a.email === sess.user.email ? "<small>זה אתה</small>" : `<button class="btn small danger" data-rm="${esc(a.email)}">הסרה</button>`}</td></tr>`).join("") + "</tbody>";
  $$("[data-rm]", $("admT")).forEach((b) => b.onclick = async () => { if (!confirm("להסיר את " + b.dataset.rm + "?")) return; await sb.from("admins").delete().eq("email", b.dataset.rm); loadSettings(); });
}
$("set-save").onclick = async () => {
  const o = { updated_at: new Date().toISOString() };
  $$("[data-f]", $("setForm")).forEach((el) => { const k = el.dataset.f; o[k] = el.tagName === "SELECT" ? el.value === "true" : el.type === "number" ? Number(el.value) : (el.value.trim() || null); });
  if (!o.business_name) o.business_name = "IRON BEN"; if (!o.business_address) o.business_address = "בית עובד";
  const r = await sb.from("settings").update(o).eq("id", 1);
  say($("set-msg"), r.error ? r.error.message : "נשמר.", !r.error);
};
$("adm-add").onclick = async () => {
  const e = $("adm-email").value.trim().toLowerCase(); if (!/\S+@\S+\.\S+/.test(e)) return say($("adm-msg"), "כתובת לא תקינה", false);
  const r = await sb.from("admins").insert({ email: e }); say($("adm-msg"), r.error ? r.error.message : "נוסף.", !r.error); $("adm-email").value = ""; loadSettings();
};

loadLeads();

})();
