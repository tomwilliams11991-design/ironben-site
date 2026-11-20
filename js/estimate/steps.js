// ניווט בין ארבעת שלבי הטופס, והעלאת תמונות בשלב 3.
import { $, $$, track, scrollTo } from "../util.js?v=f82c330";
import { state } from "./state.js?v=f82c330";

const MAX_FILES = 5, MAX_SIZE = 8 * 1024 * 1024;

/** עובר לשלב n (1..4, או 5 = מסך הסיום) ומעדכן את מחוון ההתקדמות. */
export function goStep(n) {
  state.step = n;
  track("estimate_step", { step: n, product: state.product?.slug || null });
  $$(".step").forEach((s) => s.classList.toggle("on", Number(s.dataset.step) === n));
  $(".step.done").hidden = n !== 5;
  $$(".progress li").forEach((li, i) => { li.classList.toggle("on", i + 1 === n); li.classList.toggle("past", i + 1 < n); });
  if (n < 5) scrollTo(scrollTarget(n));
}

/** לאן לגלול בשלב n. בטלפון ההדמיה מעל הטופס, אז בשלב המידות מתחילים ממנה (והמידות מתחתיה). */
function scrollTarget(n) {
  const model = $(".est-model.has");
  if (n === 2 && model && matchMedia("(max-width: 980px)").matches) return model;
  return $(`.step[data-step='${n}']`);
}

/** כפתורי המשך / חזרה. */
export function initStepNav() {
  $("#estForm").addEventListener("click", (e) => {
    if (e.target.closest("[data-next]")) goStep(state.step + 1);
    if (e.target.closest("[data-prev]")) goStep(state.step - 1);
  });
}

/** שני סוגי תמונות: של המקום (files) ותמונות השראה לסגנון (inspo). לכל אחד תיבה ושורת תצוגות מקדימות משלו. */
const KINDS = {
  files: { drop: "label[for='q-photos']", input: "#q-photos", thumbs: "#thumbs" },
  inspo: { drop: "label[for='q-inspo']", input: "#q-inspo", thumbs: "#inspoThumbs" },
};

/** שומר עד 5 תמונות (עד 8MB כל אחת) מסוג אחד ומציג תצוגות מקדימות. */
function setFiles(kind, list) {
  state[kind] = [...list].filter((f) => f.type.startsWith("image/") && f.size <= MAX_SIZE).slice(0, MAX_FILES);
  const thumbs = $(KINDS[kind].thumbs); thumbs.innerHTML = "";
  state[kind].forEach((f) => {
    const i = new Image(); i.src = URL.createObjectURL(f); i.onload = () => URL.revokeObjectURL(i.src);
    thumbs.appendChild(i);
  });
}

/** בחירת קבצים בלחיצה או בגרירה, לשתי התיבות. */
export function initPhotos() {
  for (const [kind, k] of Object.entries(KINDS)) {
    const drop = $(k.drop), input = $(k.input);
    input.addEventListener("change", () => setFiles(kind, input.files));
    ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); if (e.dataTransfer?.files) setFiles(kind, e.dataTransfer.files); }));
  }
}
