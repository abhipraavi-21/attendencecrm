import { json } from "@/lib/api";
import { clearSessionCookie, currentUser } from "@/lib/auth";
import { audit } from "@/lib/store";

export async function POST() {
  const user = await currentUser();
  await clearSessionCookie();
  if (user) audit(user.id, "LOGOUT", "User", user.id);
  return json({ ok: true });
}
