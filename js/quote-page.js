// דף הצעת המחיר ללקוח (quote.html?t=...): טוען את ההצעה לפי הקוד, מציג, ומאפשר אישור. קובץ נפרד ולא בתוך הדף, בגלל מדיניות האבטחה (CSP).
// דף ההצעה ללקוח: טוען הצעה לפי טוקן (get_quote), מציג פירוט, הדמיה מהפרמטרים ששמרנו, ואישור בשם מלא.
import { $, ils, esc, heDate } from "./util.js?v=f82c330";
import { sb, rpc } from "./supabase.js?v=f82c330";
import { loadModel } from "./model-loader.js?v=f82c330";
const box = $("#q"), token = new URLSearchParams(location.search).get("t");

/** שורות הפריטים בטבלה. */
const rowsHTML = (items) => items.map((i) => `<tr><td>${esc(i.name)}${i.note ? "<br><small>" + esc(i.note) + "</small>" : ""}</td><td class="n">${esc(i.qty)} ${esc(i.unit)}</td><td class="n">${ils(i.unit_price)}</td><td class="n">${ils(i.line_total)}</td></tr>`).join("");

/** טופס האישור, או הודעת מצב אם ההצעה כבר אושרה / פגה. */
function acceptHTML(q) {
  if (q.status === "accepted") return `<div class="accept"><b>ההצעה אושרה על ידי ${esc(q.accepted_name)} ב-${heDate(q.accepted_at)}.</b></div>`;
  if (q.status === "expired") return `<div class="accept">תוקף ההצעה פג. פנו אלינו לעדכון.</div>`;
  return `<form class="accept" id="acc"><div class="field"><label for="an">שם מלא לאישור</label><input id="an" required autocomplete="name"></div><button class="btn primary" type="submit">אני מאשר/ת את ההצעה</button><span class="status" id="as" role="status"></span></form>`;
}

/** כל הדף. */
function quoteHTML(q, withModel) {
  const b = q.business || {}, vat = q.total - q.subtotal, valid = q.valid_until ? heDate(q.valid_until) : "";
  return `<header><div><img src="brand/logo-corten-400.png" srcset="brand/logo-corten-400.png 1x, brand/logo-corten-800.png 2x" alt="IRON BEN"><h1>הצעת מחיר</h1><div>${esc(q.title || "")}</div></div><div class="meta">${esc(b.name)}<br>${esc(b.address)}${b.phone ? "<br>" + esc(b.phone) : ""}${b.id ? "<br>ע.מ " + esc(b.id) : ""}<br>מספר ${esc(q.number)} · ${heDate(q.created_at)}</div></header>
    <p style="margin-top:20px">לכבוד ${esc(q.customer_name)}</p>
    ${withModel ? `<div class="render"><div><div class="model-tabs" role="tablist"><button type="button" class="on" data-mode="3d">הדמיה</button><button type="button" data-mode="plan">תוכנית</button></div><div class="model" id="m3d"></div></div><div style="display:grid;align-content:center;color:var(--muted);font-size:15px">הדמיה לפי המידות שנמדדו. הגימור, העץ והפרטים הסופיים לפי שרטוט הייצור שיאושר.</div></div>` : ""}
    <div class="tw"><table><thead><tr><th>פריט</th><th>כמות</th><th>מחיר ליחידה</th><th>סה"כ</th></tr></thead><tbody>${rowsHTML(q.items || [])}</tbody>
    <tfoot><tr><td colspan="3">סה"כ לפני מע"מ</td><td class="n">${ils(q.subtotal)}</td></tr><tr><td colspan="3">מע"מ ${esc(q.vat_pct)}%</td><td class="n">${ils(vat)}</td></tr><tr><td colspan="3">סה"כ לתשלום</td><td class="n">${ils(q.total)}</td></tr></tfoot></table></div>
    ${q.notes ? "<p style='margin-top:16px'>" + esc(q.notes) + "</p>" : ""}
    <ul class="terms">${valid ? "<li>ההצעה בתוקף עד " + valid + ".</li>" : ""}
    ${q.deposit_pct ? "<li>מקדמה של " + esc(q.deposit_pct) + "% באישור ההזמנה, לכיסוי חומרים. היתרה לפי שלבים.</li>" : ""}
    <li>המחיר מבוסס על מחיר הברזל ביום ההצעה. אם מחיר הברזל משתנה ביותר מ-${esc(q.reprice_threshold_pct)}% עד ההזמנה, רכיב הברזל יעודכן.</li>
    <li>המחיר הסופי לפי מידות שאושרו במדידה. שינויים אחרי אישור השרטוט מתומחרים בנפרד.</li>
    <li>מוצר שמיוצר לפי מידות הלקוח אינו ניתן לביטול אחרי תחילת הייצור.</li></ul>
    ${acceptHTML(q)}
    <p class="noprint" style="margin-top:20px"><button class="btn small" type="button" data-print>שמירה כ-PDF / הדפסה</button></p>`;
}

/** אישור ההצעה בשם מלא. */
function bindAccept() {
  const f = $("#acc"); if (!f) return;
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const n = $("#an").value.trim(), s = $("#as");
    if (!n) { s.textContent = "כתבו שם מלא."; return; }
    const x = await rpc("accept_quote", { p_token: token, p_name: n });
    if (x.data) { s.textContent = "תודה! ההצעה אושרה. ניצור קשר לתיאום."; s.className = "status ok"; f.querySelector("button").disabled = true; }
    else { s.textContent = "לא הצלחנו לאשר. ייתכן שתוקף ההצעה פג."; s.className = "status err"; }
  });
}

/** ההדמיה מהפרמטרים ששמרנו עם ההצעה. */
async function mountModel(item) {
  const M = await loadModel(); if (!M) { $(".render")?.remove(); return; }
  const m = await M.mount($("#m3d")), p = item.sketch_params;
  m.update(p.model, p, { finish: p.finish, wood: p.wood });
  document.querySelectorAll(".model-tabs button").forEach((bt) => bt.addEventListener("click", () => { document.querySelectorAll(".model-tabs button").forEach((x) => x.classList.toggle("on", x === bt)); m.setMode(bt.dataset.mode); }));
}

if (!token || !sb) box.innerHTML = "<p>הקישור להצעה לא תקין.</p>";
else {
  const { data: q, error } = await rpc("get_quote", { p_token: token });
  if (error || !q) box.innerHTML = "<p>ההצעה לא נמצאה. אפשר לפנות אלינו ונשלח שוב.</p>";
  else {
    const withModel = (q.items || []).find((i) => i.sketch_params && i.sketch_params.model);
    box.innerHTML = quoteHTML(q, withModel);
    bindAccept();
    if (withModel) mountModel(withModel);
  }
}
// כפתור ההדפסה (בלי onclick בתוך ה-HTML)
document.addEventListener("click", (e) => { if (e.target.closest("[data-print]")) window.print(); });
