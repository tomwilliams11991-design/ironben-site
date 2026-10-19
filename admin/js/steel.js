// מחיר הברזל: מחיר בסיס, סטייה, סף עדכון, סדרת הלמ"ס, ולוג המדדים. העדכון עצמו בפונקציה update-steel-index.
import { $, sb, A, esc, say, reloadS, invoke } from "./lib.js";

export async function loadSteel() {
  await reloadS();
  const S = A.S, cur = S.steel_current_price_kg || S.steel_base_price_kg;
  const change = S.steel_base_index && S.steel_current_index ? ((S.steel_current_index / S.steel_base_index - 1) * 100).toFixed(1) + "%" : "עוד לא נמשך";
  const last = (await sb.from("steel_index_log").select("period,created_at").eq("source", "cbs").order("period", { ascending: false }).limit(1).maybeSingle()).data;
  $("steelKpi").innerHTML = `<div><span>מחיר לק"ג עכשיו</span><b>${Number(cur).toFixed(2)} ₪</b></div><div><span>בהצעות (כולל סטייה ${S.steel_safety_pct}%)</span><b>${(cur * (1 + S.steel_safety_pct / 100)).toFixed(2)} ₪</b></div><div><span>שינוי מאז הבסיס</span><b>${change}</b></div><div><span>מדד אחרון</span><b>${last ? last.period.slice(0, 7) : "אין"}</b></div>`;
  $("s-base").value = S.steel_base_price_kg; $("s-date").value = S.steel_base_date; $("s-safety").value = S.steel_safety_pct; $("s-thr").value = S.reprice_threshold_pct; $("s-series").value = S.cbs_series_id || "";
  const log = (await sb.from("steel_index_log").select("*").order("period", { ascending: false }).limit(36)).data || [];
  $("steelT").innerHTML = `<thead><tr><th>חודש</th><th>מקור</th><th>ערך</th><th>שינוי</th><th>מחיר לק"ג</th><th>דולר</th></tr></thead><tbody>` +
    log.map((x) => `<tr><td class="n">${x.period}</td><td>${esc(x.source)}</td><td class="n">${x.value}</td><td class="n">${x.change_pct == null ? "" : x.change_pct + "%"}</td><td class="n">${x.price_kg || ""}</td><td class="n">${x.usd_ils || ""}</td></tr>`).join("") + "</tbody>";
}

async function saveSteel() {
  const r = await sb.from("settings").update({ steel_base_price_kg: Number($("s-base").value), steel_base_date: $("s-date").value, steel_safety_pct: Number($("s-safety").value), reprice_threshold_pct: Number($("s-thr").value), cbs_series_id: $("s-series").value.trim() || null, steel_base_index: null, updated_at: new Date().toISOString() }).eq("id", 1);
  say($("s-msg"), r.error ? r.error.message : 'נשמר. לחצו "עדכון עכשיו" כדי לחשב מחדש.', !r.error); loadSteel();
}

/** מריץ את הפונקציה (עדכון, או חיפוש סדרה) ומציג את התשובה הגולמית. */
async function runIndex(body, doneMsg) {
  say($("s-msg"), body.discover ? "מחפש..." : 'מושך מהלמ"ס...');
  const r = await invoke("update-steel-index", body);
  $("s-out").hidden = false; $("s-out").textContent = JSON.stringify(r, null, 2);
  say($("s-msg"), r.error || doneMsg, !r.error);
  if (!body.discover) loadSteel();
}

export function initSteel() {
  $("s-save").onclick = saveSteel;
  $("s-run").onclick = () => runIndex({}, "עודכן");
  $("s-disc").onclick = () => runIndex({ discover: true }, 'חפשו בתוצאה סדרה בשם "ברזל לבנייה" והעתיקו את הקוד שלה.');
}
