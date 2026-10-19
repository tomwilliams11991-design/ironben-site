// IRON BEN: סיור בסדנה. דלתות לפי קטגוריה, הנפחייה, חומרים, שולחן השרטוט (קונפיגורטור 3D + הצעה ראשונית), המשרד.
// תלויות: supabase-js (UMD), three (importmap, נטען דינמית), admin/pricing.js.
const C = window.IRONBEN_CONFIG || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
const nf = new Intl.NumberFormat("he-IL");
const ils = (n) => nf.format(Math.round(n)) + " ₪";

function pic(name, alt, sizes = "(max-width:820px) 50vw, 30vw", eager = false) {
  const set = (ext) => `img/${name}-480.${ext} 480w, img/${name}-960.${ext} 960w, img/${name}-1600.${ext} 1600w`;
  return `<picture><source type="image/avif" srcset="${set("avif")}" sizes="${sizes}"><source type="image/webp" srcset="${set("webp")}" sizes="${sizes}"><img src="img/${name}-960.jpg" srcset="${set("jpg")}" sizes="${sizes}" alt="${alt}" width="960" height="1106" loading="${eager ? "eager" : "lazy"}" decoding="async"></picture>`;
}
const clipIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); clipIO.unobserve(e.target); } }), { rootMargin: "-60px 0px" });
const observeClip = (el) => clipIO.observe(el);

