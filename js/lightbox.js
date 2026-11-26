// לייטבוקס: <dialog> מסך מלא. תמונה גדולה, שורת תמונות קטנות מאותה מגירה, חיצים, מקלדת, וכפתור וואטסאפ עם שם העבודה.
// פתיחה "מהמקום": התמונה גדלה מהמקום שלה במגירה אל המסך המלא וחוזרת בסגירה (View Transitions, בדפדפנים שתומכים).
// בטלפון: החלקה הצידה מחליפה תמונה, החלקה למטה סוגרת.
import { $, still, track } from "./util.js?v=1db38d4";
import { DOORS } from "./data/work.js?v=1db38d4";
import { waLink } from "./contact.js?v=1db38d4";

const VT = "lb-photo"; // שם המעבר המשותף בין התמונה הקטנה לגדולה

export function initLightbox() {
  const lb = $("#lb"), img = $("#lbImg"), cap = $("#lbCap"), cat = $("#lbCat"), count = $("#lbCount"), thumbs = $("#lbThumbs"), wa = $("#lbWa");
  let items = [], i = 0, from = null;

  /** תמונה גדולה (1600px). אם יש כבר תמונה קטנה טעונה, מציגים אותה מיד ומחליפים כשהגדולה מוכנה */
  function setImage(w, quick) {
    const big = `img/${w[0]}-1600.jpg`;
    if (quick) { img.src = quick; const pre = new Image(); pre.onload = () => { if (items[i] === w) img.src = big; }; pre.src = big; }
    else img.src = big;
    img.alt = w[1];
  }

  /** מציג את הפריט הנוכחי: תמונה, כיתוב, קטגוריה, מונה, תמונה קטנה מסומנת, וקישור וואטסאפ עם שם העבודה */
  function show(quick) {
    const w = items[i]; if (!w) return;
    setImage(w, quick);
    cap.textContent = w[1];
    cat.textContent = DOORS.find((d) => d.key === w[2])?.label || "";
    count.textContent = `${i + 1} / ${items.length}`;
    const link = waLink(`היי, ראיתי באתר את העבודה "${w[1]}" ואשמח לשמוע על משהו דומה אצלי.`);
    if (link) wa.href = link;
    [...thumbs.children].forEach((b, k) => b.setAttribute("aria-current", k === i ? "true" : "false"));
    thumbs.children[i]?.scrollIntoView({ block: "nearest", inline: "center", behavior: still() ? "auto" : "smooth" });
  }
  const go = (k) => { i = (k + items.length) % items.length; show(); };
  const prev = () => go(i - 1), next = () => go(i + 1);

  /** סגירה: אם התמונה הנוכחית היא זו שפתחה, חוזרת למקומה במגירה */
  function close() {
    if (!lb.open) return;
    const back = from && items[i] && from.closest(".shot")?.dataset.i == i ? from : null;
    if (!back || still() || !document.startViewTransition) { lb.close(); return; }
    img.style.viewTransitionName = VT;
    document.startViewTransition(() => { img.style.viewTransitionName = ""; back.style.viewTransitionName = VT; lb.close(); })
      .finished.finally(() => { back.style.viewTransitionName = ""; });
  }

  $(".lb-close").addEventListener("click", close);
  $(".lb-prev").addEventListener("click", prev);
  $(".lb-next").addEventListener("click", next);
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  lb.addEventListener("cancel", (e) => { e.preventDefault(); close(); }); // Escape
  thumbs.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) go(Number(b.dataset.i)); });
  wa.addEventListener("click", () => track("contact_click", { channel: "whatsapp", where: "gallery", work: items[i]?.[1] }));
  addEventListener("keydown", (e) => {
    if (!lb.open) return;
    if (e.key === "ArrowRight") prev(); // RTL: ימינה = הקודם
    if (e.key === "ArrowLeft") next();
  });

  // החלקה בטלפון: הצידה מחליף תמונה, למטה סוגר
  let sx = 0, sy = 0, sw = false;
  const fig = $("figure", lb);
  fig.addEventListener("touchstart", (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; sw = true; }, { passive: true });
  fig.addEventListener("touchend", (e) => {
    if (!sw) return; sw = false;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (dy > 90 && dy > Math.abs(dx)) close();
    else if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
  }, { passive: true });

  return {
    /** פותח על פריט מתוך רשימה. fromImg = התמונה הקטנה שנלחצה, ממנה התמונה "גדלה" למסך */
    open(list, index, fromImg) {
      items = list; i = index; from = fromImg || null;
      thumbs.innerHTML = items.map((w, k) => `<button type="button" data-i="${k}" aria-label="${w[1]}"><img src="img/${w[0]}-480.jpg" alt="" loading="lazy" decoding="async"></button>`).join("");
      const quick = from?.currentSrc || "";
      if (!from || still() || !document.startViewTransition) { show(quick); lb.showModal(); return; }
      from.style.viewTransitionName = VT;
      document.startViewTransition(() => { from.style.viewTransitionName = ""; img.style.viewTransitionName = VT; show(quick); lb.showModal(); })
        .finished.finally(() => { img.style.viewTransitionName = ""; });
    },
    isOpen: () => lb.open,
  };
}
