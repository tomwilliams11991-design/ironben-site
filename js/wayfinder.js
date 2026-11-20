// המפה של הסדנה: מוט ברזל עם תחנות (השער, הסדנה, ארון העבודות, שולחן העבודה, החצר) שמלווה את כל האתר,
// וגחלת שמראה איפה אנחנו. במחשב: מוט אנכי בצד; בטלפון: פס דק מתחת לכותרת עם שם התחנה.
// מחשבים רק scrollY מול נקודות התחלה שנמדדות מראש (ובשינוי גודל), בלי מדידות בזמן הגלילה.
import { $, $$ } from "./util.js?v=f82c330";
import { GATE } from "./walk.js?v=f82c330";
import { stableVH } from "./scroll-scene.js?v=f82c330";

/** איפה מתחילה כל תחנה (בפיקסלים של גלילה), לפי סדר. */
function measureStops() {
  const vh = stableVH(), top = (sel) => ($(sel)?.getBoundingClientRect().top ?? 0) + scrollY;
  const gate = top("#gate");
  return [
    0,                                              // השער
    gate + GATE.open * vh * 0.75,                    // הסדנה: כשהשער כמעט פתוח
    gate + (GATE.open + GATE.dwell) * vh,           // ארון העבודות: מתחילים ללכת אליו
    top("#bench") - vh * 0.35,                      // שולחן העבודה
    top("#about") - vh * 0.5,                       // החצר: מבן ועד פרטי הקשר
  ];
}

export function initWayfinder() {
  const nav = $("#way");
  if (!nav) return;
  const links = $$("a", nav), now = $(".way-now", nav);
  let stops = measureStops(), current = -1;

  function update() {
    let i = 0;
    while (i + 1 < stops.length && scrollY >= stops[i + 1]) i++;
    if (i === current) return;
    current = i;
    links.forEach((a, j) => {
      if (j === i) a.setAttribute("aria-current", "step"); else a.removeAttribute("aria-current");
      a.classList.toggle("past", j < i);
    });
    nav.style.setProperty("--i", i);
    if (now) now.textContent = `${i + 1}/${links.length} · ${links[i].textContent.trim()}`;
  }
  const remeasure = () => { stops = measureStops(); current = -1; update(); };
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", remeasure);
  new ResizeObserver(remeasure).observe(document.body);
  update();
}
