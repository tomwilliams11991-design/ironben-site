// "הציבו אצלכם" (AR): התמונה של העבודה שבחרו (גזורה מהרקע, img/ar) עומדת בחדר דרך מצלמת הטלפון, ברוחב ובגובה שבחרו.
// בונים בדפדפן קובץ GLB של לוח שקוף עם התמונה (Three.js + GLTFExporter), ו-<model-viewer> של Google מציג אותו:
//   אנדרואיד: WebXR (כרום עם ARCore). אייפון: AR Quick Look (model-viewer ממיר ל-USDZ לבד). נטען רק בלחיצה.
// במחשב הכפתור מוסתר ומופיעה שורה שאפשר לעשות את זה בטלפון. בדיקה במחשב: ?ar=1.
import { $, track } from "../util.js";
import { state } from "./state.js";

const MODEL_VIEWER = "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.4.0/dist/model-viewer.min.js";
const FORCE = new URLSearchParams(location.search).has("ar");
const H_KEYS = /^(length|width)/;

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
  loading ||= new Promise((res, rej) => {
    const s = document.createElement("script");
    s.type = "module"; s.src = MODEL_VIEWER; s.onload = res; s.onerror = () => rej(new Error("model-viewer"));
    document.head.appendChild(s);
  }).then(() => customElements.whenDefined("model-viewer"));
  return loading;
}

/** ערך של שדה במטרים (ס"מ מומרים), או null אם אין שדה כזה. */
function meters(re) {
  const f = (state.product.input_schema.fields || []).find((x) => x.type !== "choice" && re.test(x.key));
  if (!f) return null;
  const v = Number(state.inputs[f.key]) || 0;
  return /ס"מ|cm/.test(f.unit || "") || /_cm$/.test(f.key) ? v / 100 : v;
}

/** המידות בחדר: הרוחב/אורך והגובה שבחרו. שולחן בלי שדה גובה: 76 ס"מ. בלי רוחב: 2 מ'. */
const size = () => ({ w: meters(H_KEYS) ?? 2, h: meters(/^height/) ?? (state.product.slug === "table" ? 0.76 : null) });

/** מוצרים שבנויים ממקטעים (מעקה, מחיצה): בתמונה רחבה יותר המקטע חוזר, במקום להימתח. השאר נמתחים למידה. */
const TILED = new Set(["railing", "office_partition"]);

/** GLB של לוח עומד על הרצפה עם התמונה הגזורה, בגודל שבחרו (w×h מטר; בלי גובה, לפי יחס התמונה). */
async function photoGLB(src) {
  const THREE = await import("three");
  const { GLTFExporter } = await import("three/addons/exporters/GLTFExporter.js");
  const tex = await new THREE.TextureLoader().loadAsync(src);
  tex.colorSpace = THREE.SRGBColorSpace;
  const ratio = tex.image.height / tex.image.width, { w } = size(), h = size().h ?? w * ratio;
  if (TILED.has(state.product.slug)) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.x = Math.max(1, Math.round(w / (h / ratio)));
  }
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9, metalness: 0 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.y = h / 2; mesh.name = state.product.name;
  const root = new THREE.Group(); root.name = "IRON BEN"; root.add(mesh);
  const out = await new GLTFExporter().parseAsync(root, { binary: true });
  mesh.geometry.dispose(); mat.dispose(); tex.dispose();
  return { glb: out, w, h };
}

let url = null;
/** פותח את החלון: בונה את הקובץ, טוען את model-viewer ומציג עם כפתור "הציבו בחדר". */
async function openAR() {
  const btn = $("#arBtn"), msg = $("#arMsg"), p = state.product;
  if (!p) { msg.textContent = "בחרו קודם מה בונים."; return; }
  btn.classList.add("loading"); btn.disabled = true; msg.textContent = "";
  try {
    const [{ glb, w, h }] = await Promise.all([photoGLB(`img/ar/${p.image}.png`), loadModelViewer()]);
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(new Blob([glb], { type: "model/gltf-binary" }));
    $("#arCap").textContent = `${p.name} · ${w.toFixed(2)} × ${h.toFixed(2)} מ'`;
    $("#arHost").innerHTML = `<model-viewer id="arMv" alt="${p.name}, בגודל אמיתי" ar ar-modes="webxr quick-look" ar-scale="fixed" ar-placement="floor"
      camera-controls touch-action="pan-y" shadow-intensity="0.6" environment-image="neutral" exposure="1.05" interaction-prompt="none">
      <button slot="ar-button" class="btn primary ar-go" type="button">הציבו אצלכם בחדר</button></model-viewer>`;
    const mv = $("#arMv");
    mv.src = url;
    mv.addEventListener("load", () => { if (!mv.canActivateAR) $("#arNote").textContent = "במכשיר הזה אין מצלמת AR. פתחו את האתר בטלפון כדי להציב את זה אצלכם."; }, { once: true });
    mv.addEventListener("ar-status", (e) => {
      if (e.detail.status === "session-started") track("ar_started", { product: p.slug });
      if (e.detail.status === "failed") $("#arNote").textContent = "לא הצלחנו לפתוח את המצלמה. בדקו שנתתם הרשאה למצלמה, ונסו שוב.";
    });
    $("#arNote").textContent = "כוונו את הטלפון לרצפה במקום שבו זה יעמוד. התמונה מופיעה בגודל אמיתי, ואפשר להזיז ולסובב אותה באצבע.";
    $("#arDlg").showModal();
    track("ar_open", { product: p.slug });
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
  else $("#arMsg").textContent = "בטלפון אפשר להציב את זה אצלכם בחדר, בגודל אמיתי (AR).";
}