// ---------- הדלתות: קטגוריה = דלת ----------
const DOORS = [
  { key: "stairs", label: "גרמי מדרגות", cover: "stairs-floating-black", desc: "מדרגות מרחפות על קורה מרכזית, ספירלה, או גרם קלאסי עם מדרכי עץ מלא. כולל מעקה לפי התקן.", affects: ["מספר המדרגות ורוחבן", "סוג העץ למדרכים", "מעקה בצד אחד או בשניים"] },
  { key: "gates", label: "שערים ומעקות", cover: "gate-estate", desc: "שערי כניסה וחניה, שערים בחיתוך לייזר, מעקות למרפסות ולמדרגות, וסורגים שנראים כמו עיצוב.", affects: ["רוחב הפתח וגובה", "מילוי: רפפות ברזל, עץ או לייזר", "גלוון, צביעה בתנור או קורטן"] },
  { key: "outdoor", label: "פרגולות וחוץ", cover: "pergola-stone", desc: "פרגולות וסככות ברזל ועץ, מטבחי חוץ עם חזיתות עץ, מנגלים ומעשנות שמחזיקים עשרות שנים.", affects: ["שטח במ\"ר וגובה", "רפפות אורן, אלון או איפאה", "מרחק עמודים ועומסי רוח"] },
  { key: "interior", label: "פנים ורהיטים", cover: "library-ladder", desc: "ספריות עם סולם, קירות טלוויזיה, מדפים ושולחנות מעץ מלא על רגלי ברזל. לפי מידות הקיר והחלל.", affects: ["רוחב, גובה ועומק", "אלון, אגוז או גזע טבעי", "ברזל שחור, לבן או גולמי"] },
  { key: "business", label: "עסקים ומשרדים", cover: "office-plant-wall", desc: "מחיצות עם אדניות, דלפקים וברים, ריהוט לחנויות, שלטי קורטן ומתקנים לרכב. לפי תוכנית.", affects: ["מידות מהתוכנית", "גימור ועמידות", "לוחות זמנים לפרויקט"] },
];
const WORK = [
  ["stairs-floating-black", "מדרגות מרחפות על קורה מרכזית", "stairs"], ["stairs-spiral-wood", "ספירלה עם מדרכי עץ", "stairs"], ["stairs-wood-rail", "מדרגות עץ ומעקה ברזל", "stairs"], ["stairs-spiral-white", "מדרגות ספירלה לבנות", "stairs"], ["stairs-exterior", "מדרגות חוץ מרחפות", "stairs"],
  ["gate-wood-slats", "שער נגרר עם רפפות עץ", "gates"], ["gate-leaf", "שער עלים בחיתוך לייזר", "gates"], ["gate-estate", "שער כניסה מעוצב", "gates"], ["railing-white", "מעקה מרפסת לבן", "gates"], ["gate-fence", "שער וגדר", "gates"], ["window-bars", "סורגים מעוצבים", "gates"], ["balcony-house", "מעקה מרפסת לבית", "gates"], ["facade-slats", "חיפוי רפפות לחזית", "gates"],
  ["outdoor-kitchen-night", "מטבח חוץ, חזיתות עץ", "outdoor"], ["pergola-stone", "פרגולת ברזל ועץ לבית אבן", "outdoor"], ["carport-house", "סככת חניה ברזל ועץ", "outdoor"], ["outdoor-kitchen-pergola", "מטבח חוץ ופרגולה", "outdoor"], ["bbq", "מנגל עם מגירת עץ", "outdoor"], ["pergola-bbq", "פרגולה עם פינת מנגל", "outdoor"], ["pergolas-garden", "פרגולות לגינה", "outdoor"], ["smoker", "מעשנה מברזל", "outdoor"], ["carport", "סככת חניה", "outdoor"],
  ["library-ladder", "ספריה עם סולם ברזל", "interior"], ["table-chevron", "שולחן אוכל על רגלי ברזל", "interior"], ["tv-wall", "קיר טלוויזיה ממדפי ברזל", "interior"], ["live-edge-table", "שולחן גזע טבעי", "interior"], ["library-white", "קיר ספריה לבן", "interior"], ["table-industrial", "שולחן בסגנון תעשייתי", "interior"], ["glass-table", "שולחן זכוכית על ברזל", "interior"], ["tv-stand", "שידת טלוויזיה", "interior"], ["tv-white-shelves", "מדפים לבנים לסלון", "interior"],
  ["office-plant-wall", "מחיצת צמחים במשרד", "business"], ["barber-shop", "ריהוט למספרה", "business"], ["sign-netofa", "שלט קורטן ליקב נטופה", "business"], ["deli-shop", "ריהוט לחנות מעדנים", "business"], ["kiosk-bar", "בר עץ לאירועים", "business"], ["truck-rack", "מתקן לטנדר", "business"],
];
const doorRow = $("#doorRow"), gallery = $("#gallery");
let openKey = null, shown = [];
doorRow.innerHTML = DOORS.map((d) => {
  const n = WORK.filter((w) => w[2] === d.key).length;
  return `<button type="button" class="door" role="listitem" data-key="${d.key}" aria-expanded="false" aria-controls="gallery">
    <div class="behind">${pic(d.cover, "", "(max-width:620px) 50vw, 20vw")}</div>
    <div class="leaf"><span class="tag">${d.label}</span></div>
    <figcaption>${d.label}<small>${n} עבודות</small></figcaption></button>`;
}).join("");
function openDoor(key) {
  const d = DOORS.find((x) => x.key === key);
  if (!d || openKey === key) { closeDoor(); return; }
  openKey = key;
  $$(".door").forEach((b) => b.setAttribute("aria-expanded", b.dataset.key === key));
  shown = WORK.filter((w) => w[2] === key);
  $("#galTitle").textContent = d.label; $("#galDesc").textContent = d.desc;
  $("#galAffects").innerHTML = d.affects.map((a) => `<li>${a}</li>`).join("");
  $("#galGrid").innerHTML = shown.map((w, i) => `<figure style="--i:${i}" data-i="${i}"><div class="ph">${pic(w[0], w[1], "(max-width:820px) 50vw, 25vw")}</div><figcaption>${w[1]}</figcaption></figure>`).join("");
  gallery.hidden = false;
  gallery.scrollIntoView({ block: "start", behavior: REDUCED ? "auto" : "smooth" });
}
function closeDoor() { openKey = null; gallery.hidden = true; $$(".door").forEach((b) => b.setAttribute("aria-expanded", "false")); }
doorRow.addEventListener("click", (e) => { const b = e.target.closest(".door"); if (b) openDoor(b.dataset.key); });
$("#galClose").addEventListener("click", () => { closeDoor(); $("#doors").scrollIntoView({ block: "start", behavior: REDUCED ? "auto" : "smooth" }); });
// לייטבוקס
const lb = $("#lb"); let lbI = 0;
function showLb() { const w = shown[lbI]; if (!w) return; $("#lbImg").src = `img/${w[0]}-1600.jpg`; $("#lbImg").alt = w[1]; $("#lbCap").textContent = w[1]; $("#lbCat").textContent = DOORS.find((d) => d.key === w[2])?.label || ""; $("#lbCount").textContent = `${lbI + 1} / ${shown.length}`; }
$("#galGrid").addEventListener("click", (e) => { const f = e.target.closest("figure"); if (!f) return; lbI = Number(f.dataset.i); showLb(); lb.showModal(); });
$(".lb-close").addEventListener("click", () => lb.close());
$(".lb-prev").addEventListener("click", () => { lbI = (lbI - 1 + shown.length) % shown.length; showLb(); });
$(".lb-next").addEventListener("click", () => { lbI = (lbI + 1) % shown.length; showLb(); });
lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
addEventListener("keydown", (e) => { if (!lb.open) return; if (e.key === "ArrowRight") $(".lb-prev").click(); if (e.key === "ArrowLeft") $(".lb-next").click(); });

