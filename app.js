// IRON BEN: האתר. תיק עבודות, scrollytelling, חומרים, קונפיגורטור 3D והצעה ראשונית.
// תלויות: supabase-js (UMD), three (importmap, נטען דינמית), admin/pricing.js (חישוב כמות בצד הלקוח להצגה בלבד).
const C = window.IRONBEN_CONFIG || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
const nf = new Intl.NumberFormat("he-IL");
const ils = (n) => nf.format(Math.round(n)) + " ₪";

// ---------- תמונות ----------
function pic(name, alt, sizes = "(max-width:820px) 50vw, 30vw", eager = false) {
  const set = (ext) => `img/${name}-480.${ext} 480w, img/${name}-960.${ext} 960w, img/${name}-1600.${ext} 1600w`;
  return `<picture><source type="image/avif" srcset="${set("avif")}" sizes="${sizes}"><source type="image/webp" srcset="${set("webp")}" sizes="${sizes}"><img src="img/${name}-960.jpg" srcset="${set("jpg")}" sizes="${sizes}" alt="${alt}" width="960" height="1106" loading="${eager ? "eager" : "lazy"}" decoding="async"></picture>`;
}

// ---------- חשיפה בגלילה ----------
const clipIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); clipIO.unobserve(e.target); } }), { rootMargin: "-60px 0px" });
function observeClip(el) { clipIO.observe(el); }
$$("[data-reveal]").forEach(observeClip);

// ---------- תיק עבודות ----------
const CATS = ["הכל", "מדרגות", "שערים ומעקות", "פרגולות וחוץ", "פנים ורהיטים", "עסקים", "בסדנה"];
const WORK = [
  ["stairs-floating-black", "מדרגות מרחפות על קורה מרכזית", "מדרגות", "tall"],
  ["gate-wood-slats", "שער נגרר עם רפפות עץ", "שערים ומעקות"],
  ["library-ladder", "ספריה עם סולם ברזל", "פנים ורהיטים"],
  ["outdoor-kitchen-night", "מטבח חוץ, חזיתות עץ", "פרגולות וחוץ", "wide"],
  ["stairs-spiral-wood", "ספירלה עם מדרכי עץ", "מדרגות"],
  ["office-plant-wall", "מחיצת צמחים במשרד", "עסקים", "tall"],
  ["gate-leaf", "שער עלים בחיתוך לייזר", "שערים ומעקות"],
  ["pergola-stone", "פרגולת ברזל ועץ לבית אבן", "פרגולות וחוץ"],
  ["table-chevron", "שולחן אוכל על רגלי ברזל", "פנים ורהיטים"],
  ["stairs-wood-rail", "מדרגות עץ ומעקה ברזל", "מדרגות", "wide"],
  ["barber-shop", "ריהוט למספרה", "עסקים"],
  ["carport-house", "סככת חניה ברזל ועץ", "פרגולות וחוץ"],
  ["tv-wall", "קיר טלוויזיה ממדפי ברזל", "פנים ורהיטים", "tall"],
  ["gate-estate", "שער כניסה מעוצב", "שערים ומעקות"],
  ["sign-netofa", "שלט קורטן ליקב נטופה", "עסקים"],
  ["stairs-spiral-white", "מדרגות ספירלה לבנות", "מדרגות"],
  ["outdoor-kitchen-pergola", "מטבח חוץ ופרגולה", "פרגולות וחוץ", "wide"],
  ["live-edge-table", "שולחן גזע טבעי", "פנים ורהיטים"],
  ["railing-white", "מעקה מרפסת לבן", "שערים ומעקות", "tall"],
  ["deli-shop", "ריהוט לחנות מעדנים", "עסקים"],
  ["library-white", "קיר ספריה לבן", "פנים ורהיטים"],
  ["stairs-exterior", "מדרגות חוץ מרחפות", "מדרגות"],
  ["kiosk-bar", "בר עץ לאירועים", "עסקים", "wide"],
  ["bbq", "מנגל עם מגירת עץ", "פרגולות וחוץ"],
  ["table-industrial", "שולחן בסגנון תעשייתי", "פנים ורהיטים"],
  ["gate-fence", "שער וגדר", "שערים ומעקות"],
  ["pergola-bbq", "פרגולה עם פינת מנגל", "פרגולות וחוץ", "tall"],
  ["truck-rack", "מתקן לטנדר", "עסקים"],
  ["window-bars", "סורגים מעוצבים", "שערים ומעקות"],
  ["glass-table", "שולחן זכוכית על ברזל", "פנים ורהיטים"],
  ["pergolas-garden", "פרגולות לגינה", "פרגולות וחוץ", "wide"],
  ["balcony-house", "מעקה מרפסת לבית", "שערים ומעקות"],
  ["tv-stand", "שידת טלוויזיה", "פנים ורהיטים"],
  ["facade-slats", "חיפוי רפפות לחזית", "שערים ומעקות", "tall"],
  ["smoker", "מעשנה מברזל", "פרגולות וחוץ"],
  ["tv-white-shelves", "מדפים לבנים לסלון", "פנים ורהיטים"],
  ["carport", "סככת חניה", "פרגולות וחוץ"],
  ["blacksmith", "נפחות בסדנה", "בסדנה", "wide"],
  ["welder", "ריתוך בסדנה", "בסדנה"],
  ["brand-stamp", "צריבת החותמת בעץ", "בסדנה"],
  ["anvil", "הסדן", "בסדנה", "tall"],
];
let shown = WORK, cat = "הכל";
// מונה 01 / 41 לפי מה שבמרכז
const countIO = new IntersectionObserver((es) => {
  es.forEach((e) => { if (e.isIntersecting) $("#workCounter b").textContent = String(Number(e.target.dataset.i) + 1).padStart(2, "0"); });
}, { threshold: 0.6 });
function observeCount(f) { countIO.observe(f); }
const wall = $("#wall"), filters = $("#filters"), stage = $("#workStage"), counter = $("#workCounter");

