// לייטבוקס: <dialog> מסך מלא עם חיצים, מקלדת וסגירה בלחיצה על הרקע. מקבל רשימת עבודות ואינדקס.
import { $ } from "./util.js";
import { DOORS } from "./data/work.js";

export function initLightbox() {
  const lb = $("#lb"), img = $("#lbImg"), cap = $("#lbCap"), cat = $("#lbCat"), count = $("#lbCount");
  let items = [], i = 0;

  /** מציג את התמונה הנוכחית (1600px) עם כיתוב, קטגוריה ומונה. */
  function show() {
    const w = items[i]; if (!w) return;
    img.src = `img/${w[0]}-1600.jpg`; img.alt = w[1];
    cap.textContent = w[1];
    cat.textContent = DOORS.find((d) => d.key === w[2])?.label || "";
    count.textContent = `${i + 1} / ${items.length}`;
  }
  const prev = () => { i = (i - 1 + items.length) % items.length; show(); };
  const next = () => { i = (i + 1) % items.length; show(); };

  $(".lb-close").addEventListener("click", () => lb.close());
  $(".lb-prev").addEventListener("click", prev);
  $(".lb-next").addEventListener("click", next);
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
  addEventListener("keydown", (e) => {
    if (!lb.open) return;
    if (e.key === "ArrowRight") prev(); // RTL: ימינה = הקודם
    if (e.key === "ArrowLeft") next();
  });

  return {
    /** פותח את הלייטבוקס על פריט מסוים מתוך רשימה. */
    open(list, index) { items = list; i = index; show(); lb.showModal(); },
    isOpen: () => lb.open,
  };
}
