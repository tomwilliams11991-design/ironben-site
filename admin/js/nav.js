// ניווט צד: כל כפתור מציג פאנל אחד וקורא לטוען שלו. go("builder") עובר למסך מהקוד.
import { $$ } from "./lib.js";

let loaders = {};

/** רושם את הטוענים ומחבר את הכפתורים. */
export function initNav(map) {
  loaders = map;
  $$(".side button[data-p]").forEach((b) => b.onclick = () => {
    $$(".side button[data-p]").forEach((x) => x.setAttribute("aria-selected", x === b));
    $$(".panel").forEach((x) => x.classList.toggle("on", x.id === "p-" + b.dataset.p));
    loaders[b.dataset.p]?.();
  });
}

/** מעבר למסך לפי שם (leads, builder, quotes, products, steel, mail, settings). */
export const go = (p) => document.querySelector(`.side button[data-p="${p}"]`).click();
