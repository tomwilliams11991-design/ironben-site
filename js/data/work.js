// תיק העבודות: הקטגוריות (דלתות) והתמונות. נתונים בלבד, בלי לוגיקה.
// להוספת עבודה: לשים את התמונה ב-site/img/2k, להריץ node tools/images/resize.mjs, ולהוסיף שורה ל-WORK.

/** קטגוריה = דלת על הקיר. cover: התמונה שרואים דרך הפתח. */
export const DOORS = [
  { key: "stairs", label: "גרמי מדרגות", cover: "stairs-floating-black", desc: "מדרגות מרחפות על קורה מרכזית, ספירלה, או גרם קלאסי עם מדרכי עץ מלא. כולל מעקה לפי התקן." },
  { key: "gates", label: "שערים ומעקות", cover: "gate-estate", desc: "שערי כניסה וחניה, שערים בחיתוך לייזר, מעקות למרפסות ולמדרגות, וסורגים שנראים כמו עיצוב." },
  { key: "outdoor", label: "פרגולות וחוץ", cover: "pergola-stone", desc: "פרגולות וסככות ברזל ועץ, מטבחי חוץ עם חזיתות עץ, מנגלים ומעשנות שמחזיקים עשרות שנים." },
  { key: "interior", label: "פנים ורהיטים", cover: "library-ladder", desc: "ספריות עם סולם, קירות טלוויזיה, מדפים ושולחנות מעץ מלא על רגלי ברזל. לפי מידות הקיר והחלל." },
  { key: "business", label: "עסקים ומשרדים", cover: "office-plant-wall", desc: "מחיצות עם אדניות, דלפקים וברים, ריהוט לחנויות, שלטי קורטן ומתקנים לרכב. לפי תוכנית." },
];

/** [שם קובץ, כיתוב, קטגוריה] */
export const WORK = [
  ["stairs-floating-black", "מדרגות מרחפות על קורה מרכזית", "stairs"], ["stairs-spiral-wood", "ספירלה עם מדרכי עץ", "stairs"], ["stairs-wood-rail", "מדרגות עץ ומעקה ברזל", "stairs"], ["stairs-spiral-white", "מדרגות ספירלה לבנות", "stairs"], ["stairs-exterior", "מדרגות חוץ מרחפות", "stairs"],
  ["gate-estate", "שער כניסה לאחוזה, רמת השרון", "gates"], ["rs-stairs-curve", "מעקה מחושל לגרם מעוגל, רמת השרון", "gates"], ["rs-volute", "הגלילה בתחתית המעקה", "gates"], ["rs-balusters", "מוטות מפותלים ומאחז יד מחושל", "gates"], ["rs-tiles", "מעקה המדרגות מלמעלה", "gates"], ["rs-entrance", "מעקות הכניסה הראשית", "gates"], ["rs-estate-night", "השער בלילה", "gates"], ["rs-lattice-gates", "שערי סבכה בקיר לבנים", "gates"], ["rs-estate-day", "השער והגדר מהרחוב", "gates"], ["gate-wood-slats", "שער נגרר עם רפפות עץ", "gates"], ["gate-leaf", "שער עלים בחיתוך לייזר", "gates"], ["railing-white", "מעקה מרפסת לבן", "gates"], ["gate-fence", "שער וגדר", "gates"], ["window-bars", "סורגים מעוצבים", "gates"], ["balcony-house", "מעקה מרפסת לבית", "gates"], ["facade-slats", "חיפוי רפפות לחזית", "gates"],
  ["outdoor-kitchen-night", "מטבח חוץ, חזיתות עץ", "outdoor"], ["pergola-stone", "פרגולת ברזל ועץ לבית אבן", "outdoor"], ["carport-house", "סככת חניה ברזל ועץ", "outdoor"], ["outdoor-kitchen-pergola", "מטבח חוץ ופרגולה", "outdoor"], ["bbq", "מנגל עם מגירת עץ", "outdoor"], ["pergola-bbq", "פרגולה עם פינת מנגל", "outdoor"], ["pergolas-garden", "פרגולות לגינה", "outdoor"], ["smoker", "מעשנה מברזל", "outdoor"], ["carport", "סככת חניה", "outdoor"],
  ["library-ladder", "ספריה עם סולם ברזל", "interior"], ["table-chevron", "שולחן אוכל על רגלי ברזל", "interior"], ["tv-wall", "קיר טלוויזיה ממדפי ברזל", "interior"], ["live-edge-table", "שולחן גזע טבעי", "interior"], ["library-white", "קיר ספריה לבן", "interior"], ["table-industrial", "שולחן בסגנון תעשייתי", "interior"], ["glass-table", "שולחן זכוכית על ברזל", "interior"], ["tv-stand", "שידת טלוויזיה", "interior"], ["tv-white-shelves", "מדפים לבנים לסלון", "interior"],
  ["office-plant-wall", "מחיצת צמחים במשרד", "business"], ["barber-shop", "ריהוט למספרה", "business"], ["sign-netofa", "שלט קורטן ליקב נטופה", "business"], ["deli-shop", "ריהוט לחנות מעדנים", "business"], ["coffee-cart-front", "עגלת קפה, gulis.cafe", "business"], ["kiosk-bar", "עגלת קפה: הדלפק והגגונים", "business"], ["coffee-cart-counter", "עגלת קפה: בר ישיבה מעץ", "business"], ["coffee-cart-seating", "עגלת קפה: דק ופינת ישיבה", "business"], ["coffee-cart-welding", "עגלת קפה: ריתוך השלד בסדנה", "business"], ["coffee-cart-frame", "עגלת קפה: השלד המגולוון", "business"], ["coffee-cart-container", "עגלת קפה מפח מכולה ועץ, פתוחה 360°", "business"], ["coffee-cart-container-closed", "עגלת המכולה סגורה, על נגרר", "business"], ["coffee-cart-container-inside", "עגלת המכולה: דלפקי נירוסטה", "business"], ["truck-rack", "מתקן לטנדר", "business"],
];

/** העבודות של קטגוריה אחת. */
export const worksOf = (key) => WORK.filter((w) => w[2] === key);
