// IRON BEN: הגדרות האתר. הנתונים כאן ציבוריים (מפתח anon), הסודות נמצאים ב-Vault של Supabase.
window.IRONBEN_CONFIG = {
  SUPABASE_URL: "https://fqgktyokknxxxpfounbv.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZ2t0eW9ra254eHhwZm91bmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5OTcwNDMsImV4cCI6MjEwNDU3MzA0M30.XfWwsIir9QhzBULeL-VUVDQD19CbMxmAdDLlIvzemPk",
  SCHEMA: "ironben",            // הכל בסכמה נפרדת
  FUNCTIONS_PREFIX: "ironben-", // שמות הפונקציות: ironben-send-quote וכו'
  BUCKET_PHOTOS: "ironben-lead-photos",
  BUCKET_RENDERS: "ironben-renders",

  // מספר וואטסאפ בפורמט בינלאומי בלי + ובלי 0 בהתחלה. לדוגמה: 972501234567
  WHATSAPP: "972549788277",
  PHONE_DISPLAY: "054-978-8277",
  EMAIL: "",                 // לדוגמה: hello@ironben.co.il

  INSTAGRAM: "https://www.instagram.com/ironben.eindor",
  FACEBOOK: "",
  ADDRESS: "בית עובד, ליד נס ציונה",

  // מדידה. ריק = לא נטען כלום. GA4: מזהה שמתחיל ב-G-. Meta Pixel: מספר מהמנהל העסקי.
  GA_ID: "",
  META_PIXEL_ID: "",

  // רכז/ת נגישות (מופיע בהצהרת הנגישות). ריק = משתמש בטלפון ובמייל למעלה.
  A11Y_CONTACT_NAME: "",
  A11Y_STATEMENT_DATE: "אוקטובר 2026"
};
