// בונה הצעות: שורות (מוצר, כמות, גימור/עץ, מחיר ידני), KPI, שמירה כטיוטה / שליחה במייל / וואטסאפ.
// התמחור ב-JS (admin/pricing.js) זהה ל-estimate_quote בשרת; הסטייה בברזל ומע"מ מההגדרות (A.S).
import { $, $$, sb, A, P, esc, ils, say, todayIL, waNumber, reloadS, ensureProducts, invoke } from "./lib.js";

/** מצב הבונה: השורות, הליד שממנו הגענו, והטיוטה שעורכים (אם יש). */
const B = { LINES: [], currentLead: null, currentQuoteId: null };

/** מקדמי הגימור והעץ של שורה לפי סכמת המוצר. */
const factorsFor = (ln, p) => { const S_ = p.input_schema || {}; return { finish_factor: P.factor(S_.finishes, ln.finish), wood_factor: P.factor(S_.woods, ln.wood) }; };

/** ממלא את פרטי הלקוח מליד ופותח שורה ראשונה מהמוצר והמידות שלו. */
export function prefillFromLead(L) {
  B.currentLead = L; B.currentQuoteId = null;
  $("b-name").value = L.name || ""; $("b-email").value = L.email || ""; $("b-phone").value = L.phone || "";
  $("b-title").value = (L.product_type || "") + (L.city ? ", " + L.city : ""); $("b-notes").value = "";
  B.LINES = L.product_slug ? [{ slug: L.product_slug, qty: Number(L.qty) || 1, override: "", note: "", finish: L.inputs?.finish, wood: L.inputs?.wood, sketch_params: L.sketch_params }] : [];
  $("b-ctx").textContent = L.estimate_low ? `מהליד של ${L.name}: הערכה ראשונית ${ils(L.estimate_low)} עד ${ils(L.estimate_high)}.` : `מהליד של ${L.name}.`;
}

/** עריכת טיוטה קיימת (ממסך ההצעות). */
export async function editQuote(q) {
  await ensureProducts();
  B.currentQuoteId = q.id; B.currentLead = q.lead_id ? { id: q.lead_id, name: q.customer_name } : null;
  $("b-name").value = q.customer_name; $("b-email").value = q.customer_email || ""; $("b-phone").value = q.customer_phone || ""; $("b-title").value = q.title || ""; $("b-notes").value = q.notes || "";
  B.LINES = (q.items || []).map((i) => ({ slug: i.product_slug, qty: i.qty, override: "", note: i.note || "", finish: i.finish, wood: i.wood, sketch_params: i.sketch_params }));
  $("b-ctx").textContent = `עריכת טיוטה מספר ${q.number}.`;
}

/** הצעה חדשה וריקה. */
function newQuote() {
  B.currentLead = null; B.currentQuoteId = null; B.LINES = [];
  ["b-name", "b-email", "b-phone", "b-title", "b-notes"].forEach((id) => $(id).value = "");
  $("b-ctx").textContent = "";
  renderBuilder();
}

/** HTML של שורה אחת בטבלה, אחרי שחושבה. */
function lineRow(ln, p, c) {
  const sch = p.input_schema || {};
  const opts = A.PRODUCTS.filter((x) => x.active).map((x) => `<option value="${x.slug}"${x.slug === p.slug ? " selected" : ""}>${esc(x.name)}</option>`).join("");
  const sel = (key, list, cur, style = "") => (list || []).length ? `<select data-f="${key}"${style}>${list.map((o) => `<option value="${o.key}"${o.key === cur ? " selected" : ""}>${esc(o.label)}</option>`).join("")}</select>` : "";
  const mk = c.market === "above" ? '<small class="warn">מעל טווח השוק</small>' : c.market === "below" ? '<small class="warn">מתחת לטווח השוק</small>' : "";
  return `<td><select data-f="slug">${opts}</select><input data-f="note" class="wide" placeholder="הערה לשורה" value="${esc(ln.note)}" style="margin-top:4px"></td>
    <td><input data-f="qty" type="number" step="0.1" min="0" value="${ln.qty}"></td><td>${esc(p.unit)}${p.assumptions_verified ? "" : '<small class="warn">הנחות לא אומתו</small>'}</td>
    <td>${sel("finish", sch.finishes, ln.finish)}${sel("wood", sch.woods, ln.wood, ' style="margin-top:4px"')}</td><td class="n">${ils(c.unit_cost.total)}</td><td class="n">${ils(c.unit_price)}${mk}</td><td><input data-f="override" type="number" min="0" value="${esc(ln.override)}"></td>
    <td class="n">${ils(c.line_total)}${c.min_applied ? "<small>מחיר מינימום</small>" : ""}</td><td class="n">${ils(c.profit)}<small>${c.margin_pct.toFixed(0)}%</small></td><td><button class="btn small" data-del>הסר</button></td>`;
}

