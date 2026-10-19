// מרכז מיילים: לשוניות המשנה (תור, תבניות, לוג, הסרה, שליחה) וחיווט חמשת המסכים.
import { $$ } from "../lib.js";
import { initOutreach, loadOutreach } from "./outreach.js";
import { initTemplates, loadTemplates } from "./templates.js";
import { initLog, loadLog } from "./log.js";
import { initSupp, loadSupp } from "./suppression.js";
import { initSending, loadSending } from "./sending.js";

const loaders = { queue: loadOutreach, templates: loadTemplates, log: loadLog, supp: loadSupp, sending: loadSending };

/** טוען את לשונית המשנה הפעילה (נקרא מהניווט הראשי). */
export function loadMail() {
  const active = $$(".subtabs button").find((b) => b.getAttribute("aria-selected") === "true");
  loaders[active?.dataset.s || "queue"]();
}

export function initMail() {
  initOutreach(); initTemplates(); initLog(); initSupp(); initSending();
  $$(".subtabs button").forEach((b) => b.onclick = () => {
    $$(".subtabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
    $$(".sub").forEach((x) => x.classList.toggle("on", x.id === "m-" + b.dataset.s));
    loaders[b.dataset.s]();
  });
}
