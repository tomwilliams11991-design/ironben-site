// IRON BEN: נקודת הכניסה של האתר. כל רכיב חי בקובץ משלו תחת js/ ומאותחל כאן.
//   gate.js       השער שנפתח בגלילה, נקודות על הכלים, גחלים
//   walk.js       ההליכה בסדנה: אל ארון העבודות
//   works.js      ארון העבודות: שידת מגירות       lightbox.js  תצוגת תמונה
//   estimate/     ההצעה הראשונית (4 שלבים)       contact.js   וואטסאפ, פרטי קשר, שעון
//   wayfinder.js  המפה: איפה אנחנו בסדנה (מוט ברזל עם תחנות)
//   magnet.js     כפתורים מגנטיים                util.js / supabase.js / data/work.js  שכבת העזר
// כל טעינה מתחילה בשער (בלי # בכתובת): ספארי באייפון זוכר את מקום הגלילה ופותח באמצע הסדנה, והשער לא נראה
if (!location.hash) { history.scrollRestoration = "manual"; scrollTo(0, 0); }
import { initGate } from "./js/gate.js";
import { initWalk } from "./js/walk.js";
import { initWayfinder } from "./js/wayfinder.js";
import { initLightbox } from "./js/lightbox.js";
import { initWorks } from "./js/works.js";
import { initContact } from "./js/contact.js";
import { initMagnets } from "./js/magnet.js";
import { initEstimate } from "./js/estimate/index.js";
import { initFabDodge } from "./js/fab-dodge.js";

initGate();
initWalk();
initWayfinder();
initWorks(initLightbox());
initContact();
initMagnets();
initEstimate();
initFabDodge();
