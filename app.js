// IRON BEN: נקודת הכניסה של האתר. כל רכיב חי בקובץ משלו תחת js/ ומאותחל כאן.
//   gate.js       השער שנפתח בגלילה, נקודות על הכלים, גחלים
//   walk.js       ההליכה בסדנה: אל ארון העבודות ואל התנור   price-tags.js  תגי המחיר ליד התנור
//   room.js       חדר העבודות ופריצת התמונות    lightbox.js  תצוגת תמונה
//   estimate/     ההצעה הראשונית (4 שלבים)       contact.js   וואטסאפ, פרטי קשר, שעון
//   magnet.js     כפתורים מגנטיים                util.js / supabase.js / data/work.js  שכבת העזר
import { initGate } from "./js/gate.js";
import { initWalk } from "./js/walk.js";
import { initPriceTags } from "./js/price-tags.js";
import { initLightbox } from "./js/lightbox.js";
import { initRoom } from "./js/room.js";
import { initContact } from "./js/contact.js";
import { initMagnets } from "./js/magnet.js";
import { initEstimate } from "./js/estimate/index.js";

initGate();
initWalk();
initRoom(initLightbox());
initContact();
initMagnets();
initEstimate();
initPriceTags();
