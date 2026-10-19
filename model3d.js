// IRON BEN: הדמיה תלת-ממדית פרמטרית לכל מוצר. Three.js דרך importmap (ראו index.html).
// שימוש:  const m = await IronModel.mount(el, {hero:false}); m.update('stairs', {steps:14,...}, {finish:'black', wood:'oak'}); m.snapshot()
// מצב "תוכנית" (plan) מציג את אותה גיאומטריה בהטלה אורתוגרפית עם קווי מתאר ומידות, כלומר השרטוט נובע מהמודל.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const STEEL = {
  black:      { color: 0x1f2124, metalness: 0.55, roughness: 0.45 },
  white:      { color: 0xe6e4df, metalness: 0.35, roughness: 0.5 },
  galv:       { color: 0x9ea4a7, metalness: 0.9,  roughness: 0.38 },
  galv_black: { color: 0x26292c, metalness: 0.6,  roughness: 0.4 },
  corten:     { color: 0x8a4a2a, metalness: 0.2,  roughness: 0.9 },
  raw:        { color: 0x4b4e51, metalness: 0.75, roughness: 0.5 },
};
const WOOD = {
  oak: 0xc9924f, walnut: 0x5c3b25, pine: 0xd8b57c, ipe: 0x6b3f22, teak: 0xa8753f, ash: 0xd9c7a3,
  liveedge: 0xb07a3e, metal: 0x5a5d60, none: null,
};
const ACCENT = 0xc98a2b;
const THEME = { sky: 0xffffff, ground: 0xd9d4c8, shadow: 0.22, grid1: 0xc5c0b4, grid2: 0xdad5c9, edge: 0x14231d, flat: 0xf5f3ee, label: "#14231d", labelBg: "#ebe8e0" };

const fmt = (n, u) => `${Number.isInteger(n) ? n : n.toFixed(2).replace(/\.?0+$/, "")}${u ? " " + u : ""}`;
const num = (v, d) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : d; };

// ---------- בוני גיאומטריה. כל בונה מקבל params + materials ומחזיר Group בסנטימטרים→מטרים, עם dims להצגה ----------
function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
function cyl(r, h, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14), mat);
  m.position.set(x, y, z); m.castShadow = true; return m;
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

function materials(finish, wood) {
  const st = STEEL[finish] || STEEL.black;
  const mk = (o) => new THREE.MeshStandardMaterial(o);
  const w = WOOD[wood === undefined ? "oak" : wood];
  return {
    steel: mk(st),
    steelLight: mk({ ...st, color: new THREE.Color(st.color).lerp(new THREE.Color(0xffffff), 0.18).getHex() }),
    wood: w == null ? null : mk({ color: w, metalness: 0, roughness: 0.75 }),
    stone: mk({ color: 0x3a3d40, metalness: 0.1, roughness: 0.6 }),
    dark: mk({ color: 0x2a2d30, metalness: 0.3, roughness: 0.7 }),
    plant: mk({ color: 0x3f7a3a, roughness: 1 }),
  };
}

