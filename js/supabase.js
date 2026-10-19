// לקוח Supabase אחד לכל העמודים הציבוריים (מפתח anon, סכמה ironben).
// אם ההגדרות חסרות או הספרייה לא נטענה, sb הוא null והאתר ממשיך לעבוד בלי הערכה ובלי שליחה.
export const C = window.IRONBEN_CONFIG || {};

export const sb = (() => {
  try {
    if (!C.SUPABASE_URL || !C.SUPABASE_ANON_KEY || !window.supabase) return null;
    return window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, { db: { schema: C.SCHEMA || "ironben" } });
  } catch { return null; }
})();

/** קריאה לפונקציית SQL (RPC). מחזיר תמיד {data, error} גם כשאין חיבור. */
export async function rpc(name, args) {
  if (!sb) return { data: null, error: new Error("no-client") };
  return sb.rpc(name, args);
}

/** העלאת קובץ ל-bucket. מחזיר את הנתיב, או null אם נכשל. */
export async function upload(bucket, path, body, contentType) {
  if (!sb) return null;
  const r = await sb.storage.from(bucket).upload(path, body, { contentType, upsert: false });
  return r.error ? null : path;
}
