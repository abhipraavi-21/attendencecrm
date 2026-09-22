import { z } from "zod";
import { json, error } from "@/lib/api";
import { enforceRateLimit, getStore, audit } from "@/lib/store";
import { setSessionCookie, signSession, verifyPassword } from "@/lib/auth";

const schema = z.object({ email: z.email(), password: z.string().min(8) });

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!enforceRateLimit(`login:${ip}`, 8, 60_000)) return error("Too many login attempts. Try again in a minute.", 429);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return error("Enter a valid email and password.", 422);
  const store = getStore();
  const user = store.users.find((item) => item.email.toLowerCase() === parsed.data.email.toLowerCase());
  if (!user || !user.active || !verifyPassword(parsed.data.password, user.passwordHash)) {
    audit(user?.id || "anonymous", "LOGIN_FAILED", "User", user?.id || parsed.data.email, { ip });
    return error("Invalid credentials.", 401);
  }
  await setSessionCookie(signSession(user));
  audit(user.id, "LOGIN_SUCCESS", "User", user.id, { ip });
  return json({ user: { id: user.id, email: user.email, role: user.role, employeeId: user.employeeId } });
}
