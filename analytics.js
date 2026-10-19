// IRON BEN: מדידה. Google Analytics 4 ו-Meta Pixel נטענים רק אם יש מזהה ב-config.js.
// window.track(name, params) שולח אירוע לשניהם: page_view אוטומטי, ואירועים מהאתר (gate_opened, door_open, estimate_shown, lead_submitted, contact_click).
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
  window.track = function (name, params) {
    params = params || {};
    try {
      if (window.gtag && C.GA_ID) window.gtag("event", name, params);
      if (window.fbq && C.META_PIXEL_ID) { if (META[name]) window.fbq("track", META[name], params); else window.fbq("trackCustom", name, params); }
    } catch (e) { /* המדידה לא עוצרת את האתר */ }
  };
})();
