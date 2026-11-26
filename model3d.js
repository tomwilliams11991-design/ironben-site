// IRON BEN: מציג ההדמיה התלת-ממדית. Three.js דרך importmap (ראו index.html / quote.html / admin).
// שימוש:  const m = await mount(el); m.update("stairs", {steps: 14}, {finish: "black", wood: "oak"}); m.setMode("plan");
// הגיאומטריה של כל מוצר ב-3d/builders.js, החומרים ב-3d/materials.js. מצב "תוכנית" מציג את אותה גיאומטריה
// בהטלה אורתוגרפית עם קווי מתאר ומידות, כלומר השרטוט נובע מהמודל ולא מקוד ציור נפרד.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { contactShadow } from "./3d/textures.js?v=1db38d4";
import BUILDERS from "./3d/builders.js?v=1db38d4";
import { materials, ACCENT, THEME } from "./3d/materials.js?v=1db38d4";

export const PRODUCT_MODELS = Object.keys(BUILDERS);

/** מכין renderer עם צללים רכים ו-DPR מוגבל ל-1.5 (ביצועים). antialias תמיד: בלי זה הקצוות "מדרגות". */
function createRenderer(el) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.domElement.style.cssText = "width:100%;height:100%;display:block;outline:none;touch-action:none";
  el.appendChild(renderer.domElement);
  return renderer;
}

/**
 * סצנה ריאליסטית: סביבת תאורה של חדר (RoomEnvironment, בשביל השתקפויות על פלדה ועץ), שמש חמה עם צל רך,
 * אור קצה קר מאחור, רצפת צל, צל מגע רך מתחת למודל, ורשת (לתוכנית).
 */
function createScene(renderer) {
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(THEME.sky, THEME.ground, 0.35));
  const sun = new THREE.DirectionalLight(0xfff0dc, 2.2);
  sun.position.set(4, 7, 5); sun.castShadow = true;
  const big = innerWidth > 768;
  sun.shadow.mapSize.set(big ? 2048 : 1024, big ? 2048 : 1024); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 5;
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 25 }); // מכסה גם פרגולה ומעקה ארוכים
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xcfe0ff, 0.6); rim.position.set(-4, 3, -5); scene.add(rim); // אור קצה: מפריד את הברזל מהרקע
  const fill = new THREE.DirectionalLight(ACCENT, 0.18); fill.position.set(-5, 2, 4); scene.add(fill);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: THEME.shadow }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: contactShadow(), transparent: true, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2; contact.position.y = 0.002; contact.renderOrder = -1; scene.add(contact);
  ground.userData.contact = contact;
  const grid = new THREE.GridHelper(20, 40, THEME.grid1, THEME.grid2);
  grid.material.transparent = true; grid.material.opacity = 0.5; grid.visible = false; scene.add(grid);
  return { scene, ground, grid };
}

/** סיבוב בעכבר/מגע עם סיבוב אוטומטי איטי שחוזר 4 שניות אחרי שמשחררים. */
function createControls(cam, dom, reduced) {
  const controls = new OrbitControls(cam, dom);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false; controls.minPolarAngle = 0.3; controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.autoRotate = !reduced; controls.autoRotateSpeed = 0.6;
  let idleT = 0;
  controls.addEventListener("start", () => { controls.autoRotate = false; clearTimeout(idleT); });
  controls.addEventListener("end", () => { idleT = setTimeout(() => { if (!reduced) controls.autoRotate = true; }, 4000); });
  return controls;
}

/** שכבת HTML לתוויות המידות (מוקרנות מעל ה-canvas במצב תוכנית). */
function createLabelLayer(el) {
  const labels = document.createElement("div");
  labels.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;font:600 13px/1 Rubik,system-ui,sans-serif;color:" + THEME.label;
  if (getComputedStyle(el).position === "static") el.style.position = "relative";
  el.appendChild(labels);
  return labels;
}

/**
 * מרכיב מציג בתוך אלמנט. מחזיר API: update, setMode, getMode, destroy. (משמש היום את דף ההצעה, quote.html)
 * @param {HTMLElement} el מיכל עם גובה (ה-canvas ממלא אותו)
 */