function renderWall() {
  shown = WORK.filter((w) => cat === "הכל" || w[2] === cat);
  wall.innerHTML = shown.map((w, i) => `<figure class="${w[3] || ""}" data-i="${i}"><div class="ph" data-clip>${pic(w[0], w[1], "(max-width:820px) 50vw, 30vw")}</div><figcaption><span>${w[1]}</span><i>${w[2]}</i></figcaption></figure>`).join("");
  $("#workCounter span").textContent = "/ " + String(shown.length).padStart(2, "0");
  $$(".ph[data-clip]", wall).forEach(observeClip);
  $$("figure", wall).forEach((f) => observeCount(f));
  layoutTrack();
}
function layoutTrack() {
  if (innerWidth <= 820 || REDUCED) return;
  const over = Math.max(0, wall.scrollWidth - stage.clientWidth);
  wall.style.setProperty("--track-overflow", over + "px");
  stage.style.setProperty("--work-pages", Math.max(2, Math.min(6, Math.round(over / innerWidth * 1.6) + 1)));
}
addEventListener("resize", layoutTrack);
CATS.forEach((c, i) => {
  const b = document.createElement("button");
  b.type = "button"; b.textContent = c; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", i === 0);
  b.addEventListener("click", () => {
    $$("button", filters).forEach((x) => x.setAttribute("aria-selected", "false"));
    b.setAttribute("aria-selected", "true"); cat = c;
    const go = () => { renderWall(); if (innerWidth > 820) stage.scrollIntoView({ block: "start", behavior: REDUCED ? "auto" : "smooth" }); };
    document.startViewTransition && !REDUCED ? document.startViewTransition(go) : go();
  });
  filters.appendChild(b);
});
// לייטבוקס
const lb = $("#lb"); let lbI = 0;
function openLb(i) { lbI = i; showLb(); if (!lb.open) lb.showModal(); }
function showLb() {
  const w = shown[lbI]; if (!w) return;
  $("#lbImg").src = `img/${w[0]}-1600.jpg`; $("#lbImg").alt = w[1];
  $("#lbCap").textContent = w[1]; $("#lbCat").textContent = w[2]; $("#lbCount").textContent = `${lbI + 1} / ${shown.length}`;
}
wall.addEventListener("click", (e) => { const f = e.target.closest("figure"); if (f) openLb(Number(f.dataset.i)); });
$(".lb-close").addEventListener("click", () => lb.close());
$(".lb-prev").addEventListener("click", () => { lbI = (lbI - 1 + shown.length) % shown.length; showLb(); });
$(".lb-next").addEventListener("click", () => { lbI = (lbI + 1) % shown.length; showLb(); });
lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
addEventListener("keydown", (e) => { if (!lb.open) return; if (e.key === "ArrowRight") $(".lb-prev").click(); if (e.key === "ArrowLeft") $(".lb-next").click(); });
renderWall();

