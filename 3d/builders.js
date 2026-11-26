// בוני הגיאומטריה: פונקציה לכל מוצר. כל בונה מקבל params (מהטופס) ו-M (חומרים) ומחזיר THREE.Group במטרים,
// עם userData: dims (קווי מידה למצב תוכנית), center, size (למסגור המצלמה) ו-plan (מבט התוכנית: front/side/top).
// להוספת מוצר: להוסיף בונה כאן, ולהגדיר במוצר input_schema.model עם אותו שם.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { STEEL } from "./materials.js?v=1db38d4";

/** מספר עם יחידה לתווית מידה. */
const fmt = (n, u) => `${Number.isInteger(n) ? n : n.toFixed(2).replace(/\.?0+$/, "")}${u ? " " + u : ""}`;
/** מספר חיובי מהטופס, או ברירת מחדל. */
const num = (v, d) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : d; };


// ---------- בוני גיאומטריה. כל בונה מקבל params + materials ומחזיר Group בסנטימטרים→מטרים, עם dims להצגה ----------
/** קופסה עם פינות מעוגלות מעט (עד 6 מ"מ), כדי שהקצוות יתפסו אור כמו פלדה ועץ אמיתיים.
 *  לשרטוט (מצב תוכנית) נשמרת גם קופסה חדה ב-userData.planGeo, כדי שקווי המתאר יהיו נקיים. */
function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const r = Math.min(0.006, Math.min(w, h, d) * 0.22);
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), mat);
  m.userData.planGeo = () => new THREE.BoxGeometry(w, h, d);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
function cyl(r, h, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}

