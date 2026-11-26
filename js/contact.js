// יצירת קשר: קישורי וואטסאפ, כתובת ופרטי קשר מה-config, ושעון "הסדנה פתוחה עכשיו".
import { $, $$, track } from "./util.js?v=1db38d4";
import { C } from "./supabase.js?v=1db38d4";

/** קישור וואטסאפ עם הודעה מוכנה, או null אם אין מספר ב-config. */
export const waLink = (msg) => (C.WHATSAPP ? `https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent(msg || "")}` : null);

/** מאיזה כפתור לחצו (לבוט בטלגרם): הכפתור הצף, שולחן העבודה, לאדריכלים, או אחרי שליחת הצעה (done: הליד כבר הגיע) */
const waWhere = (a) => a.classList.contains("fab") ? "fab" : a.id === "doneWa" ? "done" : a.closest(".drawer") ? "drawer" : a.closest(".exit") ? "biz" : a.closest(".bench") ? "bench" : "other";

/** כל .js-wa מקבל את הקישור (ההודעה מ-data-msg) ונספר כאירוע contact_click. */
function initWhatsapp() {
  $$(".js-wa").forEach((a) => {
    const u = waLink(a.dataset.msg);
    if (u) { a.href = u; a.target = "_blank"; a.rel = "noopener"; }
    a.addEventListener("click", () => track("contact_click", { channel: "whatsapp", where: waWhere(a), product: $(".pick[aria-checked='true']")?.dataset.slug || null }));
  });
}

/** כתובת וקישורי קשר ביציאה לחצר. */
function initContactLinks() {
  const addr = $("#f-address"), list = $("#f-contact");
  if (addr) addr.textContent = C.ADDRESS || "";
  if (list) list.innerHTML = [
    C.PHONE_DISPLAY && `<a href="tel:${C.PHONE_DISPLAY.replace(/[^0-9+]/g, "")}">${C.PHONE_DISPLAY}</a>`,
    C.EMAIL && `<a href="mailto:${C.EMAIL}">${C.EMAIL}</a>`,
  ].filter(Boolean).join("") + `<span class="social">${[
    C.INSTAGRAM && `<a href="${C.INSTAGRAM}" target="_blank" rel="noopener" aria-label="אינסטגרם">${ICONS.instagram}</a>`,
    C.FACEBOOK && `<a href="${C.FACEBOOK}" target="_blank" rel="noopener" aria-label="פייסבוק">${ICONS.facebook}</a>`,
  ].filter(Boolean).join("")}</span>`;
}

/** סמלי הרשתות: דיסקית ברזל עם טבעת פליז וסמל פליז, כמו כפתור הוואטסאפ (site/brand/{ig,fb}-metal-*.png, tools/images/badge.py) */
const badge = (n) => `<img src="brand/${n}-metal-64.png" srcset="brand/${n}-metal-64.png 1x, brand/${n}-metal-128.png 2x, brand/${n}-metal-192.png 3x" width="48" height="48" alt="" loading="lazy">`;
const ICONS = { instagram: badge("ig"), facebook: badge("fb") };

/** שעות הסדנה: א'-ה' 8:00-17:00, ו' 8:00-13:00, לפי שעון ישראל. */
const HOURS = { open: 8 * 60, close: [17, 17, 17, 17, 17, 13, 0].map((h) => h * 60) }; // אינדקס 0 = ראשון

function nowInIsrael() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", hour12: false, weekday: "short", hour: "numeric", minute: "numeric" })
    .formatToParts(new Date()).reduce((o, p) => (o[p.type] = p.value, o), {});
  return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday), mins: (Number(parts.hour) % 24) * 60 + Number(parts.minute) };
}

/** משפט אחד: פתוחה עכשיו / נפתחת היום / מחר / ביום ראשון. */
export function openingLine() {
  const { day, mins } = nowInIsrael(), close = HOURS.close[day];
  if (close && mins >= HOURS.open && mins < close) return "הסדנה פתוחה עכשיו";
  if (close && mins < HOURS.open) return "נפתחת היום ב-8:00";
  if (day >= 5) return "נפתחת ביום ראשון ב-8:00";
  return "נפתחת מחר ב-8:00";
}

export function initContact() {
  initWhatsapp();
  initContactLinks();
  const clock = $("#clock");
  if (clock) clock.textContent = openingLine();
}
