// מוצרים: טבלת הנחות התמחור (ק"ג, שעות, עץ, גימור...), עריכת input_schema של האתר, ובדיקת תאימות JS מול השרת.
import { $, $$, sb, A, P, esc, ils, say, reloadS, invalidateProducts } from "./lib.js";

/** [שדה, כותרת]. השדות המספריים מקבלים type=number. */
const FIELDS = [["name", "שם"], ["unit", "יחידה"], ["kg_per_unit", 'ק"ג ליחידה'], ["hours_per_unit", "שעות ליחידה"], ["wood_per_unit", "עץ ₪"], ["finish_per_unit", "גימור ₪"], ["other_per_unit", "אחר ₪"], ["min_price", "מינימום ₪"], ["market_low", "שוק מ-"], ["market_high", "שוק עד"]];
const NUMERIC = ["kg_per_unit", "hours_per_unit", "wood_per_unit", "finish_per_unit", "other_per_unit", "min_price"];
const TEXT = ["name", "unit"];

function productRow(p) {
  const c = P.priceLine(p, A.S, 1, null);
  const cells = FIELDS.map((f) => `<td><input data-f="${f[0]}" value="${esc(p[f[0]])}"${TEXT.includes(f[0]) ? ' class="wide"' : ' type="number" step="any"'}></td>`).join("");
  const check = (k) => `<td><input type="checkbox" data-f="${k}"${p[k] ? " checked" : ""}></td>`;
  return `<tr data-id="${p.id}" data-slug="${p.slug}">${cells}<td class="n" title="${esc(p.market_source)}">${ils(c.unit_price)}</td><td class="n" data-parity></td>${check("assumptions_verified")}${check("active")}${check("visible")}</tr>`;
}

export async function loadProducts() {
  A.PRODUCTS = (await sb.from("products").select("*").order("sort")).data || []; await reloadS();
  $("prodT").innerHTML = "<thead><tr>" + FIELDS.map((f) => `<th>${f[1]}</th>`).join("") + "<th>מחיר ליחידה</th><th>מחיר שרת</th><th>אומת</th><th>פעיל</th><th>באתר</th></tr></thead><tbody>" + A.PRODUCTS.map(productRow).join("") + "</tbody>";
  $("schemaPick").innerHTML = A.PRODUCTS.map((p) => `<option value="${p.slug}">${esc(p.name)}</option>`).join("");
  showSchema();
}

/** מציג את ה-JSON של המוצר שנבחר בעורך. */
function showSchema() {
  const p = A.PRODUCTS.find((x) => x.slug === $("schemaPick").value);
  $("schemaEd").value = p ? JSON.stringify(p.input_schema, null, 2) : "";
}

async function saveSchema() {
  let js; try { js = JSON.parse($("schemaEd").value); } catch (e) { say($("schemaMsg"), "JSON לא תקין: " + e.message, false); return; }
  const r = await sb.from("products").update({ input_schema: js }).eq("slug", $("schemaPick").value);
  say($("schemaMsg"), r.error ? r.error.message : "נשמר.", !r.error);
  if (!r.error) { invalidateProducts(); loadProducts(); }
}

/** ערך שדה מהטבלה לפי סוגו (צ'קבוקס / מספר / טקסט). */
const fieldValue = (el, k) => el.type === "checkbox" ? el.checked : el.type === "number" ? (el.value === "" ? (NUMERIC.includes(k) ? 0 : null) : Number(el.value)) : el.value.trim();

async function saveProducts() {
  for (const tr of $$("tbody tr", $("prodT"))) {
    const o = {};
    $$("[data-f]", tr).forEach((el) => { o[el.dataset.f] = fieldValue(el, el.dataset.f); });
    if (!o.name || !o.unit) { say($("prodMsg"), "שם ויחידה הם חובה.", false); return; }
    const r = await sb.from("products").update(o).eq("id", Number(tr.dataset.id));
    if (r.error) { say($("prodMsg"), r.error.message, false); return; }
  }
  say($("prodMsg"), "נשמר.", true); invalidateProducts(); loadProducts();
}

/** משווה לכל מוצר את המחיר ב-JS (ברירות המחדל של הסכמה) למחיר שהשרת מחזיר ל-estimate_quote. */
async function checkParity() {
  for (const tr of $$("tbody tr", $("prodT"))) {
    const p = A.PRODUCTS.find((x) => x.slug === tr.dataset.slug), cell = tr.querySelector("[data-parity]");
    const inputs = {}; (p.input_schema?.fields || []).forEach((f) => inputs[f.key] = f.default);
    inputs.finish = p.input_schema?.finishes?.[0]?.key; inputs.wood = p.input_schema?.woods?.[0]?.key;
    const r = await sb.rpc("estimate_quote", { p_product_slug: p.slug, p_inputs: inputs });
    if (r.error || !r.data?.mid) { cell.innerHTML = `<small class="warn">${esc(r.error?.message || "לא מוצג באתר")}</small>`; continue; }
    const q = P.qtyFromInputs(p.input_schema, inputs);
    const js = P.priceLine(p, A.S, q.qty, null, { finish_factor: P.factor(p.input_schema?.finishes, inputs.finish), wood_factor: P.factor(p.input_schema?.woods, inputs.wood) });
    const same = Math.abs(js.line_total - r.data.mid) <= 100;
    cell.innerHTML = `${ils(r.data.low)} עד ${ils(r.data.high)}<small>${q.qty} ${esc(p.unit)} · ${same ? "תואם לניהול" : '<span class="warn">לא תואם: ' + ils(js.line_total) + "</span>"}</small>`;
  }
}

export function initProducts() {
  $("schemaPick").onchange = showSchema;
  $("schemaSave").onclick = saveSchema;
  $("prodSave").onclick = saveProducts;
  $("prodParity").onclick = checkParity;
}
