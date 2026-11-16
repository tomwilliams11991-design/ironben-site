// חדר העבודות: נכנסים מארון העבודות לחדר תצוגה עם חמש נישות מוארות, נישה לכל קטגוריה (תמונת הכיסוי שלה בפנים).
// ריחוף (במחשב) או נגיעה (בטלפון) על נישה, וכל תמונות הקטגוריה "פורצות" ממנה לקיר שמתחת
// (FLIP: מודדים את המקום הסופי, מתחילים ממרכז הנישה, משחררים).
import { $, $$, FINE, pic, track, scrollTo } from "./util.js";
import { DOORS, worksOf } from "./data/work.js";

/**
 * הנישות בתמונת החדר (site/img/scene/room-*), בשברים מהרוחב/גובה. לפי סדר הקריאה מימין לשמאל.
 * הנישות שעל הקירות הצדדיים באלכסון, ולכן יש להן מצולע (clip) במקום מלבן.
 */
const NICHES = [
  { x: 0.854, y: 0.20, w: 0.072, h: 0.54, clip: "polygon(0 9.3%,100% 0,100% 100%,0 92.6%)" },
  { x: 0.634, y: 0.299, w: 0.09, h: 0.35 },
  { x: 0.45, y: 0.295, w: 0.097, h: 0.357 },
  { x: 0.273, y: 0.299, w: 0.089, h: 0.35 },
  { x: 0.074, y: 0.20, w: 0.072, h: 0.54, clip: "polygon(0 0,100% 9.3%,100% 92.6%,0 100%)" },
];
const pct = (v) => `${(v * 100).toFixed(2)}%`;

/** HTML של נישה: התמונה בתוך הנישה (עם אור ספוט מלמעלה), ולוחית פליז עם השם מתחת. */
function nicheHTML(d, i) {
  const n = NICHES[i], count = worksOf(d.key).length;
  const box = `left:${pct(n.x)};top:${pct(n.y)};width:${pct(n.w)};height:${pct(n.h)}`;
  return `<button type="button" class="niche" role="listitem" data-key="${d.key}" aria-expanded="false" aria-controls="burst" aria-label="${d.label}, ${count} עבודות" style="${box}">
    <span class="niche-ph"${n.clip ? ` style="clip-path:${n.clip}"` : ""}>${pic(d.cover, "", "(max-width:820px) 30vw, 12vw")}</span>
    <span class="niche-label" aria-hidden="true"><b>${d.label}</b>${count} עבודות</span></button>`;
}

/** HTML של התמונות שפורצות: כותרת הקטגוריה + כפתור לכל תמונה (נגיש במקלדת). */
function burstHTML(d, works) {
  return `<div class="burst-head"><h3>${d.label}</h3><p>${d.desc}</p></div>` +
    works.map((w, i) => `<figure style="--i:${i}" data-i="${i}"><button type="button" class="ph" aria-label="הגדלה: ${w[1]}">${pic(w[0], w[1], "(max-width:560px) 50vw, (max-width:980px) 33vw, 160px")}</button><figcaption>${w[1]}</figcaption></figure>`).join("");
}

/** FLIP: לכל תמונה מחושב הווקטור ממקומה הסופי אל מרכז הנישה (CSS מתחיל משם ומשחרר ל-none). */
function aimFrom(burst, from) {
  const r = from.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  $$("figure", burst).forEach((f) => {
    const b = f.getBoundingClientRect();
    f.style.setProperty("--dx", `${cx - (b.left + b.width / 2)}px`);
    f.style.setProperty("--dy", `${cy - (b.top + b.height / 2)}px`);
  });
}

/** בטלפון החדר רחב מהמסך וגוללים בו לצדדים: מתחילים מהמרכז. */
function centerRoom() {
  const room = $("#room");
  if (room && room.scrollWidth > room.clientWidth) room.scrollLeft = -(room.scrollWidth - room.clientWidth) / 2; // RTL: scrollLeft שלילי
}

/**
 * @param {{open(list, i), isOpen(): boolean}} lightbox
 */
export function initRoom(lightbox) {
  const row = $("#doorRow"), burst = $("#burst"), area = $("#burstArea"), wall = $("#wall");
  if (!row) return;
  let openKey = null, shown = [], closeT = 0;
  row.innerHTML = DOORS.map(nicheHTML).join("");
  centerRoom();
  addEventListener("resize", centerRoom);

  function openNiche(key) {
    clearTimeout(closeT);
    if (openKey === key) return;
    openKey = key;
    const d = DOORS.find((x) => x.key === key), niche = $(`.niche[data-key="${key}"]`);
    $$(".niche").forEach((b) => { b.classList.toggle("open", b === niche); b.setAttribute("aria-expanded", String(b === niche)); });
    shown = worksOf(key);
    track("door_open", { category: key });
    burst.classList.remove("in");
    burst.innerHTML = burstHTML(d, shown);
    area.classList.add("has");
    aimFrom(burst, niche);
    void burst.offsetWidth; // מאלץ layout לפני שהמעבר מתחיל
    requestAnimationFrame(() => burst.classList.add("in"));
  }

  function close(delay = 0) {
    clearTimeout(closeT);
    closeT = setTimeout(() => {
      openKey = null;
      $$(".niche").forEach((b) => { b.classList.remove("open"); b.setAttribute("aria-expanded", "false"); });
      burst.classList.remove("in");
      area.classList.remove("has");
      setTimeout(() => { if (!openKey) burst.innerHTML = ""; }, 600);
    }, delay);
  }

  // במחשב: ריחוף ופוקוס פותחים; יציאה מהחדר סוגרת (אלא אם הלייטבוקס פתוח מעליו)
  if (FINE) {
    row.addEventListener("pointerover", (e) => { const b = e.target.closest(".niche"); if (b) openNiche(b.dataset.key); });
    row.addEventListener("focusin", (e) => { const b = e.target.closest(".niche"); if (b) openNiche(b.dataset.key); });
    wall.addEventListener("pointerleave", () => { if (!lightbox.isOpen()) close(250); });
  }
  // לחיצה: פותחת (בטלפון גם גוללת אל התמונות), לחיצה שנייה גוללת אליהן
  row.addEventListener("click", (e) => {
    const b = e.target.closest(".niche"); if (!b) return;
    const again = openKey === b.dataset.key;
    openNiche(b.dataset.key);
    if (again || !FINE) setTimeout(() => scrollTo(area, "start"), FINE ? 0 : 350);
  });
  burst.addEventListener("click", (e) => {
    const f = e.target.closest("figure"); if (!f) return;
    clearTimeout(closeT);
    lightbox.open(shown, Number(f.dataset.i));
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && openKey && !lightbox.isOpen()) close(); });
}
