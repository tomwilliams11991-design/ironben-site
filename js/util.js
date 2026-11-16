// כלי עזר משותפים לכל העמודים הציבוריים (האתר, דף ההצעה, ההסרה).
// אין כאן לוגיקה עסקית: רק בחירת אלמנטים, פורמט מספרים ותאריכים, ותמונות רספונסיביות.

/** בחירת אלמנט אחד / כל האלמנטים בתוך שורש נתון. */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/** העדפות המשתמש: תנועה מופחתת ועכבר מדויק (ריחוף). */
export const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;

/** האם לעצור תנועה: הגדרת מערכת ההפעלה, או "עצירת תנועה" מתפריט הנגישות. */
export const still = () => REDUCED || document.documentElement.classList.contains("a11y-still");
/** הקפאת סצנת השער: רק כשהגולש ביקש "עצירת אנימציות" בתפריט הנגישות. "הפחתת תנועה" של הטלפון לבד לא מקפיאה אותה,
 *  כי השער זז רק כשהגולש גולל בעצמו (לא מתנגן לבד); בלעדיה האייפון נפתח על שער פתוח במקום על השער הסגור. */
export const frozen = () => document.documentElement.classList.contains("a11y-still");

/** מחיר בשקלים, מעוגל, עם מפריד אלפים עברי. */
const nf = new Intl.NumberFormat("he-IL");
export const ils = (n) => nf.format(Math.round(Number(n) || 0)) + "\u00a0₪"; // רווח קשיח: ה-₪ לא נשבר לשורה לבד

/** תאריך קצר בשעון ישראל. */
export const heDate = (d) => (d ? new Date(d).toLocaleDateString("he-IL", { timeZone: "Asia/Jerusalem" }) : "");

/** בריחה מ-HTML לטקסט שמגיע מהשרת או מהמשתמש. */
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** אירוע מדידה (analytics.js). אם המדידה לא מוגדרת, לא קורה כלום. */
export const track = (name, params) => window.track?.(name, params);

/**
 * תמונה מתיק העבודות ב-3 גדלים ו-3 פורמטים (avif/webp/jpg), ראו tools/images/resize.mjs.
 * @param {string} name שם הקובץ בלי סיומת וגודל
 * @param {string} alt טקסט חלופי
 * @param {string} sizes ערך sizes לדפדפן
 * @param {boolean} eager טעינה מיידית (לתמונות מעל הקיפול בלבד)
 */
export function pic(name, alt, sizes = "(max-width:820px) 50vw, 30vw", eager = false) {
  const set = (ext) => `img/${name}-480.${ext} 480w, img/${name}-960.${ext} 960w, img/${name}-1600.${ext} 1600w`;
  return `<picture><source type="image/avif" srcset="${set("avif")}" sizes="${sizes}"><source type="image/webp" srcset="${set("webp")}" sizes="${sizes}"><img src="img/${name}-960.jpg" srcset="${set("jpg")}" sizes="${sizes}" alt="${alt}" width="960" height="1106" loading="${eager ? "eager" : "lazy"}" decoding="async"></picture>`;
}

/** גלילה לאלמנט, בלי אנימציה כשהמשתמש ביקש להפחית תנועה. */
export const scrollTo = (el, block = "start") => el?.scrollIntoView({ block, behavior: still() ? "auto" : "smooth" });