/** מחשב את כל השורות ומצייר את הטבלה, ה-KPI ושורת הברזל. */
export async function renderBuilder() {
  await ensureProducts(); await reloadS();
  const body = $("b-lines").querySelector("tbody"), S = A.S;
  if (!A.PRODUCTS.length) { body.innerHTML = "<tr><td colspan='10'>אין מוצרים פעילים. הוסיפו בלשונית מוצרים.</td></tr>"; return; }
  if (!B.LINES.length) B.LINES.push({ slug: A.PRODUCTS[0].slug, qty: 1, override: "", note: "" });
  body.innerHTML = "";
  B.LINES.forEach((ln, i) => {
    const p = A.PRODUCTS.find((x) => x.slug === ln.slug) || A.PRODUCTS[0]; ln.slug = p.slug;
    const sch = p.input_schema || {};
    if (!ln.finish && sch.finishes?.length) ln.finish = sch.finishes[0].key;
    if (!ln.wood && sch.woods?.length) ln.wood = sch.woods[0].key;
    const c = P.priceLine(p, S, ln.qty || 0, ln.override, factorsFor(ln, p));
    ln.calc = c; ln.p = p;
    const tr = document.createElement("tr"); tr.innerHTML = lineRow(ln, p, c);
    $$("[data-f]", tr).forEach((el) => el.onchange = () => {
      const k = el.dataset.f; ln[k] = k === "qty" ? Number(el.value) : el.value;
      if (k === "slug") { ln.finish = ln.wood = undefined; ln.sketch_params = null; }
      renderBuilder();
    });
    tr.querySelector("[data-del]").onclick = () => { B.LINES.splice(i, 1); renderBuilder(); };
    body.appendChild(tr);
  });
  const t = P.totals(B.LINES.map((l) => l.calc), S);
  $("b-kpi").innerHTML = `<div><span>לפני מע"מ</span><b>${ils(t.subtotal)}</b></div><div><span>כולל מע"מ</span><b>${ils(t.total)}</b></div><div><span>עלות</span><b>${ils(t.cost)}</b></div><div><span>רווח</span><b>${ils(t.profit)} (${t.margin_pct.toFixed(0)}%)</b></div><div><span>מקדמה ${S.deposit_pct}%</span><b>${ils(t.deposit)}</b></div>`;
  const kg = B.LINES.reduce((a, l) => a + l.calc.steel_kg, 0);
  $("b-steel").textContent = `ברזל: ${kg.toFixed(0)} ק"ג × ${B.LINES[0] ? B.LINES[0].calc.unit_cost.steel_kg_price.toFixed(2) : ""} ₪ לק"ג (כולל סטייה ${S.steel_safety_pct}%)` + (B.currentQuoteId ? " · עורך טיוטה קיימת" : "");
}

