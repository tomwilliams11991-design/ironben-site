// קיר הדלתות: דלת עץ חצי פתוחה לכל קטגוריה. ריחוף (במחשב) או נגיעה (בנייד) פותחים את הדלת
// וכל תמונות הקטגוריה "פורצות" מאחוריה אל הקיר (FLIP: מודדים את המקום הסופי, מתחילים מהדלת, משחררים).
import { $, $$, FINE, pic, track, scrollTo } from "./util.js";
import { DOORS, worksOf } from "./data/work.js";

/** HTML של דלת אחת: משקוף עם תמונת כיסוי, כנף עם פלטת פלדה. */
function doorHTML(d) {
  const n = worksOf(d.key).length;
  return `<button type="button" class="door" role="listitem" data-key="${d.key}" aria-expanded="false" aria-controls="burst">
    <div class="jamb">${pic(d.cover, "", "(max-width:980px) 60vw, 20vw")}<div class="count"><b>${d.label}</b>${n} עבודות</div></div>
    <div class="panel" aria-hidden="true"><span class="plate">${d.label}</span></div></button>`;
}

/** HTML של התמונות שפורצות: כותרת הקטגוריה + כפתור לכל תמונה (נגיש במקלדת). */
function burstHTML(d, works) {
  return `<div class="burst-head"><h3>${d.label}</h3><p>${d.desc}</p></div>` +
    works.map((w, i) => `<figure style="--i:${i}" data-i="${i}"><button type="button" class="ph" aria-label="הגדלה: ${w[1]}">${pic(w[0], w[1], "(max-width:560px) 50vw, (max-width:980px) 33vw, 160px")}</button><figcaption>${w[1]}</figcaption></figure>`).join("");
}

/** FLIP: לכל תמונה מחושב הווקטור ממקומה הסופי אל מרכז הדלת (CSS מתחיל משם ומשחרר ל-none). */
function aimFromDoor(burst, door) {
  const r = door.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  $$("figure", burst).forEach((f) => {
    const b = f.getBoundingClientRect();
    f.style.setProperty("--dx", `${cx - (b.left + b.width / 2)}px`);
    f.style.setProperty("--dy", `${cy - (b.top + b.height / 2)}px`);
  });
}

/**
 * @param {{open(list, i), isOpen(): boolean}} lightbox
 */
export function initDoors(lightbox) {
  const row = $("#doorRow"), burst = $("#burst"), area = $("#burstArea"), wall = $("#wall");
  if (!row) return;
  let openKey = null, shown = [], closeT = 0;
  row.innerHTML = DOORS.map(doorHTML).join("");

  function openDoor(key) {
    clearTimeout(closeT);
    if (openKey === key) return;
    openKey = key;
    const d = DOORS.find((x) => x.key === key), door = $(`.door[data-key="${key}"]`);
    $$(".door").forEach((b) => { b.classList.toggle("open", b === door); b.setAttribute("aria-expanded", String(b === door)); });
    shown = worksOf(key);
    track("door_open", { category: key });
    burst.classList.remove("in");
    burst.innerHTML = burstHTML(d, shown);
    area.classList.add("has");
    aimFromDoor(burst, door);
    void burst.offsetWidth; // מאלץ layout לפני שהמעבר מתחיל
    requestAnimationFrame(() => burst.classList.add("in"));
  }

  function closeDoor(delay = 0) {
    clearTimeout(closeT);
    closeT = setTimeout(() => {
      openKey = null;
      $$(".door").forEach((b) => { b.classList.remove("open"); b.setAttribute("aria-expanded", "false"); });
      burst.classList.remove("in");
      area.classList.remove("has");
      setTimeout(() => { if (!openKey) burst.innerHTML = ""; }, 600);
    }, delay);
  }

  // במחשב: ריחוף ופוקוס פותחים; יציאה מהקיר סוגרת (אלא אם הלייטבוקס פתוח מעל הקיר)
  if (FINE) {
    row.addEventListener("pointerover", (e) => { const b = e.target.closest(".door"); if (b) openDoor(b.dataset.key); });
    row.addEventListener("focusin", (e) => { const b = e.target.closest(".door"); if (b) openDoor(b.dataset.key); });
    wall.addEventListener("pointerleave", () => { if (!lightbox.isOpen()) closeDoor(250); });
  }
  // לחיצה: בנייד פותחת/סוגרת, במחשב גוללת לתמונות
  row.addEventListener("click", (e) => {
    const b = e.target.closest(".door"); if (!b) return;
    if (openKey !== b.dataset.key) openDoor(b.dataset.key);
    else if (FINE) scrollTo(area, "center");
    else closeDoor();
  });
  burst.addEventListener("click", (e) => {
    const f = e.target.closest("figure"); if (!f) return;
    clearTimeout(closeT);
    lightbox.open(shown, Number(f.dataset.i));
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && openKey && !lightbox.isOpen()) closeDoor(); });
}