// ---------- מה אנחנו בונים: תמונה דביקה מתחלפת ----------
const storyItems = $$(".story-item"), storyPics = $("#storyPics");
storyPics.innerHTML = storyItems.map((it, i) => pic(it.dataset.img, "", "(max-width:820px) 100vw, 50vw").replace("<picture>", `<picture class="${i === 0 ? "on" : ""}" data-i="${i}">`)).join("");
storyItems.forEach((it, i) => { const d = document.createElement("div"); d.className = "inline-pic"; d.innerHTML = pic(it.dataset.img, "", "100vw"); it.prepend(d); });
const storyIO = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (!e.isIntersecting) return;
    const i = storyItems.indexOf(e.target);
    storyItems.forEach((x, k) => x.classList.toggle("on", k === i));
    $$("picture", storyPics).forEach((p, k) => p.classList.toggle("on", k === i));
  });
}, { rootMargin: "-45% 0px -45% 0px" });
storyItems.forEach((it) => storyIO.observe(it));
storyItems[0].classList.add("on");

// ---------- תהליך: fallback לציור הקו ----------
const line = $(".steps-line");
if (line && !CSS.supports("animation-timeline: view()")) new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && line.classList.add("on")), { threshold: 0.4 }).observe(line);

// ---------- לעסקים ----------
$("#bizPics").innerHTML = [["office-plant-wall", "מחיצת צמחים במשרד"], ["barber-shop", "מספרה"], ["sign-netofa", "שלט קורטן ליקב"], ["deli-shop", "חנות מעדנים"]]
  .map(([n, c]) => `<figure><div class="ph" data-clip>${pic(n, c, "(max-width:820px) 50vw, 25vw")}</div><figcaption>${c}</figcaption></figure>`).join("");
$$("#bizPics .ph").forEach(observeClip);

// ---------- כפתורים מגנטיים (דסקטופ) ----------
if (FINE && !REDUCED) $$("[data-magnet]").forEach((b) => {
  b.addEventListener("pointermove", (e) => { const r = b.getBoundingClientRect(); const x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height; b.style.transform = `translate(${x * 6}px,${y * 6}px)`; });
  b.addEventListener("pointerleave", () => { b.style.transform = ""; });
});

// ---------- וואטסאפ, פוטר ----------
const waLink = (msg) => C.WHATSAPP ? `https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent(msg || "")}` : null;
$$(".js-wa").forEach((a) => { const u = waLink(a.dataset.msg); if (u) { a.href = u; a.target = "_blank"; a.rel = "noopener"; } });
$("#f-address").textContent = C.ADDRESS || "";
$("#f-contact").innerHTML = [
  C.PHONE_DISPLAY && `<a href="tel:${C.PHONE_DISPLAY.replace(/[^0-9+]/g, "")}">${C.PHONE_DISPLAY}</a>`,
  C.EMAIL && `<a href="mailto:${C.EMAIL}">${C.EMAIL}</a>`,
  C.INSTAGRAM && `<a href="${C.INSTAGRAM}" target="_blank" rel="noopener">אינסטגרם</a>`,
  C.FACEBOOK && `<a href="${C.FACEBOOK}" target="_blank" rel="noopener">פייסבוק</a>`,
].filter(Boolean).join("");

// ---------- 3D: טעינה עצלה של three ----------
let IronModel = null;
async function loadModel() {
  if (IronModel) return IronModel;
  try { IronModel = await import("./model3d.js"); } catch (e) { console.warn("3D לא נטען", e); IronModel = null; }
  return IronModel;
}
const webgl = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } })();

// הירו
const heroEl = $("#hero3d");
if (webgl) new IntersectionObserver(async (es, io) => {
  if (!es[0].isIntersecting) return; io.disconnect();
  const M = await loadModel(); if (!M) return;
  const m = await M.mount(heroEl, { hero: false });
  m.update("hero", {}, { finish: "black", wood: "oak" });
  heroEl.classList.add("live");
  heroEl.addEventListener("pointerdown", () => heroEl.classList.add("touched"), { once: true });
}, { threshold: 0.1 }).observe(heroEl);