/** הרשומה לטבלת quotes מתוך השורות המחושבות. */
function quoteRow(status) {
  const S = A.S, t = P.totals(B.LINES.map((l) => l.calc), S);
  const valid = new Date(todayIL()); valid.setDate(valid.getDate() + Number(S.quote_valid_days));
  return {
    lead_id: B.currentLead ? B.currentLead.id : null,
    customer_name: $("b-name").value.trim(), customer_email: $("b-email").value.trim() || null, customer_phone: $("b-phone").value.trim() || null,
    title: $("b-title").value.trim() || null, notes: $("b-notes").value.trim() || null,
    items: B.LINES.map((l) => ({ product_slug: l.p.slug, name: l.p.name, unit: l.p.unit, qty: l.qty, note: l.note || null, finish: l.finish || null, wood: l.wood || null, unit_price: l.calc.unit_price, line_total: l.calc.line_total, unit_cost: Math.round(l.calc.unit_cost.total), steel_kg: l.calc.steel_kg, sketch_params: l.sketch_params || null })),
    steel_price_kg_used: B.LINES[0]?.calc.unit_cost.steel_kg_price ?? null, steel_safety_pct_used: S.steel_safety_pct,
    steel_kg_total: B.LINES.reduce((a, l) => a + l.calc.steel_kg, 0),
    cost_total: Math.round(t.cost), subtotal: Math.round(t.subtotal), vat_pct: S.vat_pct, total: Math.round(t.total),
    deposit_pct: S.deposit_pct, valid_until: valid.toISOString().slice(0, 10), status, updated_at: new Date().toISOString(),
  };
}

/** שומר: מעדכן טיוטה קיימת או יוצר הצעה חדשה. מחזיר את הרשומה או null. */
async function saveQuote(status) {
  if (!$("b-name").value.trim()) { say($("b-msg"), "חסר שם לקוח.", false); return null; }
  if (!B.LINES.length) { say($("b-msg"), "אין שורות בהצעה.", false); return null; }
  const row = quoteRow(status);
  const r = B.currentQuoteId
    ? await sb.from("quotes").update(row).eq("id", B.currentQuoteId).eq("status", "draft").select().single()
    : await sb.from("quotes").insert(row).select().single();
  if (r.error) { say($("b-msg"), "השמירה נכשלה: " + r.error.message, false); return null; }
  B.currentQuoteId = r.data.status === "draft" ? r.data.id : null;
  return r.data;
}

/** שליחה במייל דרך הפונקציה send-quote. */
async function sendByEmail() {
  const q = await saveQuote("draft"); if (!q) return;
  say($("b-msg"), "שולח...");
  const r = await invoke("send-quote", { quote_id: q.id });
  if (r.error) say($("b-msg"), "נשמר, אבל המייל לא נשלח: " + r.error, false);
  else { B.currentQuoteId = null; say($("b-msg"), "נשלח ללקוח: " + r.link, true); }
}

/** שליחה בוואטסאפ: מסמן כנשלחה, מעדכן את הליד, ופותח שיחה עם הקישור. */
async function sendByWhatsapp() {
  const q = await saveQuote("sent"); if (!q) return;
  await sb.from("quotes").update({ sent_at: new Date().toISOString() }).eq("id", q.id);
  if (B.currentLead) await sb.from("leads").update({ status: "quoted" }).eq("id", B.currentLead.id).in("status", ["new", "contacted", "measured"]);
  B.currentQuoteId = null;
  const link = (A.S.site_url || location.origin) + "/quote.html?t=" + q.token;
  say($("b-msg"), "נשמר. הקישור: " + link, true);
  window.open(`https://wa.me/${waNumber($("b-phone").value)}?text=${encodeURIComponent(`היי ${q.customer_name}, הנה הצעת המחיר מ-${A.S.business_name}: ${link}`)}`, "_blank");
}

export function initBuilder() {
  $("b-new").onclick = newQuote;
  $("b-add").onclick = () => { B.LINES.push({ slug: A.PRODUCTS[0].slug, qty: 1, override: "", note: "" }); renderBuilder(); };
  $("b-save").onclick = async () => { const q = await saveQuote("draft"); if (q) say($("b-msg"), `נשמר כטיוטה מספר ${q.number}. שמירה נוספת תעדכן אותה.`, true); };
  $("b-send").onclick = sendByEmail;
  $("b-wa").onclick = sendByWhatsapp;
}