export async function mount(el) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = createRenderer(el);
  const { scene, ground, grid } = createScene(renderer);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
  const controls = createControls(cam, renderer.domElement, reduced);
  const labels = createLabelLayer(el);
  const dimLines = new THREE.Group(); scene.add(dimLines);
  const lineMat = new THREE.LineBasicMaterial({ color: ACCENT });
  const edgeMat = new THREE.LineBasicMaterial({ color: THEME.edge, transparent: true, opacity: 0.9 });
  const flatMat = new THREE.MeshBasicMaterial({ color: THEME.flat });

  let model = null, mode = "3d", current = { slug: null, params: {}, mats: {} };
  const floaters = [];

  /** מסיר את המודל הקודם ומשחרר גיאומטריות. */
  function clearModel() {
    if (model) { scene.remove(model); model.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    dimLines.clear(); labels.innerHTML = ""; floaters.length = 0;
  }

  /** במצב תוכנית: משטחים לבנים + קווי מתאר, וקווי מידה עם תוויות. */
  function decoratePlan(c) {
    model.traverse((o) => { if (o.isMesh) { o.material = flatMat; o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.userData.planGeo ? o.userData.planGeo() : o.geometry, 20), edgeMat)); } });
    (model.userData.dims || []).forEach((d) => {
      const off = new THREE.Vector3(c[0], 0, c[2]);
      const a = new THREE.Vector3(...d.a).sub(off), b = new THREE.Vector3(...d.b).sub(off);
      dimLines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), lineMat));
      const tag = document.createElement("span"); tag.textContent = d.label;
      tag.style.cssText = "position:absolute;transform:translate(-50%,-50%);background:" + THEME.labelBg + ";padding:2px 6px;border-radius:2px;color:#d9742f;white-space:nowrap";
      tag.dataset.mid = JSON.stringify([(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2]);
      labels.appendChild(tag);
    });
  }

  /** בונה את המודל הנוכחי מחדש (אחרי שינוי פרמטר, חומר או מצב). */
  function build() {
    clearModel();
    const builder = BUILDERS[current.slug] || BUILDERS.table;
    model = builder(current.params, materials(current.mats.finish, current.mats.wood));
    const c = model.userData.center;
    model.position.set(-c[0], 0, -c[2]);
    scene.add(model);
    model.traverse((o) => { if (o.userData.float) { o.userData.y0 = o.position.y; floaters.push(o); } });
    // צל המגע בגודל טביעת הרגל של המודל
    const bb = new THREE.Box3().setFromObject(model), sz = bb.getSize(new THREE.Vector3());
    const contact = ground.userData.contact;
    contact.scale.set(sz.x * 1.25 + 0.3, sz.z * 1.25 + 0.3, 1); contact.position.x = (bb.min.x + bb.max.x) / 2; contact.position.z = (bb.min.z + bb.max.z) / 2;
    if (mode === "plan") decoratePlan(c);
    frame();
  }

  /** ממקם את שתי המצלמות כך שהמודל ממלא את הכרטיס (עם מרווח גדול יותר במסך גבוה). */
  function frame() {
    const portrait = (el.clientWidth || 1) / (el.clientHeight || 1) < 1 ? 1.35 : 1;
    const s = (model?.userData.size || 2) * 1.15 * portrait, cy = model?.userData.center[1] || 0.5;
    controls.target.set(0, cy, 0);
    const ang = Math.PI * 0.22;
    cam.position.set(Math.cos(ang) * s * 1.9, cy + s * 0.75, Math.sin(ang) * s * 1.9);
    cam.lookAt(0, cy, 0);
    const half = s * 0.72;
    ortho.left = -half; ortho.right = half; ortho.top = half; ortho.bottom = -half;
    if ((model?.userData.plan || "front") === "top") { ortho.position.set(0, 20, 0); ortho.up.set(0, 0, -1); ortho.lookAt(0, 0, 0); }
    else { ortho.position.set(0, cy, 20); ortho.up.set(0, 1, 0); ortho.lookAt(0, cy, 0); }
    ortho.updateProjectionMatrix();
  }

  /** מתאים את ה-canvas לגודל המיכל. */
  function resize() {
    const w = el.clientWidth || 300, h = el.clientHeight || 300;
    renderer.setSize(w, h, false);
    if (model) frame();
    cam.aspect = w / h; cam.updateProjectionMatrix();
    const half = (model?.userData.size || 2) * 1.15 * 0.72;
    ortho.left = -half * (w / h); ortho.right = half * (w / h); ortho.top = half; ortho.bottom = -half; ortho.updateProjectionMatrix();
  }

  /** מצייר פריים אחד, וממקם את תוויות המידה במצב תוכנית. */
  function render() {
    renderer.render(scene, mode === "plan" ? ortho : cam);
    if (mode !== "plan") return;
    const w = el.clientWidth, h = el.clientHeight;
    labels.querySelectorAll("span").forEach((tag) => {
      const v = new THREE.Vector3(...JSON.parse(tag.dataset.mid)).project(ortho);
      tag.style.left = ((v.x + 1) / 2) * w + "px"; tag.style.top = ((1 - v.y) / 2) * h + "px";
    });
  }

  /** לולאת האנימציה: רצה רק כשהכרטיס נראה על המסך. */
  let visible = true, raf = 0;
  function loop() {
    cancelAnimationFrame(raf);
    if (!visible) return;
    controls.update();
    if (!reduced && floaters.length) {
      const t = performance.now() / 1000;
      floaters.forEach((o) => { const f = o.userData.float; o.position.y = o.userData.y0 + Math.sin(t * f.s) * f.a; o.rotation.x += f.r[0]; o.rotation.y += f.r[1]; o.rotation.z += f.r[2]; });
    }
    render();
    raf = requestAnimationFrame(loop);
  }
  const ro = new ResizeObserver(resize); ro.observe(el);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }, { threshold: 0.05 });
  io.observe(el);

  /** מחליף בין הדמיה לתוכנית (בלי לגעת ב-current). */
  function applyMode(m) {
    mode = m === "plan" ? "plan" : "3d";
    grid.visible = mode === "plan"; ground.visible = mode !== "plan"; ground.userData.contact.visible = mode !== "plan";
    controls.enabled = mode !== "plan"; controls.autoRotate = mode !== "plan" && !reduced;
  }

  const api = {
    /** מעדכן מוצר, פרמטרים וחומרים ובונה מחדש. */
    update(slug, params = {}, mats = {}) {
      current = { slug: BUILDERS[slug] ? slug : (current.slug || "table"), params: { ...params }, mats: { ...current.mats, ...mats } };
      build(); resize(); loop();
    },
    setMode(m) { applyMode(m); build(); resize(); loop(); },
    getMode() { return mode; },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); controls.dispose(); renderer.dispose(); el.innerHTML = ""; },
    renderer, scene, camera: cam,
  };
  resize();
  return api;
}

export default { mount, PRODUCT_MODELS };