// ---------- רכיב ----------
export async function mount(el, opts = {}) {
  const hero = !!opts.hero;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: innerWidth > 768, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  el.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = "width:100%;height:100%;display:block;outline:none;touch-action:none";

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
  scene.add(new THREE.HemisphereLight(THEME.sky, THEME.ground, hero ? 1.0 : 0.85));
  const sun = new THREE.DirectionalLight(0xfff1e0, 1.6);
  sun.position.set(4, 7, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0005; sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(ACCENT, 0.35); fill.position.set(-5, 2, -4); scene.add(fill);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: THEME.shadow }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(20, 40, THEME.grid1, THEME.grid2); grid.material.transparent = true; grid.material.opacity = 0.5; grid.visible = false; scene.add(grid);

  const controls = new OrbitControls(cam, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false; controls.minPolarAngle = 0.3; controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.autoRotate = !reduced; controls.autoRotateSpeed = hero ? 0.9 : 0.6;
  if (hero) { controls.enabled = false; }
  let idleT = 0;
  controls.addEventListener("start", () => { controls.autoRotate = false; clearTimeout(idleT); });
  controls.addEventListener("end", () => { idleT = setTimeout(() => { if (!reduced) controls.autoRotate = true; }, 4000); });

  // מידות: תוויות HTML מוקרנות
  const labels = document.createElement("div");
  labels.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;font:600 13px/1 Assistant,system-ui,sans-serif;color:" + THEME.label;
  if (getComputedStyle(el).position === "static") el.style.position = "relative";
  el.appendChild(labels);
  const dimLines = new THREE.Group(); scene.add(dimLines);

  let model = null, mode = "3d", current = { slug: null, params: {}, mats: {} };
  const lineMat = new THREE.LineBasicMaterial({ color: ACCENT });
  const edgeMat = new THREE.LineBasicMaterial({ color: THEME.edge, transparent: true, opacity: 0.9 });
  const flatMat = new THREE.MeshBasicMaterial({ color: THEME.flat });

  function build() {
    if (model) { scene.remove(model); model.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    dimLines.clear(); labels.innerHTML = "";
    const b = BUILDERS[current.slug] || BUILDERS.table;
    model = b(current.params, materials(current.mats.finish, current.mats.wood));
    const c = model.userData.center;
    model.position.set(-c[0], 0, -c[2]);
    scene.add(model);
    floaters.length = 0; model.traverse((o) => { if (o.userData.float) { o.userData.y0 = o.position.y; floaters.push(o); } });
    if (mode === "plan") {
      model.traverse((o) => { if (o.isMesh) { o.material = flatMat; o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 20), edgeMat)); } });
      (model.userData.dims || []).forEach((d) => {
        const a = new THREE.Vector3(...d.a).sub(new THREE.Vector3(c[0], 0, c[2])), bb = new THREE.Vector3(...d.b).sub(new THREE.Vector3(c[0], 0, c[2]));
        dimLines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, bb]), lineMat));
        const tag = document.createElement("span"); tag.textContent = d.label;
        tag.style.cssText = "position:absolute;transform:translate(-50%,-50%);background:" + THEME.labelBg + ";padding:2px 6px;border-radius:2px;color:#c98a2b;white-space:nowrap";
        tag.dataset.mid = JSON.stringify([(a.x + bb.x) / 2, (a.y + bb.y) / 2, (a.z + bb.z) / 2]);
        labels.appendChild(tag);
      });
    }
    frame();
  }

  function frame() {
    const portrait = (el.clientWidth || 1) / (el.clientHeight || 1) < 1 ? 1.35 : 1;
    const s = (model?.userData.size || 2) * (hero ? 0.95 : 1.15) * portrait, cy = (model?.userData.center[1] || 0.5);
    controls.target.set(0, cy, 0);
    const ang = Math.PI * 0.22;
    cam.position.set(Math.cos(ang) * s * 1.9, cy + s * 0.75, Math.sin(ang) * s * 1.9);
    cam.lookAt(0, cy, 0);
    const plan = model?.userData.plan || "front";
    const half = s * 0.72;
    ortho.left = -half; ortho.right = half; ortho.top = half; ortho.bottom = -half;
    if (plan === "top") { ortho.position.set(0, 20, 0); ortho.up.set(0, 0, -1); ortho.lookAt(0, 0, 0); }
    else if (plan === "side") { ortho.position.set(0, cy, 20); ortho.up.set(0, 1, 0); ortho.lookAt(0, cy, 0); ortho.position.z = 20; }
    else { ortho.position.set(0, cy, 20); ortho.up.set(0, 1, 0); ortho.lookAt(0, cy, 0); }
    ortho.updateProjectionMatrix();
  }

  function resize() {
    const w = el.clientWidth || 300, h = el.clientHeight || 300;
    renderer.setSize(w, h, false);
    if (model) frame();
    cam.aspect = w / h; cam.updateProjectionMatrix();
    const half = ((model?.userData.size || 2) * 1.15) * 0.72;
    ortho.left = -half * (w / h); ortho.right = half * (w / h); ortho.top = half; ortho.bottom = -half; ortho.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(el);

  let visible = true, raf = 0;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }, { threshold: 0.05 });
  io.observe(el);

  function render() {
    const camera = mode === "plan" ? ortho : cam;
    renderer.render(scene, camera);
    if (mode === "plan") {
      const w = el.clientWidth, h = el.clientHeight;
      labels.querySelectorAll("span").forEach((tag) => {
        const v = new THREE.Vector3(...JSON.parse(tag.dataset.mid)).project(ortho);
        tag.style.left = ((v.x + 1) / 2) * w + "px"; tag.style.top = ((1 - v.y) / 2) * h + "px";
      });
    }
  }
  const floaters = [];
  function loop() {
    cancelAnimationFrame(raf);
    if (!visible) return;
    controls.update();
    if (!reduced && floaters.length) { const t = performance.now() / 1000; floaters.forEach((o) => { const f = o.userData.float; o.position.y = o.userData.y0 + Math.sin(t * f.s) * f.a; o.rotation.x += f.r[0]; o.rotation.y += f.r[1]; o.rotation.z += f.r[2]; }); }
    render();
    raf = requestAnimationFrame(loop);
  }

  const api = {
    update(slug, params = {}, mats = {}) {
      current = { slug: BUILDERS[slug] ? slug : (current.slug || "table"), params: { ...params }, mats: { ...current.mats, ...mats } };
      build(); resize(); loop();
    },
    setMode(m) {
      mode = m === "plan" ? "plan" : "3d";
      grid.visible = mode === "plan"; ground.visible = mode !== "plan";
      controls.enabled = mode !== "plan" && !hero; controls.autoRotate = mode !== "plan" && !reduced;
      build(); resize(); loop();
    },
    getMode() { return mode; },
    // PNG של ההדמיה (ושל התוכנית). לא דורש preserveDrawingBuffer כי מצלמים מיד אחרי render.
    snapshot(width = 1200) {
      const prev = { w: renderer.domElement.width, h: renderer.domElement.height, pr: renderer.getPixelRatio() };
      const out = {};
      const aspect = (el.clientWidth || 4) / (el.clientHeight || 3);
      renderer.setPixelRatio(1); renderer.setSize(width, Math.round(width / aspect), false);
      cam.aspect = aspect; cam.updateProjectionMatrix();
      const savedMode = mode;
      for (const m of ["3d", "plan"]) {
        mode = m; grid.visible = m === "plan"; ground.visible = m !== "plan"; build();
        renderer.render(scene, m === "plan" ? ortho : cam);
        out[m] = renderer.domElement.toDataURL("image/png");
      }
      mode = savedMode; grid.visible = mode === "plan"; ground.visible = mode !== "plan"; build();
      renderer.setPixelRatio(prev.pr); resize(); render();
      return out;
    },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); controls.dispose(); renderer.dispose(); el.innerHTML = ""; },
    renderer, scene, camera: cam,
  };
  resize();
  return api;
}

export const PRODUCT_MODELS = Object.keys(BUILDERS);
export default { mount, PRODUCT_MODELS };