// ---------- הנפחייה: תמונות וניצוצות ----------
$("#forgePics").innerHTML = [["blacksmith", "נפחות על הסדן"], ["welder", "ריתוך"], ["brand-stamp", "צריבת החותמת בעץ"]]
  .map(([n, c]) => `<figure><div class="ph" data-clip>${pic(n, c, "(max-width:900px) 100vw, 50vw")}</div><figcaption>${c}</figcaption></figure>`).join("");
$$("#forgePics .ph").forEach(observeClip);
if (!REDUCED) $(".embers").innerHTML = Array.from({ length: 18 }, () => `<i style="--x:${55 + Math.random() * 40}%;--d:${5 + Math.random() * 6}s;--dl:${-Math.random() * 10}s;--dx:${(Math.random() - 0.5) * 80}px"></i>`).join("");

// ---------- המשרד ----------
$("#officePics").innerHTML = [["office-plant-wall", "מחיצת צמחים במשרד"], ["barber-shop", "מספרה"], ["sign-netofa", "שלט קורטן ליקב"], ["deli-shop", "חנות מעדנים"]]
  .map(([n, c]) => `<figure><div class="ph" data-clip>${pic(n, c, "(max-width:820px) 50vw, 25vw")}</div><figcaption>${c}</figcaption></figure>`).join("");
$$("#officePics .ph").forEach(observeClip);

// ---------- כפתורים מגנטיים ----------
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

// ---------- 3D ----------
let IronModel = null;
async function loadModel() { if (IronModel) return IronModel; try { IronModel = await import("./model3d.js"); } catch (e) { console.warn("3D לא נטען", e); IronModel = null; } return IronModel; }
const webgl = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } })();

