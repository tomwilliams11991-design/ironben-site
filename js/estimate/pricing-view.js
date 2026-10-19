// טווח המחיר: קורא ל-estimate_quote בשרת (debounce 300ms) ומציג טווח עם ספירה, וקו דק של הפירוט.
// החישוב עצמו בשרת (supabase/migrations/001_schema.sql, estimate_quote); admin/pricing.js הוא התאום ל-JS.
import { $, ils, still, track } from "../util.js";
import { rpc, sb } from "../supabase.js";
import { state } from "./state.js";

const NAMES = { steel: "ברזל", wood: "עץ", finish: "גימור ופרזול", labor: "עבודה" };
const ORDER = ["steel", "wood", "finish", "labor"];
let timer = 0, seq = 0, lastRange = { low: 0, high: 0 }, lastTracked = null;

/** מבקש הערכה אחרי שהמשתמש הפסיק להזיז את הסליידר. */
export function requestEstimate() { clearTimeout(timer); timer = setTimeout(fetchEstimate, 300); }

async function fetchEstimate() {
  if (!state.product) return;
  const mine = ++seq;
  if (!sb) { $("#rangeNum").textContent = "ההערכה תופיע כשהאתר מחובר"; return; }
  const { data, error } = await rpc("estimate_quote", { p_product_slug: state.product.slug, p_inputs: state.inputs });
  if (mine !== seq) return; // הגיעה תשובה חדשה יותר בינתיים
  if (error || !data || data.disabled) { state.estimate = null; $("#rangeNum").textContent = "לא הצלחנו לחשב. נחזור אליכם עם הערכה."; $("#bars").innerHTML = ""; return; }
  state.estimate = data;
  renderEstimate();
  if (lastTracked !== state.product.slug) { lastTracked = state.product.slug; track("estimate_shown", { product: state.product.slug, low: data.low, high: data.high }); }
}

/** ספירה מהטווח הקודם לחדש ב-500ms (או מיד, כשמפחיתים תנועה). */
function countTo(el, from, to) {
  const text = (lo, hi) => `${ils(lo)} עד ${ils(hi)}`;
  if (still()) { el.textContent = text(to.low, to.high); return; }
  const t0 = performance.now(), d = 500;
  (function frame(t) {
    const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3);
    el.textContent = text(from.low + (to.low - from.low) * e, from.high + (to.high - from.high) * e);
    if (k < 1) requestAnimationFrame(frame);
  })(t0);
}

/** קו אחד דק עם מקטע לכל רכיב, ומקרא קטן. האחוזים הם רמז, לא העיקר. */
function mixHTML(breakdown) {
  const parts = Object.entries(breakdown).filter(([, v]) => v.pct > 0).sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]));
  return `<div class="mix" aria-hidden="true">${parts.map(([k, v]) => `<i class="${k}" style="--w:${v.pct}%"></i>`).join("")}</div>` +
    `<p class="mix-legend">${parts.map(([k, v]) => `<span>${NAMES[k]} ${v.pct}%</span>`).join("")}</p>`;
}

function renderEstimate() {
  const e = state.estimate, el = $("#rangeNum");
  countTo(el, lastRange, e);
  lastRange = { low: e.low, high: e.high };
  el.classList.add("live");
  $("#rangeVat").textContent = `לפני מע"מ · ${e.qty} ${e.unit}`;
  $("#bars").innerHTML = mixHTML(e.breakdown);
  $("#resultNote").textContent = (e.min_applied ? "זו עבודה קטנה, ולכן המחיר הוא המינימום לעבודה. " : "") + "המחיר הסופי נקבע אחרי מדידה בבית.";
}
