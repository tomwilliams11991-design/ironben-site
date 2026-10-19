// IRON BEN: ממשק הניהול, נקודת הכניסה. כל מסך בקובץ משלו תחת js/:
//   lib.js       לקוח, מצב משותף (A), פורמטים, תוויות      auth.js      כניסה בקישור למייל
//   nav.js       ניווט צד                                   leads.js     לידים
//   builder.js   בונה הצעות                                 quotes.js    הצעות
//   products.js  מוצרים ותאימות תמחור                       steel.js     מחיר הברזל
//   mail/        תור פניות, תבניות, לוג, הסרה, שליחה        settings.js  הגדרות ומנהלים
import { $, sb, initDialog } from "./js/lib.js";
import { signIn } from "./js/auth.js";
import { initNav } from "./js/nav.js";
import { initLeads, loadLeads } from "./js/leads.js";
import { initBuilder, renderBuilder } from "./js/builder.js";
import { initQuotes, loadQuotes } from "./js/quotes.js";
import { initProducts, loadProducts } from "./js/products.js";
import { initSteel, loadSteel } from "./js/steel.js";
import { initMail, loadMail } from "./js/mail/index.js";
import { initSettings, loadSettings } from "./js/settings.js";

async function boot() {
  if (!sb) { document.body.innerHTML = '<p style="padding:40px">חסרים SUPABASE_URL ו-SUPABASE_ANON_KEY בקובץ config.js.</p>'; return; }
  if (!(await signIn())) return;
  initDialog();
  initLeads(); initBuilder(); initQuotes(); initProducts(); initSteel(); initMail(); initSettings();
  initNav({ leads: loadLeads, builder: renderBuilder, quotes: loadQuotes, products: loadProducts, steel: loadSteel, mail: loadMail, settings: loadSettings });
  loadLeads();
}

boot();