// חומרים: דוגמיות + שער קטן
const STEEL_SW = [["black", "צביעה בתנור, שחור", "#1f2124"], ["galv", "גלוון חם", "#9ea4a7"], ["corten", "קורטן", "#8a4a2a"], ["raw", "ברזל גולמי בלכה", "#4b4e51"], ["white", "צביעה בתנור, לבן", "#e6e4df"]];
const WOOD_SW = [["oak", "אלון", "#c9924f"], ["walnut", "אגוז", "#5c3b25"], ["pine", "אורן", "#d8b57c"], ["ipe", "איפאה", "#6b3f22"]];
const NOTES = { black: "הכי נפוץ: עמיד בפנים ובחוץ מקורה. לחוץ חשוף נוסיף גלוון מתחת.", galv: "גלוון חם לפרגולות ושערים בחוץ. אפשר לצבוע מעליו.", corten: "פלדת קורטן מחלידה בשכבה מגנה. טוב לשלטים ולחזיתות.", raw: "ברזל גולמי עם לכה שקופה. רואים את סימני הריתוך והחום.", white: "לבן בתנור למעקות ולמדרגות בחללים בהירים.", oak: "אלון: קשה, גרעין עדין, מתיישן יפה.", walnut: "אגוז: כהה ועשיר, לשולחנות ולספריות.", pine: "אורן מחוטא: הכי משתלם לפרגולות.", ipe: "איפאה: עץ טרופי שעומד בגשם ובשמש בלי טיפול." };
let matM = null, matSteel = "black", matWood = "pine";
function swatches(el, list, cur, on) {
  el.innerHTML = list.map(([k, l, c]) => `<button type="button" data-k="${k}" aria-pressed="${k === cur}"><i style="--sw:${c}"></i>${l}</button>`).join("");
  el.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; $$("button", el).forEach((x) => x.setAttribute("aria-pressed", x === b)); on(b.dataset.k); });
}
swatches($("#matSteel"), STEEL_SW, matSteel, (k) => { matSteel = k; $("#matNote").textContent = NOTES[k] || ""; matM?.update("gate", { width_m: 3.2, height_m: 1.6, leaves: "slide", infill: "wood" }, { finish: k, wood: matWood }); });
swatches($("#matWood"), WOOD_SW, matWood, (k) => { matWood = k; $("#matNote").textContent = NOTES[k] || ""; matM?.update("gate", { width_m: 3.2, height_m: 1.6, leaves: "slide", infill: "wood" }, { finish: matSteel, wood: k }); });
$("#matNote").textContent = NOTES.black;
if (webgl) new IntersectionObserver(async (es, io) => {
  if (!es[0].isIntersecting) return; io.disconnect();
  const M = await loadModel(); if (!M) return;
  matM = await M.mount($("#mat3d"), {});
  matM.update("gate", { width_m: 3.2, height_m: 1.6, leaves: "slide", infill: "wood" }, { finish: matSteel, wood: matWood });
}, { threshold: 0.1 }).observe($("#mat3d"));

// ---------- קונפיגורטור והצעה ראשונית ----------
let sb = null;
try { if (C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase) sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, { db: { schema: C.SCHEMA || "ironben" } }); } catch { sb = null; }
let PRODUCTS = [], product = null, inputs = {}, estimate = null, estM = null, step = 1, files = [];
const form = $("#estForm");

