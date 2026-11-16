// יצירת קשר: קישורי וואטסאפ, כתובת ופרטי קשר מה-config, ושעון "הסדנה פתוחה עכשיו".
import { $, $$, track } from "./util.js";
import { C } from "./supabase.js";

/** קישור וואטסאפ עם הודעה מוכנה, או null אם אין מספר ב-config. */
export const waLink = (msg) => (C.WHATSAPP ? `https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent(msg || "")}` : null);

/** כל .js-wa מקבל את הקישור (ההודעה מ-data-msg) ונספר כאירוע contact_click. */
function initWhatsapp() {
  $$(".js-wa").forEach((a) => {
    const u = waLink(a.dataset.msg);
    if (u) { a.href = u; a.target = "_blank"; a.rel = "noopener"; }
    a.addEventListener("click", () => track("contact_click", { channel: "whatsapp" }));
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

/** סמלי הרשתות (קו לבן על כפתור פלדה, exit.css .social). */
const ICONS = {
  instagram: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1Z"/></svg>',
};

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
