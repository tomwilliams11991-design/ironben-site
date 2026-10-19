// IRON BEN: נקודת הכניסה של האתר. כל רכיב חי בקובץ משלו תחת js/ ומאותחל כאן.
//   gate.js       השער שנפתח בגלילה, נקודות על הכלים, גחלים
//   doors.js      קיר הדלתות ופריצת התמונות     lightbox.js  תצוגת תמונה
//   estimate/     ההצעה הראשונית (4 שלבים)       contact.js   וואטסאפ, פרטי קשר, שעון
//   magnet.js     כפתורים מגנטיים                util.js / supabase.js / data/work.js  שכבת העזר
import { initGate } from "./js/gate.js";
import { initLightbox } from "./js/lightbox.js";
import { initDoors } from "./js/doors.js";
import { initContact } from "./js/contact.js";
import { initMagnets } from "./js/magnet.js";
import { initEstimate } from "./js/estimate/index.js";

initGate();
initDoors(initLightbox());
initContact();
initMagnets();
initEstimate();
