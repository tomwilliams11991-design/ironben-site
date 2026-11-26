// כפתורים "מגנטיים": זזים עד 6px אחרי הסמן. רק במחשב עם עכבר, ולא כשמפחיתים תנועה.
import { $$, FINE, still } from "./util.js?v=1db38d4";

export function initMagnets() {
  if (!FINE || still()) return;
  $$("[data-magnet]").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height;
      b.style.transform = `translate(${x * 6}px,${y * 6}px)`;
    });
    b.addEventListener("pointerleave", () => { b.style.transform = ""; });
  });
}
