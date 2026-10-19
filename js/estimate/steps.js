// ניווט בין ארבעת שלבי הטופס, והעלאת תמונות בשלב 3.
import { $, $$, track, scrollTo } from "../util.js";
import { state } from "./state.js";

const MAX_FILES = 5, MAX_SIZE = 8 * 1024 * 1024;

/** עובר לשלב n (1..4, או 5 = מסך הסיום) ומעדכן את מחוון ההתקדמות. */
export function goStep(n) {
  state.step = n;
  track("estimate_step", { step: n, product: state.product?.slug || null });
  $$(".step").forEach((s) => s.classList.toggle("on", Number(s.dataset.step) === n));
  $(".step.done").hidden = n !== 5;
  $$(".progress li").forEach((li, i) => { li.classList.toggle("on", i + 1 === n); li.classList.toggle("past", i + 1 < n); });
  if (n < 5) scrollTo($(`.step[data-step='${n}']`));
}

/** כפתורי המשך / חזרה. */
export function initStepNav() {
  $("#estForm").addEventListener("click", (e) => {
    if (e.target.closest("[data-next]")) goStep(state.step + 1);
    if (e.target.closest("[data-prev]")) goStep(state.step - 1);
  });
}

/** שומר עד 5 תמונות (עד 8MB כל אחת) ומציג תצוגות מקדימות. */
function setFiles(list) {
  state.files = [...list].filter((f) => f.type.startsWith("image/") && f.size <= MAX_SIZE).slice(0, MAX_FILES);
  const thumbs = $("#thumbs"); thumbs.innerHTML = "";
  state.files.forEach((f) => {
    const i = new Image(); i.src = URL.createObjectURL(f); i.onload = () => URL.revokeObjectURL(i.src);
    thumbs.appendChild(i);
  });
}

/** בחירת קבצים בלחיצה או בגרירה. */
export function initPhotos() {
  const drop = $(".drop"), input = $("#q-photos");
  input.addEventListener("change", () => setFiles(input.files));
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); if (e.dataTransfer?.files) setFiles(e.dataTransfer.files); }));
}
