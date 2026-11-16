// כניסה: קישור קסם במייל (OTP). מחזיר true אם יש מנהל מחובר שמופיע ב-admins, אחרת מציג את טופס הכניסה.
import { $, sb, A, esc, say } from "./lib.js";

/** טופס קישור הכניסה. */
function showLogin() {
  $("login").hidden = false;
  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const r = await sb.auth.signInWithOtp({ email: $("lemail").value.trim().toLowerCase(), options: { emailRedirectTo: location.href.split("#")[0], shouldCreateUser: false } });
    say($("lmsg"), r.error ? "שליחת הקישור נכשלה: " + r.error.message : "נשלח קישור כניסה למייל. פתחו אותו באותו דפדפן.", !r.error);
  });
}

/**
 * מאמת את המשתמש. settings נקרא רק למנהלים (RLS), ולכן שורה ריקה = לא ברשימת המנהלים.
 * @returns {Promise<boolean>} האם אפשר להציג את האפליקציה
 */
export async function signIn() {
  A.sess = (await sb.auth.getSession()).data.session;
  if (!A.sess) { showLogin(); return false; }
  A.S = (await sb.from("settings").select("*").eq("id", 1).maybeSingle()).data;
  if (!A.S) {
    document.body.innerHTML = `<p style="padding:40px">המייל ${esc(A.sess.user.email)} לא ברשימת המנהלים. מנהל קיים מוסיף אותו בהגדרות, או דרך SQL: insert into ironben.admins(email) values ('${esc(A.sess.user.email)}');</p>`;
    return false;
  }
  $("app").hidden = false;
  $("who").textContent = A.sess.user.email;
  $("logout").onclick = async () => { await sb.auth.signOut(); location.reload(); };
  return true;
}
