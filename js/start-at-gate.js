// נטען מוקדם ב-<head> של index.html (סינכרוני), לפני שספארי משחזר גלילה. קובץ נפרד ולא בתוך הדף, בגלל מדיניות האבטחה (CSP).
/* כל כניסה מתחילה בשער סגור (בלי # בכתובת). ספארי באייפון זוכר את מקום הגלילה, ובחזרה ללשונית (למשל מוואטסאפ)
   מציג את הדף כמו שהושאר. לכן: בלי שחזור גלילה, חזרה לראש הדף בטעינה ובחזרה מהמטמון, ושוב אחרי load
   (ספארי לפעמים משחזר מאוחר), רק אם הגולש עוד לא התחיל לגלול בעצמו. */
(function () {
  if (location.hash) return;
  try { history.scrollRestoration = "manual"; } catch (e) {}
  var touched = false, top = function () { if (!touched) scrollTo(0, 0); };
  ["touchstart", "pointerdown", "wheel", "keydown", "mousedown", "hashchange"].forEach(function (t) { addEventListener(t, function () { touched = true; }, { once: true, passive: true }); });
  top();
  /* ספארי באייפון משחזר את הגלילה גם מאוחר (אחרי load, ובטאב שנטען מחדש מהזיכרון). כל גלילה שקורית
     בשלוש השניות הראשונות לפני שהגולש נגע במסך היא שחזור, לא הגולש: חוזרים לשער */
  var until = Date.now() + 3000;
  addEventListener("scroll", function () { if (!touched && Date.now() < until && scrollY > 0) scrollTo(0, 0); }, { passive: true });
  addEventListener("load", function () { until = Date.now() + 3000; top(); setTimeout(top, 60); setTimeout(top, 400); });
  addEventListener("pageshow", function (e) { if (e.persisted) { touched = false; until = Date.now() + 3000; scrollTo(0, 0); } });
})();