async function loadProducts() {
  if (sb) { const { data, error } = await sb.rpc("public_products"); if (!error && data?.length) return data; }
  const r = await fetch("products.json").catch(() => null); return r?.ok ? r.json() : [];
}
function renderPicks() {
  $("#picks").innerHTML = PRODUCTS.map((p) => `<button type="button" class="pick" role="radio" aria-checked="false" data-slug="${p.slug}"><div class="ph">${pic(p.image || "stairs-floating-black", p.name, "(max-width:820px) 50vw, 15vw")}</div><span>${p.name}</span></button>`).join("");
}
$("#picks").addEventListener("click", (e) => {
  const b = e.target.closest(".pick"); if (!b) return;
  $$(".pick").forEach((x) => x.setAttribute("aria-checked", x === b));
  product = PRODUCTS.find((p) => p.slug === b.dataset.slug);
  inputs = {}; (product.input_schema.fields || []).forEach((f) => { inputs[f.key] = f.default; });
  inputs.finish = product.input_schema.finishes?.[0]?.key; inputs.wood = product.input_schema.woods?.[0]?.key;
  $("[data-step='1'] [data-next]").disabled = false;
  renderFields(); updateModel(); requestEstimate();
  $("#modelCap").textContent = product.name + ": גררו לסיבוב";
  $(".est-model").classList.add("has");
});
function renderFields() {
  const S = product.input_schema;
  $("#fields").innerHTML = (S.fields || []).map((f) => f.type === "choice"
    ? `<div class="field"><label>${f.label}</label><div class="chips" data-key="${f.key}">${f.options.map((o) => `<button type="button" data-v="${o.key}" aria-pressed="${inputs[f.key] === o.key}">${o.label}</button>`).join("")}</div></div>`
    : `<div class="field"><label for="in-${f.key}">${f.label}</label><div class="slider"><input type="range" id="in-${f.key}" data-key="${f.key}" min="${f.min}" max="${f.max}" step="${f.step || 1}" value="${inputs[f.key]}"><output>${inputs[f.key]}<small>${f.unit || ""}</small></output></div></div>`).join("");
  $("#finishChips").innerHTML = (S.finishes || []).map((o) => `<button type="button" data-v="${o.key}" aria-pressed="${inputs.finish === o.key}">${o.label}</button>`).join("");
  $("#woodChips").innerHTML = (S.woods || []).map((o) => `<button type="button" data-v="${o.key}" aria-pressed="${inputs.wood === o.key}">${o.label}</button>`).join("");
  $("#woodRow").hidden = !(S.woods || []).length;
}
$("#fields").addEventListener("input", (e) => {
  const r = e.target; if (r.type !== "range") return;
  inputs[r.dataset.key] = Number(r.value); r.nextElementSibling.firstChild.nodeValue = r.value;
  updateModel(); requestEstimate();
});
form.addEventListener("click", (e) => {
  const b = e.target.closest(".chips button"); if (!b) return;
  const chips = b.parentElement; const key = chips.dataset.key || (chips.id === "finishChips" ? "finish" : "wood");
  $$("button", chips).forEach((x) => x.setAttribute("aria-pressed", x === b));
  inputs[key] = b.dataset.v; updateModel(); requestEstimate();
});
async function updateModel() {
  if (!product || !webgl) return;
  if (!estM) { const M = await loadModel(); if (!M) return; estM = await M.mount($("#est3d"), {}); }
  estM.update(product.input_schema.model || product.slug, inputs, { finish: inputs.finish, wood: inputs.wood });
}
$$(".model-tabs button").forEach((b) => b.addEventListener("click", () => {
  $$(".model-tabs button").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", x === b); });
  estM?.setMode(b.dataset.mode);
}));
let estT = 0, estSeq = 0;
function requestEstimate() { clearTimeout(estT); estT = setTimeout(fetchEstimate, 300); }
async function fetchEstimate() {
  if (!product) return;
  const seq = ++estSeq;
  if (!sb) { $("#rangeNum").textContent = "ההערכה תופיע כשהאתר מחובר"; return; }
  const { data, error } = await sb.rpc("estimate_quote", { p_product_slug: product.slug, p_inputs: inputs });
  if (seq !== estSeq) return;
  if (error || !data || data.disabled) { estimate = null; $("#rangeNum").textContent = "לא הצלחנו לחשב. נחזור אליכם עם הערכה."; $("#bars").innerHTML = ""; return; }
  estimate = data; renderEstimate();
}
function countTo(el, from, to) {
  if (REDUCED) { el.textContent = `${ils(to.low)} עד ${ils(to.high)}`; return; }
  const t0 = performance.now(), d = 500;
  (function f(t) { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3);
    el.textContent = `${ils(from.low + (to.low - from.low) * e)} עד ${ils(from.high + (to.high - from.high) * e)}`;
    if (k < 1) requestAnimationFrame(f); })(t0);
}
let lastRange = { low: 0, high: 0 };
function renderEstimate() {
  const e = estimate, el = $("#rangeNum");
  countTo(el, lastRange, e); lastRange = { low: e.low, high: e.high }; el.classList.add("live");
  $("#rangeVat").textContent = `לפני מע"מ · ${e.qty} ${e.unit}`;
  const names = { steel: "ברזל", wood: "עץ", finish: "גימור ופרזול", labor: "עבודה" };
  $("#bars").innerHTML = Object.entries(e.breakdown).filter(([, v]) => v.pct > 0).map(([k, v]) => `<li><span>${names[k]}</span><span class="bar"><i style="--w:${v.pct}%"></i></span><em>${v.pct}%</em></li>`).join("");
  $("#resultNote").textContent = (e.min_applied ? "זו עבודה קטנה, ולכן המחיר הוא המינימום לעבודה. " : "") + "המחיר הסופי נקבע אחרי מדידה בבית.";
}
// שלבים
function goStep(n) {
  step = n;
  $$(".step").forEach((s) => s.classList.toggle("on", Number(s.dataset.step) === n));
  $(".step.done").hidden = n !== 5;
  $$(".progress li").forEach((li, i) => { li.classList.toggle("on", i + 1 === n); li.classList.toggle("past", i + 1 < n); });
  if (n === 5) return;
  $(`.step[data-step='${n}']`).scrollIntoView({ block: "start", behavior: REDUCED ? "auto" : "smooth" });
}
form.addEventListener("click", (e) => {
  if (e.target.closest("[data-next]")) goStep(step + 1);
  if (e.target.closest("[data-prev]")) goStep(step - 1);
});
// תמונות
const drop = $(".drop"), photos = $("#q-photos");
function setFiles(list) { files = [...list].filter((f) => f.type.startsWith("image/") && f.size <= 8 * 1024 * 1024).slice(0, 5);
  $("#thumbs").innerHTML = ""; files.forEach((f) => { const i = new Image(); i.src = URL.createObjectURL(f); i.onload = () => URL.revokeObjectURL(i.src); $("#thumbs").appendChild(i); }); }