// חומרים
const STEEL_SW = [["black", "צביעה בתנור, שחור", "#1f2124"], ["galv", "גלוון חם", "#9ea4a7"], ["corten", "קורטן", "#8a4a2a"], ["raw", "ברזל גולמי בלכה", "#4b4e51"], ["white", "צביעה בתנור, לבן", "#e6e4df"]];
const WOOD_SW = [["oak", "אלון", "#c9924f"], ["walnut", "אגוז", "#5c3b25"], ["pine", "אורן", "#d8b57c"], ["ipe", "איפאה", "#6b3f22"]];
const NOTES = { black: "הכי נפוץ: עמיד בפנים ובחוץ מקורה. לחוץ חשוף נוסיף גלוון מתחת.", galv: "גלוון חם לפרגולות ושערים בחוץ. אפשר לצבוע מעליו.", corten: "פלדת קורטן מחלידה בשכבה מגנה. טוב לשלטים ולחזיתות.", raw: "ברזל גולמי עם לכה שקופה. רואים את סימני הריתוך והחום.", white: "לבן בתנור למעקות ולמדרגות בחללים בהירים.", oak: "אלון: קשה, גרעין עדין, מתיישן יפה.", walnut: "אגוז: כהה ועשיר, לשולחנות ולספריות.", pine: "אורן מחוטא: הכי משתלם לפרגולות.", ipe: "איפאה: עץ טרופי שעומד בגשם ובשמש בלי טיפול." };
let matM = null, matSteel = "black", matWood = "pine";
const GATE = { width_m: 3.2, height_m: 1.6, leaves: "slide", infill: "wood" };
function swatches(el, list, cur, on) {
  el.innerHTML = list.map(([k, l, c]) => `<button type="button" data-k="${k}" aria-pressed="${k === cur}"><i style="--sw:${c}"></i>${l}</button>`).join("");
  el.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; $$("button", el).forEach((x) => x.setAttribute("aria-pressed", x === b)); on(b.dataset.k); });
}
swatches($("#matSteel"), STEEL_SW, matSteel, (k) => { matSteel = k; $("#matNote").textContent = NOTES[k] || ""; matM?.update("gate", GATE, { finish: k, wood: matWood }); });
swatches($("#matWood"), WOOD_SW, matWood, (k) => { matWood = k; $("#matNote").textContent = NOTES[k] || ""; matM?.update("gate", GATE, { finish: matSteel, wood: k }); });
$("#matNote").textContent = NOTES.black;
if (webgl) new IntersectionObserver(async (es, io) => {
  if (!es[0].isIntersecting) return; io.disconnect();
  const M = await loadModel(); if (!M) return;
  matM = await M.mount($("#mat3d"), {}); matM.update("gate", GATE, { finish: matSteel, wood: matWood });
}, { threshold: 0.1 }).observe($("#mat3d"));

