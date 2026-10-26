// מציאות רבודה (AR): "הציבו אצלכם". מהטלפון, המודל שהלקוח בנה (מידות, גימור, עץ) מופיע במצלמה, בגודל אמיתי, על הרצפה.
// מבוסס על <model-viewer> של Google, שנטען רק כשלוחצים (כ-1MB):
//   אנדרואיד: WebXR (כרום עם ARCore). אייפון: AR Quick Look (model-viewer ממיר את ה-GLB ל-USDZ לבד).
// הכפתור מוצג רק במכשירים שתומכים. בדיקה במחשב: ?ar=1 מציג את הכפתור ואת התצוגה (בלי מצלמה).
import { $, track } from "../util.js";
import { state } from "./state.js";

const MODEL_VIEWER = "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.4.0/dist/model-viewer.min.js";
const FORCE = new URLSearchParams(location.search).has("ar");

/** האם המכשיר יכול להציג AR: אייפון/אייפד (Quick Look) או אנדרואיד עם WebXR. */
async function arSupported() {
  if (FORCE) return true;
  const a = document.createElement("a");
  if (a.relList?.supports?.("ar")) return true;
  try { return !!(await navigator.xr?.isSessionSupported("immersive-ar")); } catch { return false; }
}

/** טוען את model-viewer פעם אחת. */
let loading = null;
function loadModelViewer() {
  if (!loading) {
    loading = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.type = "module"; s.src = MODEL_VIEWER; s.onload = res; s.onerror = () => rej(new Error("model-viewer"));
      document.head.appendChild(s);
    }).then(() => customElements.whenDefined("model-viewer"));
  }
  return loading;
}

/** תיאור קצר של מה שמוצג (מוצר + מידות עיקריות), לכותרת החלון. */
function caption() {
  const p = state.product;
  const dims = (p.input_schema.fields || []).filter((f) => f.type !== "choice").map((f) => `${f.label} ${state.inputs[f.key]}${f.unit ? " " + f.unit : ""}`);
  return `${p.name}${dims.length ? " · " + dims.join(" · ") : ""}`;
}

let url = null;
/** פותח את החלון: מייצא את המודל, טוען את model-viewer ומציג אותו עם כפתור "הציבו בחדר". */
async function openAR() {
  const btn = $("#arBtn"), msg = $("#arMsg");
  if (!state.model || !state.product) { msg.textContent = "בחרו קודם מה בונים."; return; }
  btn.classList.add("loading"); btn.disabled = true; msg.textContent = "";
  try {
    const [glb] = await Promise.all([state.model.exportGLB(), loadModelViewer()]);
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(new Blob([glb], { type: "model/gltf-binary" }));
    $("#arCap").textContent = caption();
    $("#arHost").innerHTML = `<model-viewer id="arMv" alt="${state.product.name}, בגודל אמיתי" ar ar-modes="webxr quick-look" ar-scale="fixed" ar-placement="floor"
      camera-controls touch-action="pan-y" shadow-intensity="1" environment-image="neutral" exposure="1.05" interaction-prompt="none">
      <button slot="ar-button" class="btn primary ar-go" type="button">הציבו אצלכם בחדר</button></model-viewer>`;
    const mv = $("#arMv");
    mv.src = url;
    mv.addEventListener("load", () => { if (!mv.canActivateAR) $("#arNote").textContent = "במכשיר הזה אין מצלמת AR. אפשר לסובב ולהגדיל כאן, או לפתוח את האתר בטלפון."; }, { once: true });
    mv.addEventListener("ar-status", (e) => {
      if (e.detail.status === "session-started") track("ar_started", { product: state.product.slug });
      if (e.detail.status === "failed") $("#arNote").textContent = "לא הצלחנו לפתוח את המצלמה. בדקו שנתתם הרשאה למצלמה, ונסו שוב.";
    });
    $("#arNote").textContent = "כוונו את הטלפון לרצפה. המודל מופיע בגודל אמיתי, ואפשר להזיז ולסובב אותו באצבע.";
    $("#arDlg").showModal();
    track("ar_open", { product: state.product.slug });
  } catch (e) {
    console.warn("AR", e);
    msg.textContent = "לא הצלחנו לטעון את התצוגה. נסו שוב.";
  } finally { btn.classList.remove("loading"); btn.disabled = false; }
}

export async function initAR() {
  const btn = $("#arBtn");
  if (!btn) return;
  btn.addEventListener("click", openAR);
  $("#arClose").addEventListener("click", () => $("#arDlg").close());
  $("#arDlg").addEventListener("close", () => { $("#arHost").innerHTML = ""; });
  if (await arSupported()) btn.hidden = false;
}
