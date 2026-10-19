// חומרים להדמיה: גימורי ברזל, סוגי עץ, וצבעי הסצנה. משותף לבונים (builders.js) ולמציג (model3d.js).
import * as THREE from "three";

/** גימורי ברזל לפי מפתח ה-finish במוצר (products.input_schema.finishes). */
export const STEEL = {
  black:      { color: 0x1f2124, metalness: 0.55, roughness: 0.45 },
  white:      { color: 0xe6e4df, metalness: 0.35, roughness: 0.5 },
  galv:       { color: 0x9ea4a7, metalness: 0.9,  roughness: 0.38 },
  galv_black: { color: 0x26292c, metalness: 0.6,  roughness: 0.4 },
  corten:     { color: 0x8a4a2a, metalness: 0.2,  roughness: 0.9 },
  raw:        { color: 0x4b4e51, metalness: 0.75, roughness: 0.5 },
};

/** צבעי עץ לפי מפתח ה-wood במוצר. null = בלי עץ (הבונה משתמש בפלדה בהירה במקום). */
export const WOOD = {
  oak: 0xc9924f, walnut: 0x5c3b25, pine: 0xd8b57c, ipe: 0x6b3f22, teak: 0xa8753f, ash: 0xd9c7a3,
  liveedge: 0xb07a3e, metal: 0x5a5d60, none: null,
};

/** צבע המבטא (קווי מידה, אור מילוי). זהה ל---ember ב-CSS. */
export const ACCENT = 0xd9742f;

/** צבעי הסצנה: הכרטיס הוא "דף נייר" בהיר על שולחן העבודה. */
export const THEME = { sky: 0xffffff, ground: 0xe0ddd6, shadow: 0.2, grid1: 0xc9c7c1, grid2: 0xe0ddd6, edge: 0x1d1d1b, flat: 0xffffff, label: "#1d1d1b", labelBg: "#fafaf8" };

/**
 * בונה את סט החומרים לדגם אחד.
 * @returns {{steel, steelLight, wood|null, stone, dark, plant}}
 */
export function materials(finish, wood) {
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
