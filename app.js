// IRON BEN: נקודת הכניסה של האתר. כל רכיב חי בקובץ משלו תחת js/ ומאותחל כאן.
//   gate.js       השער שנפתח בגלילה, נקודות על הכלים, גחלים
//   walk.js       ההליכה בסדנה: אל ארון העבודות
//   works.js      ארון העבודות: שידת מגירות       lightbox.js  תצוגת תמונה
//   estimate/     ההצעה הראשונית (4 שלבים)       contact.js   וואטסאפ, פרטי קשר, שעון
//   wayfinder.js  המפה: איפה אנחנו בסדנה (מוט ברזל עם תחנות)
//   magnet.js     כפתורים מגנטיים                util.js / supabase.js / data/work.js  שכבת העזר
// (החזרה לשער בכל כניסה נמצאת בראש index.html, כדי שתרוץ לפני שספארי משחזר גלילה)
import { initGate } from "./js/gate.js?v=1db38d4";
import { initWalk } from "./js/walk.js?v=1db38d4";
import { initWayfinder } from "./js/wayfinder.js?v=1db38d4";
import { initLightbox } from "./js/lightbox.js?v=1db38d4";
import { initWorks } from "./js/works.js?v=1db38d4";
import { initContact } from "./js/contact.js?v=1db38d4";
import { initMagnets } from "./js/magnet.js?v=1db38d4";
import { initEstimate } from "./js/estimate/index.js?v=1db38d4";
import { initFabDodge } from "./js/fab-dodge.js?v=1db38d4";

initGate();
initWalk();
initWayfinder();
initWorks(initLightbox());
initContact();
initMagnets();
initEstimate();
initFabDodge();
