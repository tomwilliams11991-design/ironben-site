// IRON BEN: מדידה. Google Analytics 4 ו-Meta Pixel נטענים רק אם יש מזהה ב-config.js.
// window.track(name, params) שולח אירוע לשניהם: page_view אוטומטי, ואירועים מהאתר (gate_opened, door_open, estimate_shown, lead_submitted, contact_click).
// בנוסף: ספירה שלנו לסיכום היומי בטלגרם (ironben.log_event). אנונימית: מזהה אקראי לביקור (sessionStorage), מקור, טלפון/מחשב.
// בלי IP, בלי שם ובלי קוקיז. לא נספר: דפדפן אוטומטי (בדיקות, רובוטים) ו-localhost (אלא אם ?stats=1).
(function () {
  var C = window.IRONBEN_CONFIG || {};
  var META = { lead_submitted: "Lead", estimate_shown: "ViewContent", contact_click: "Contact" };
  if (C.GA_ID) {
    var s = document.createElement("script"); s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(C.GA_ID); document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", C.GA_ID, { anonymize_ip: true, page_title: document.title, page_location: location.href });
  }
  if (C.META_PIXEL_ID) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", C.META_PIXEL_ID);
    window.fbq("track", "PageView");
  }
  /* ===== ספירה לבוט ===== */
  var LOG = C.SUPABASE_URL && C.SUPABASE_ANON_KEY && !navigator.webdriver &&
    (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || /[?&]stats=1/.test(location.search));
  function store(k, make) { try { var v = sessionStorage.getItem(k); if (!v) { v = make(); sessionStorage.setItem(k, v); } return v; } catch (e) { return make(); } }
  var sid = store("ib_sid", function () { return (Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 24); });
  /** מאיפה הגיע הביקור: utm_source, או לפי האתר שהפנה. נקבע בדף הראשון של הביקור. */
  var source = store("ib_src", function () {
    var m = /[?&]utm_source=([^&]+)/.exec(location.search); if (m) return decodeURIComponent(m[1]).toLowerCase().slice(0, 40);
    var h = ""; try { h = new URL(document.referrer).hostname.replace(/^www\.|^m\.|^l\./, ""); } catch (e) {}
    if (!h || h === location.hostname) return "direct";
    var known = { google: /google\./, instagram: /instagram\.com/, facebook: /facebook\.com|fb\.com/, whatsapp: /whatsapp|wa\.me/, bing: /bing\.com/, chatgpt: /chatgpt\.com|openai\.com/ };
    for (var k in known) if (known[k].test(h)) return k;
    return h.slice(0, 40);
  });
  var device = matchMedia("(max-width: 820px)").matches ? "phone" : "desktop";
  function log(name, params) {
    if (!LOG) return;
    try {
      fetch(C.SUPABASE_URL + "/rest/v1/rpc/log_event", {
        method: "POST", keepalive: true,
        headers: { "Content-Type": "application/json", apikey: C.SUPABASE_ANON_KEY, Authorization: "Bearer " + C.SUPABASE_ANON_KEY, "Content-Profile": C.SCHEMA || "ironben" },
        body: JSON.stringify({ p_sid: sid, p_event: name, p_path: location.pathname, p_source: source, p_device: device, p_meta: params && Object.keys(params).length ? params : null })
      }).catch(function () {});
    } catch (e) { /* הספירה לא עוצרת את האתר */ }
  }
  log("page_view");
  // לחיצות על טלפון, מייל, אינסטגרם ופייסבוק (וואטסאפ נספר בנפרד, ב-js/contact.js)
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
    var h = a.getAttribute("href"), ch = /^tel:/.test(h) ? "phone" : /^mailto:/.test(h) ? "email" : /instagram\.com/.test(h) ? "instagram" : /facebook\.com/.test(h) ? "facebook" : /wa\.me|whatsapp/.test(h) && !a.classList.contains("js-wa") && !a.closest(".fab") ? "whatsapp" : "";
    if (ch) log("contact_click", ch === "whatsapp" ? { channel: ch, where: "page" } : { channel: ch });
  }, true);

  window.track = function (name, params) {
    params = params || {};
    log(name, params);
    try {
      if (window.gtag && C.GA_ID) window.gtag("event", name, params);
      if (window.fbq && C.META_PIXEL_ID) { if (META[name]) window.fbq("track", META[name], params); else window.fbq("trackCustom", name, params); }
    } catch (e) { /* המדידה לא עוצרת את האתר */ }
  };
})();
