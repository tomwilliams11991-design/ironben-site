// IRON BEN: נקודת הכניסה של האתר. כל רכיב חי בקובץ משלו תחת js/ ומאותחל כאן.
//   gate.js       השער שנפתח בגלילה, נקודות על הכלים, גחלים
//   walk.js       ההליכה בסדנה: אל ארון העבודות ואל התנור   forge-picks.js  מה אפשר לבדוק (ליד התנור)
//   works.js      ארון העבודות: חוטים עם הדפסות   lightbox.js  תצוגת תמונה
//   estimate/     ההצעה הראשונית (4 שלבים)       contact.js   וואטסאפ, פרטי קשר, שעון
//   wayfinder.js  המפה: איפה אנחנו בסדנה (מוט ברזל עם תחנות)
//   magnet.js     כפתורים מגנטיים                util.js / supabase.js / data/work.js  שכבת העזר
import { initGate } from "./js/gate.js";
import { initWalk } from "./js/walk.js";
import { initWayfinder } from "./js/wayfinder.js";
import { initForgePicks } from "./js/forge-picks.js";
import { initLightbox } from "./js/lightbox.js";
import { initWorks } from "./js/works.js";
import { initContact } from "./js/contact.js";
import { initMagnets } from "./js/magnet.js";
import { initEstimate } from "./js/estimate/index.js";

initGate();
initWalk();
initWayfinder();
initWorks(initLightbox());
initContact();
initMagnets();
initEstimate();
initForgePicks();
