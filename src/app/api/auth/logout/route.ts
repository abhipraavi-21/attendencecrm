import { json, requireProtectedMutation } from "@/lib/api";
import { clearSessionCookie } from "@/lib/auth";
import { audit } from "@/lib/store";

export async function POST(request: Request) {
  const auth = await requireProtectedMutation(request);
  if ("response" in auth) return auth.response;
  const user = "user" in auth ? auth.user : null;
  await clearSessionCookie();
  if (user) audit(user.id, "LOGOUT", "User", user.id);
  return json({ ok: true });
}
