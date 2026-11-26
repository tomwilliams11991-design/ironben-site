// טעינה עצלה של ההדמיה (Three.js ~600KB): רק כשבאמת צריך, ורק אם יש WebGL.
export const hasWebGL = (() => {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
})();

let modulePromise = null;
/** המודול model3d.js, פעם אחת. מחזיר null אם הטעינה נכשלה (האתר ממשיך בלי הדמיה). */
export function loadModel() {
  if (!hasWebGL) return Promise.resolve(null);
  if (!modulePromise) modulePromise = import("../model3d.js?v=1db38d4").catch((e) => { console.warn("3D לא נטען", e); return null; });
  return modulePromise;
}
