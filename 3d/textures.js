// מרקמים פרוצדורליים להדמיה (בלי קבצי תמונה): סיבי עץ, צבע תנור, גלוון וחלודת קורטן.
// כל מרקם מצויר פעם אחת על canvas ונשמר במטמון לפי המפתח, כך שהחלפת חומר לא מציירת מחדש.
import * as THREE from "three";

const SIZE = 512;
const cache = new Map();

/** רעש חלק פשוט (value noise עם אינטרפולציה), 0..1. */
function noise2(seed) {
  const g = 64, v = new Float32Array((g + 1) * (g + 1));
  let s = seed;
  for (let i = 0; i < v.length; i++) { s = (s * 16807) % 2147483647; v[i] = s / 2147483647; }
  const at = (x, y) => v[(y % g) * (g + 1) + (x % g)];
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
}

/** מצייר canvas פיקסל-פיקסל לפי פונקציה (x, y) → [r, g, b] ומחזיר CanvasTexture חוזרת. */
function paint(key, fn, srgb = true) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement("canvas"); c.width = c.height = SIZE;
  const ctx = c.getContext("2d"), img = ctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const [r, g, b] = fn(x / SIZE, y / SIZE), i = (y * SIZE + x) * 4;
    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

const clamp = (v) => Math.max(0, Math.min(255, v));
const rgb = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];

/** עץ: פסי סיבים לאורך U, טבעות שנתיים מעוותות, ומעט נקבוביות. מחזיר {map, roughnessMap}. */
export function woodTextures(hex) {
  const n = noise2(7), n2 = noise2(31), [R, G, B] = rgb(hex);
  const grain = (u, v) => {
    const warp = n(u * 6, v * 40) * 2.2 + n2(u * 2, v * 8) * 1.4;
    const rings = Math.sin((v * 46 + warp) * Math.PI);           // פסים לאורך הקרש
    const fine = n2(u * 220, v * 900) * 0.5 + n(u * 40, v * 300) * 0.5; // סיבים דקים
    return 0.55 * (rings * 0.5 + 0.5) + 0.45 * fine;
  };
  const map = paint("wood-" + hex, (u, v) => {
    const g = grain(u, v), k = 0.62 + 0.55 * g * g;               // ניגוד חזק יותר: הסיבים נראים גם מרחוק
    return [clamp(R * k), clamp(G * k * 0.97), clamp(B * k * 0.92)];
  });
  const roughnessMap = paint("woodR-" + hex, (u, v) => { const r = 150 + 70 * grain(u, v); return [r, r, r]; }, false);
  return { map, roughnessMap };
}

/** צבע תנור: גרגר עדין מאוד (מרקם "קליפת תפוז") למפת חספוס. */
export function powderRoughness() {
  const n = noise2(3);
  return paint("powder", (u, v) => { const r = 105 + 40 * n(u * 180, v * 180); return [r, r, r]; }, false);
}

/** גלוון: כתמי "פרחי אבץ" בהירים וכהים. */
export function galvTextures() {
  const n = noise2(11), n2 = noise2(5);
  const spangle = (u, v) => Math.floor(n(u * 26, v * 26) * 5) / 5 * 0.7 + n2(u * 120, v * 120) * 0.3;
  return {
    map: paint("galv", (u, v) => { const k = 150 + 55 * spangle(u, v); return [k, k + 4, k + 7]; }),
    roughnessMap: paint("galvR", (u, v) => { const r = 70 + 90 * spangle(u, v); return [r, r, r]; }, false),
  };
}

/** קורטן: חלודה כתומה-חומה בשכבות, עם כתמים כהים. */
export function cortenTextures() {
  const n = noise2(17), n2 = noise2(23), n3 = noise2(41);
  return {
    map: paint("corten", (u, v) => {
      const a = n(u * 10, v * 10), b = n2(u * 48, v * 48), c = n3(u * 200, v * 200);
      const k = 0.5 * a + 0.32 * b + 0.18 * c, dark = Math.max(0, a - 0.62) * 2.2;   // חלודה חומה עם כתמים כהים
      return [clamp((70 + 95 * k) * (1 - dark * 0.5)), clamp((30 + 42 * k) * (1 - dark * 0.55)), clamp((16 + 20 * k) * (1 - dark * 0.6))];
    }),
    roughnessMap: paint("cortenR", (u, v) => { const r = 200 + 50 * n2(u * 60, v * 60); return [r, r, r]; }, false),
  };
}

/** צל מגע רך: עיגול כהה ומטושטש לרצפה מתחת למודל (שקיפות בערוץ האלפא). */
export function contactShadow() {
  if (cache.has("contact")) return cache.get("contact");
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const ctx = c.getContext("2d"), g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(0,0,0,0.3)"); g.addColorStop(0.55, "rgba(0,0,0,0.1)"); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  cache.set("contact", t);
  return t;
}
