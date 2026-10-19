// IRON BEN: תפריט נגישות. בלי ספריות. ההעדפות נשמרות בדפדפן (localStorage) ומופעלות כמחלקות על <html>.
(function () {
  var KEY = "ironben-a11y", html = document.documentElement;
  var OPTS = [
    ["big", "טקסט גדול"], ["bigger", "טקסט גדול מאוד"], ["contrast", "ניגודיות גבוהה"], ["links", "הדגשת קישורים"],
    ["font", "גופן קריא"], ["still", "עצירת תנועה ואנימציות"], ["spacing", "ריווח טקסט"], ["cursor", "סמן גדול"],
  ];
  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { state = {}; }
  function apply() {
    OPTS.forEach(function (o) { html.classList.toggle("a11y-" + o[0], !!state[o[0]]); });
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    html.dispatchEvent(new CustomEvent("a11ychange", { detail: state }));
  }
  apply();
  var wrap = document.createElement("div"); wrap.className = "a11y";
  wrap.innerHTML = '<button type="button" class="a11y-btn" aria-haspopup="dialog" aria-expanded="false" aria-controls="a11yPanel" aria-label="תפריט נגישות"><svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><circle cx="12" cy="4.5" r="2"/><path d="M4 8.2a1 1 0 0 1 1.2-.8l6.8 1.4 6.8-1.4a1 1 0 1 1 .4 2l-5.2 1.1V14l2.6 6.4a1 1 0 1 1-1.9.8L12 15.6 9.3 21.2a1 1 0 1 1-1.9-.8L10 14v-3.5L4.8 9.4A1 1 0 0 1 4 8.2Z"/></svg></button>' +
    '<div class="a11y-panel" id="a11yPanel" role="dialog" aria-label="הגדרות נגישות" hidden><div class="a11y-head"><b>נגישות</b><button type="button" class="a11y-close" aria-label="סגירה">✕</button></div><div class="a11y-opts">' +
    OPTS.map(function (o) { return '<button type="button" data-k="' + o[0] + '" aria-pressed="' + (!!state[o[0]]) + '">' + o[1] + "</button>"; }).join("") +
    '</div><div class="a11y-foot"><button type="button" class="a11y-reset">איפוס</button><a href="accessibility.html">הצהרת נגישות</a></div></div>';
  document.body.appendChild(wrap);
  var btn = wrap.querySelector(".a11y-btn"), panel = wrap.querySelector(".a11y-panel");
  function open(on) { panel.hidden = !on; btn.setAttribute("aria-expanded", String(on)); if (on) panel.querySelector("button[data-k]").focus(); else btn.focus(); }
  btn.addEventListener("click", function () { open(panel.hidden); });
  wrap.querySelector(".a11y-close").addEventListener("click", function () { open(false); });
  wrap.querySelector(".a11y-reset").addEventListener("click", function () { state = {}; apply(); panel.querySelectorAll("button[data-k]").forEach(function (b) { b.setAttribute("aria-pressed", "false"); }); });
  panel.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-k]"); if (!b) return;
    var k = b.dataset.k; state[k] = !state[k];
    if (k === "big" && state.big) state.bigger = false; if (k === "bigger" && state.bigger) state.big = false;
    apply(); panel.querySelectorAll("button[data-k]").forEach(function (x) { x.setAttribute("aria-pressed", String(!!state[x.dataset.k])); });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) open(false); });
  document.addEventListener("click", function (e) { if (!panel.hidden && !wrap.contains(e.target)) open(false); });
})();