// ---------- שולחן השרטוט: קונפיגורטור והצעה ראשונית ----------
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
  $("#modelCap").textContent = product.name + ": גררו לסיבוב"; $(".est-model").classList.add("has");
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
$("#fields").addEventListener("input", (e) => { const r = e.target; if (r.type !== "range") return; inputs[r.dataset.key] = Number(r.value); r.nextElementSibling.firstChild.nodeValue = r.value; updateModel(); requestEstimate(); });
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
$$(".model-tabs button").forEach((b) => b.addEventListener("click", () => { $$(".model-tabs button").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", x === b); }); estM?.setMode(b.dataset.mode); }));
let estT = 0, estSeq = 0;
function requestEstimate() { clearTimeout(estT); estT = setTimeout(fetchEstimate, 300); }
async function fetchEstimate() {
  if (!product) return; const seq = ++estSeq;
  if (!sb) { $("#rangeNum").textContent = "ההערכה תופיע כשהאתר מחובר"; return; }
  const { data, error } = await sb.rpc("estimate_quote", { p_product_slug: product.slug, p_inputs: inputs });
  if (seq !== estSeq) return;
  if (error || !data || data.disabled) { estimate = null; $("#rangeNum").textContent = "לא הצלחנו לחשב. נחזור אליכם עם הערכה."; $("#bars").innerHTML = ""; return; }
  estimate = data; renderEstimate();
}
let lastRange = { low: 0, high: 0 };
function countTo(el, from, to) {
  if (REDUCED) { el.textContent = `${ils(to.low)} עד ${ils(to.high)}`; return; }
  const t0 = performance.now(), d = 500;
  (function f(t) { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = `${ils(from.low + (to.low - from.low) * e)} עד ${ils(from.high + (to.high - from.high) * e)}`; if (k < 1) requestAnimationFrame(f); })(t0);
}
function renderEstimate() {
  const e = estimate, el = $("#rangeNum");
  countTo(el, lastRange, e); lastRange = { low: e.low, high: e.high }; el.classList.add("live");
  $("#rangeVat").textContent = `לפני מע"מ · ${e.qty} ${e.unit}`;
  const names = { steel: "ברזל", wood: "עץ", finish: "גימור ופרזול", labor: "עבודה" };
  $("#bars").innerHTML = Object.entries(e.breakdown).filter(([, v]) => v.pct > 0).map(([k, v]) => `<li><span>${names[k]}</span><span class="bar"><i style="--w:${v.pct}%"></i></span><em>${v.pct}%</em></li>`).join("");
  $("#resultNote").textContent = (e.min_applied ? "זו עבודה קטנה, ולכן המחיר הוא המינימום לעבודה. " : "") + "המחיר הסופי נקבע אחרי מדידה בבית.";
}
function goStep(n) {
  step = n;
  $$(".step").forEach((s) => s.classList.toggle("on", Number(s.dataset.step) === n));
  $(".step.done").hidden = n !== 5;
  $$(".progress li").forEach((li, i) => { li.classList.toggle("on", i + 1 === n); li.classList.toggle("past", i + 1 < n); });
  if (n === 5) return;
  $(`.step[data-step='${n}']`).scrollIntoView({ block: "start", behavior: REDUCED ? "auto" : "smooth" });
}
form.addEventListener("click", (e) => { if (e.target.closest("[data-next]")) goStep(step + 1); if (e.target.closest("[data-prev]")) goStep(step - 1); });
const drop = $(".drop"), photos = $("#q-photos");
function setFiles(list) { files = [...list].filter((f) => f.type.startsWith("image/") && f.size <= 8 * 1024 * 1024).slice(0, 5); $("#thumbs").innerHTML = ""; files.forEach((f) => { const i = new Image(); i.src = URL.createObjectURL(f); i.onload = () => URL.revokeObjectURL(i.src); $("#thumbs").appendChild(i); }); }
photos.addEventListener("change", () => setFiles(photos.files));
["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); if (e.dataTransfer?.files) setFiles(e.dataTransfer.files); }));
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#formErr"), btn = $("#sendBtn");
  const name = $("#q-name").value.trim(), phone = $("#q-phone").value.trim();
  if (name.length < 2) { err.textContent = "איך קוראים לכם?"; $("#q-name").focus(); return; }
  if (!/^[0-9+\-\s()]{9,}$/.test(phone)) { err.textContent = "מספר הטלפון לא נראה תקין."; $("#q-phone").focus(); return; }
  if (!sb) { err.textContent = "הטופס עוד לא מחובר. בינתיים אפשר לשלוח בוואטסאפ."; return; }
  err.textContent = ""; btn.classList.add("loading"); btn.disabled = true;
  try {
    const key = crypto.randomUUID(), photo_paths = [], render_paths = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i], ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
      const p = `${key}/${i}.${ext}`;
      const up = await sb.storage.from(C.BUCKET_PHOTOS || "ironben-lead-photos").upload(p, f, { contentType: f.type, upsert: false });
      if (!up.error) photo_paths.push(p);
    }
    if (estM && product) {
      try {
        const shots = estM.snapshot(1200);
        for (const [m, url] of Object.entries(shots)) {
          const blob = await (await fetch(url)).blob(); const p = `${key}/${m === "3d" ? "view" : "plan"}.png`;
          const up = await sb.storage.from(C.BUCKET_RENDERS || "ironben-renders").upload(p, blob, { contentType: "image/png" });
          if (!up.error) render_paths.push(p);
        }
      } catch (e2) { console.warn("snapshot", e2); }
    }
    const payload = {
      name, phone, email: $("#q-email").value.trim() || null, city: $("#q-city").value.trim() || null,
      product_type: product?.name || null, customer_kind: $("#q-kind").value,
      dimensions: product ? Object.entries(estimate?.values || inputs).filter(([k]) => !["finish", "wood"].includes(k)).map(([k, v]) => `${k}: ${v}`).join(", ") : null,
      message: $("#q-msg").value.trim() || null, photo_paths, render_paths,
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
  } catch (e3) { console.error(e3); err.textContent = "השליחה נכשלה. אפשר לנסות שוב או לשלוח בוואטסאפ."; }
  finally { btn.classList.remove("loading"); btn.disabled = false; }
});
$("#restart").addEventListener("click", () => { form.reset(); files = []; $("#thumbs").innerHTML = ""; goStep(1); });
loadProducts().then((list) => { PRODUCTS = list; renderPicks(); });