const BUILDERS = {
  stairs(p, M) {
    const g = new THREE.Group();
    const steps = Math.round(num(p.steps, 14)), w = num(p.width_cm, 90) / 100, rise = 0.18, run = 0.27, th = 0.04;
    const total = steps * run, height = steps * rise;
    const ang = Math.atan2(height, total);
    // קורה מרכזית
    const beam = box(Math.hypot(total, height), 0.2, 0.12, M.steel, total / 2, height / 2 - 0.05, 0);
    beam.rotation.z = ang; g.add(beam);
    for (let i = 0; i < steps; i++) {
      const x = i * run + run / 2, y = (i + 1) * rise;
      // מדרך: עץ מלא, או פח פלדה דק כשנבחר "בלי עץ"
      if (M.wood) g.add(box(run + 0.03, th, w, M.wood, x, y - th / 2, 0));
      else g.add(box(run + 0.03, 0.012, w, M.steel, x, y - 0.006, 0));
      g.add(box(run - 0.02, 0.02, 0.1, M.steel, x, y - th - 0.01, 0)); // זרוע מהקורה למדרך
      const side = p.rail === "none" ? [] : p.rail === "both" ? [1, -1] : [1];
      if (i % 2 === 0) side.forEach((s) => g.add(cyl(0.012, 1.0, M.steel, x, y + 0.5, s * (w / 2 - 0.03))));
    }
    if (p.rail !== "none") {
      const sides = p.rail === "both" ? [1, -1] : [1];
      sides.forEach((s) => {
        const hr = box(Math.hypot(total, height), 0.04, 0.04, M.steel, total / 2, height / 2 + 1.0, s * (w / 2 - 0.03));
        hr.rotation.z = ang; g.add(hr);
      });
    }
    g.userData.dims = [
      { label: fmt(steps) + " מדרגות", a: [0, 0, w / 2 + 0.3], b: [total, height, w / 2 + 0.3] },
      { label: fmt(w * 100, "ס\"מ"), a: [-0.3, 0, -w / 2], b: [-0.3, 0, w / 2] },
    ];
    g.userData.center = [total / 2, height / 2, 0];
    g.userData.size = Math.max(total, height, w);
    g.userData.plan = "side";
    return g;
  },

  railing(p, M) {
    const g = new THREE.Group();
    const L = num(p.length_m, 6), H = num(p.height_cm, 105) / 100;
    const posts = Math.max(2, Math.round(L / 1.2) + 1);
    for (let i = 0; i < posts; i++) g.add(box(0.04, H, 0.04, M.steel, (i / (posts - 1)) * L, H / 2, 0));
    g.add(box(L + 0.04, 0.04, 0.05, M.steel, L / 2, H - 0.02, 0));
    g.add(box(L, 0.03, 0.03, M.steel, L / 2, 0.1, 0));
    if (p.infill === "horizontal") {
      for (let k = 1; k <= 5; k++) g.add(box(L, 0.012, 0.03, M.steel, L / 2, 0.1 + k * ((H - 0.14) / 6), 0));
    } else if (p.infill === "laser") {
      const plate = box(L - 0.08, H - 0.16, 0.006, M.steelLight, L / 2, H / 2, 0); g.add(plate);
    } else {
      const n = Math.floor(L / 0.11);
      for (let k = 0; k <= n; k++) g.add(box(0.012, H - 0.14, 0.012, M.steel, 0.04 + k * ((L - 0.08) / n), H / 2 + 0.03, 0));
    }
    g.userData.dims = [
      { label: fmt(L, "מ'"), a: [0, -0.2, 0.3], b: [L, -0.2, 0.3] },
      { label: fmt(H * 100, "ס\"מ"), a: [L + 0.25, 0, 0], b: [L + 0.25, H, 0] },
    ];
    g.userData.center = [L / 2, H / 2, 0]; g.userData.size = Math.max(L, 2); g.userData.plan = "front";
    return g;
  },

  pergola(p, M) {
    const g = new THREE.Group();
    const W = num(p.width_m, 4), L = num(p.length_m, 5), H = num(p.height_m, 2.6);
    [[0, 0], [W, 0], [0, L], [W, L]].forEach(([x, z]) => g.add(box(0.1, H, 0.1, M.steel, x, H / 2, z)));
    g.add(box(0.12, 0.2, L + 0.3, M.steel, 0, H + 0.1, L / 2));
    g.add(box(0.12, 0.2, L + 0.3, M.steel, W, H + 0.1, L / 2));
    const wood = M.wood || M.steelLight;
    const n = Math.round(L / 0.6);
    for (let i = 0; i <= n; i++) g.add(box(W + 0.5, 0.14, 0.05, wood, W / 2, H + 0.27, (i / n) * L));
    const m = Math.round(W / 0.25);
    for (let i = 0; i <= m; i++) g.add(box(0.04, 0.06, L + 0.1, wood, (i / m) * W, H + 0.37, L / 2));
    g.userData.dims = [
      { label: fmt(W, "מ'"), a: [0, -0.2, -0.4], b: [W, -0.2, -0.4] },
      { label: fmt(L, "מ'"), a: [W + 0.4, -0.2, 0], b: [W + 0.4, -0.2, L] },
      { label: fmt(H, "מ'"), a: [-0.4, 0, 0], b: [-0.4, H, 0] },
    ];
    g.userData.center = [W / 2, H / 2, L / 2]; g.userData.size = Math.max(W, L, H) * 1.1; g.userData.plan = "top";
    return g;
  },

  gate(p, M) {
    const g = new THREE.Group();
    const W = num(p.width_m, 4), H = num(p.height_m, 1.8);
    const leaves = p.leaves === "double" ? 2 : 1;
    const gap = 0.03, lw = (W - gap * (leaves - 1)) / leaves;
    const wood = M.wood;
    for (let l = 0; l < leaves; l++) {
      const x0 = l * (lw + gap);
      const f = new THREE.Group();
      f.add(box(lw, 0.06, 0.05, M.steel, x0 + lw / 2, H - 0.03, 0));
      f.add(box(lw, 0.06, 0.05, M.steel, x0 + lw / 2, 0.13, 0));
      f.add(box(0.06, H - 0.1, 0.05, M.steel, x0 + 0.03, H / 2 + 0.05, 0));
      f.add(box(0.06, H - 0.1, 0.05, M.steel, x0 + lw - 0.03, H / 2 + 0.05, 0));
      if (p.infill === "laser") f.add(box(lw - 0.1, H - 0.22, 0.004, M.steelLight, x0 + lw / 2, H / 2 + 0.05, 0));
      else {
        const slat = p.infill === "wood" && wood ? wood : M.steel;
        const n = Math.round((H - 0.22) / 0.12);
        for (let k = 0; k < n; k++) f.add(box(lw - 0.1, 0.08, p.infill === "wood" ? 0.02 : 0.012, slat, x0 + lw / 2, 0.2 + k * ((H - 0.3) / (n - 1)), 0));
      }
      g.add(f);
    }
    // עמודים
    g.add(box(0.15, H + 0.3, 0.15, M.steel, -0.12, (H + 0.3) / 2, 0));
    g.add(box(0.15, H + 0.3, 0.15, M.steel, W + 0.12, (H + 0.3) / 2, 0));
    if (p.leaves === "slide") { g.add(box(W * 1.9, 0.03, 0.06, M.steel, W * 0.95, 0.03, 0)); g.add(cyl(0.05, 0.03, M.steel, W * 0.25, 0.08, 0)); g.add(cyl(0.05, 0.03, M.steel, W * 0.75, 0.08, 0)); }
    g.userData.dims = [
      { label: fmt(W, "מ'"), a: [0, -0.25, 0], b: [W, -0.25, 0] },
      { label: fmt(H, "מ'"), a: [W + 0.45, 0, 0], b: [W + 0.45, H, 0] },
    ];
    g.userData.center = [W / 2, H / 2, 0]; g.userData.size = Math.max(W, H * 1.2); g.userData.plan = "front";
    return g;
  },

  kitchen(p, M) {
    const g = new THREE.Group();
    const L = num(p.length_m, 3), D = 0.65, H = 0.9;
    const wood = M.wood || M.steelLight;
    const seg = (x0, len, rot) => {
      const s = new THREE.Group();
      s.add(box(len, 0.05, D + 0.04, M.stone, len / 2, H - 0.025, 0));
      s.add(box(len, H - 0.1, D - 0.02, M.dark, len / 2, (H - 0.1) / 2 + 0.05, 0));
      const n = Math.round((H - 0.2) / 0.1);
      for (let k = 0; k < n; k++) s.add(box(len - 0.06, 0.075, 0.02, wood, len / 2, 0.15 + k * 0.1, D / 2 + 0.01));
      [0, len].forEach((x) => s.add(box(0.05, H, D, M.steel, x, H / 2, 0)));
      s.position.x = x0; s.rotation.y = rot; return s;
    };
    g.add(seg(0, L, 0));
    if (p.shape === "l") { const s2 = seg(0, L * 0.6, Math.PI / 2); s2.position.set(L + D / 2 - 0.02, 0, -D / 2 - 0.02 + 0.0); g.add(s2); }
    g.userData.dims = [{ label: fmt(L, "מ'"), a: [0, -0.2, D / 2 + 0.3], b: [L, -0.2, D / 2 + 0.3] }];
    g.userData.center = [L / 2, H / 2, 0]; g.userData.size = Math.max(L, 1.8); g.userData.plan = "front";
    return g;
  },

  shelving(p, M) {
    const g = new THREE.Group();
    const W = num(p.width_m, 3), H = num(p.height_m, 2.4), D = num(p.depth_cm, 30) / 100;
    const bays = Math.max(1, Math.round(W / 0.9)), rows = Math.max(1, Math.round(H / 0.38));
    const wood = M.wood || M.steelLight;
    for (let i = 0; i <= bays; i++) { g.add(box(0.03, H, 0.03, M.steel, (i / bays) * W, H / 2, D / 2 - 0.015)); g.add(box(0.03, H, 0.03, M.steel, (i / bays) * W, H / 2, -D / 2 + 0.015)); }
    for (let r = 0; r <= rows; r++) g.add(box(W + 0.03, 0.03, D, wood, W / 2, 0.05 + (r / rows) * (H - 0.08), 0));
    g.userData.dims = [
      { label: fmt(W, "מ'"), a: [0, -0.2, D / 2 + 0.2], b: [W, -0.2, D / 2 + 0.2] },
      { label: fmt(H, "מ'"), a: [W + 0.3, 0, 0], b: [W + 0.3, H, 0] },
    ];
    g.userData.center = [W / 2, H / 2, 0]; g.userData.size = Math.max(W, H); g.userData.plan = "front";
    return g;
  },

  table(p, M) {
    const g = new THREE.Group();
    const L = num(p.length_cm, 200) / 100, W = num(p.width_cm, 95) / 100, H = 0.75, th = 0.045;
    const wood = M.wood || M.steelLight;
    g.add(box(L, th, W, wood, L / 2, H - th / 2, 0));
    const legMat = M.steel, inset = 0.18;
    if (p.legs === "x") {
      [inset, L - inset].forEach((x) => {
        const a = box(0.08, Math.hypot(H - th, W - 0.1), 0.012, legMat, x, (H - th) / 2, 0); a.rotation.x = Math.atan2(W - 0.1, H - th); g.add(a);
        const b = a.clone(); b.rotation.x = -a.rotation.x; g.add(b);
      });
    } else if (p.legs === "trap") {
      [inset, L - inset].forEach((x) => {
        const a = box(0.08, Math.hypot(H - th, 0.2), 0.012, legMat, x, (H - th) / 2, W / 2 - 0.15); a.rotation.x = -0.26; g.add(a);
        const b = box(0.08, Math.hypot(H - th, 0.2), 0.012, legMat, x, (H - th) / 2, -W / 2 + 0.15); b.rotation.x = 0.26; g.add(b);
        g.add(box(0.08, 0.012, W - 0.2, legMat, x, H - th - 0.006, 0));
      });
    } else {
      [inset, L - inset].forEach((x) => {
        g.add(box(0.08, H - th, 0.012, legMat, x, (H - th) / 2, W / 2 - 0.12));
        g.add(box(0.08, H - th, 0.012, legMat, x, (H - th) / 2, -W / 2 + 0.12));
        g.add(box(0.08, 0.012, W - 0.24, legMat, x, 0.006, 0));
        g.add(box(0.08, 0.012, W - 0.24, legMat, x, H - th - 0.006, 0));
      });
    }
    g.userData.dims = [
      { label: fmt(L * 100, "ס\"מ"), a: [0, -0.15, W / 2 + 0.2], b: [L, -0.15, W / 2 + 0.2] },
      { label: fmt(W * 100, "ס\"מ"), a: [L + 0.25, -0.15, -W / 2], b: [L + 0.25, -0.15, W / 2] },
    ];
    g.userData.center = [L / 2, H / 2, 0]; g.userData.size = Math.max(L, 1.6); g.userData.plan = "top";
    return g;
  },

  partition(p, M) {
    const g = new THREE.Group();
    const W = num(p.width_m, 4), H = num(p.height_m, 2.4);
    const cols = Math.max(1, Math.round(W / 0.6)), rows = Math.max(1, Math.round(H / 0.6));
    for (let i = 0; i <= cols; i++) g.add(box(0.03, H, 0.03, M.steel, (i / cols) * W, H / 2, 0));
    for (let r = 0; r <= rows; r++) g.add(box(W + 0.03, 0.03, 0.03, M.steel, W / 2, (r / rows) * H, 0));
    if (p.planters !== "no") {
      for (let i = 0; i < cols; i++) {
        const x = (i + 0.5) * (W / cols);
        g.add(box(W / cols - 0.08, 0.22, 0.2, M.steel, x, 0.13, 0));
        g.add(box(W / cols - 0.14, 0.3, 0.14, M.plant, x, 0.4, 0));
        if (i % 2 === 1) g.add(box(W / cols - 0.1, 0.22, 0.2, M.steel, x, H * 0.55, 0));
      }
    }
    g.userData.dims = [
      { label: fmt(W, "מ'"), a: [0, -0.2, 0.3], b: [W, -0.2, 0.3] },
      { label: fmt(H, "מ'"), a: [W + 0.3, 0, 0], b: [W + 0.3, H, 0] },
    ];
    g.userData.center = [W / 2, H / 2, 0]; g.userData.size = Math.max(W, H); g.userData.plan = "front";
    return g;
  },

  // הירו: מדרגות + פרופילי ברזל גיאומטריים שמרחפים (I-beam, צינור מרובע, טבעת). אותם חומרים כמו המוצרים.
  hero(p, M) {
    const g = BUILDERS.stairs({ steps: 11, width_cm: 90, rail: "one" }, M);
    const c = g.userData.center;
    const steel = M.steel, galv = new THREE.MeshStandardMaterial({ ...STEEL.galv });
    // חתך I-beam מוצק
    const s = new THREE.Shape(); s.moveTo(-0.22, -0.26); s.lineTo(0.22, -0.26); s.lineTo(0.22, -0.18); s.lineTo(0.05, -0.18); s.lineTo(0.05, 0.18); s.lineTo(0.22, 0.18); s.lineTo(0.22, 0.26); s.lineTo(-0.22, 0.26); s.lineTo(-0.22, 0.18); s.lineTo(-0.05, 0.18); s.lineTo(-0.05, -0.18); s.lineTo(-0.22, -0.18); s.closePath();
    const beam = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.6, bevelEnabled: false }), galv); beam.scale.set(0.7, 0.7, 1);
    beam.position.set(c[0] * 1.55, c[1] + 1.5, -0.9); beam.rotation.set(0.5, 0.6, 0.2); beam.castShadow = true; beam.userData.float = { a: 0.08, s: 0.7, r: [0.002, 0.004, 0] }; g.add(beam);
    // צינור מרובע חלול
    const tube = new THREE.Group();
    const tw = 0.22, tl = 0.8, th = 0.025;
    [[0, tw / 2 - th / 2], [0, -(tw / 2 - th / 2)]].forEach(([x, y]) => tube.add(box(tl, th, tw, steel, x, y, 0)));
    [[tw / 2 - th / 2], [-(tw / 2 - th / 2)]].forEach(([z]) => tube.add(box(tl, tw, th, steel, 0, 0, z)));
    tube.position.set(c[0] * 0.35, c[1] + 2.0, 0.9); tube.rotation.set(0.3, -0.5, 0.9); tube.userData.float = { a: 0.1, s: 0.55, r: [0.003, 0.002, 0.001] }; g.add(tube);
    // טבעת (טבעת ריתוך / חישוק)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 12, 48), new THREE.MeshStandardMaterial({ ...STEEL.corten }));
    ring.position.set(c[0] * 1.7, c[1] + 0.25, 1.2); ring.rotation.set(1.1, 0.4, 0); ring.castShadow = true; ring.userData.float = { a: 0.06, s: 0.9, r: [0.004, 0.003, 0.002] }; g.add(ring);
    g.userData.size = g.userData.size * 1.05; g.userData.plan = "side";
    return g;
  },
};

export default BUILDERS;