photos.addEventListener("change", () => setFiles(photos.files));
["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); if (e.dataTransfer?.files) setFiles(e.dataTransfer.files); }));
// שליחה
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#formErr"), btn = $("#sendBtn");
  const name = $("#q-name").value.trim(), phone = $("#q-phone").value.trim();
  if (name.length < 2) { err.textContent = "איך קוראים לכם?"; $("#q-name").focus(); return; }
  if (!/^[0-9+\-\s()]{9,}$/.test(phone)) { err.textContent = "מספר הטלפון לא נראה תקין."; $("#q-phone").focus(); return; }
  if (!sb) { err.textContent = "הטופס עוד לא מחובר. בינתיים אפשר לשלוח בוואטסאפ."; return; }
  err.textContent = ""; btn.classList.add("loading"); btn.disabled = true;
  try {
    const key = crypto.randomUUID();
    const photo_paths = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i], ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
      const p = `${key}/${i}.${ext}`;
      const up = await sb.storage.from(C.BUCKET_PHOTOS || "ironben-lead-photos").upload(p, f, { contentType: f.type, upsert: false });
      if (!up.error) photo_paths.push(p);
    }
    const render_paths = [];
    if (estM && product) {
      try {
        const shots = estM.snapshot(1200);
        for (const [m, url] of Object.entries(shots)) {
          const blob = await (await fetch(url)).blob();
          const p = `${key}/${m === "3d" ? "view" : "plan"}.png`;
          const up = await sb.storage.from(C.BUCKET_RENDERS || "ironben-renders").upload(p, blob, { contentType: "image/png" });
          if (!up.error) render_paths.push(p);
        }
      } catch (e2) { console.warn("snapshot", e2); }
    }
    const payload = {
      name, phone, email: $("#q-email").value.trim() || null, city: $("#q-city").value.trim() || null,
      product_type: product?.name || null, customer_kind: $("#q-kind").value,
      dimensions: product ? Object.entries(estimate?.values || inputs).filter(([k]) => !["finish", "wood"].includes(k)).map(([k, v]) => `${k}: ${v}`).join(", ") : null,
      message: $("#q-msg").value.trim() || null,
      photo_paths, render_paths,
      product_slug: product?.slug || null, inputs: product ? inputs : null,
      sketch_params: product ? { model: product.input_schema.model || product.slug, ...inputs } : null,
      marketing_consent: $("#q-consent").checked, utm: location.search.slice(0, 300) || null,
    };
    const { error } = await sb.rpc("create_lead", { p: payload });
    if (error) throw error;
    $("#doneRange").textContent = estimate ? `ההערכה הראשונית ל${product.name}: ${ils(estimate.low)} עד ${ils(estimate.high)} לפני מע"מ.` : "נחזור אליכם עם טווח מחיר אחרי שנראה את התמונות.";
    const msg = estimate ? `היי, שלחתי בקשה באתר ל${product.name}. ההערכה שקיבלתי: ${ils(estimate.low)} עד ${ils(estimate.high)}.` : `היי, שלחתי בקשה באתר להצעת מחיר.`;
    const u = waLink(msg); if (u) $("#doneWa").href = u; else $("#doneWa").hidden = true;
    goStep(5);
  } catch (e3) {
    console.error(e3); err.textContent = "השליחה נכשלה. אפשר לנסות שוב או לשלוח בוואטסאפ.";
  } finally { btn.classList.remove("loading"); btn.disabled = false; }
});
$("#restart").addEventListener("click", () => { form.reset(); files = []; $("#thumbs").innerHTML = ""; goStep(1); });

loadProducts().then((list) => { PRODUCTS = list; renderPicks(); });
