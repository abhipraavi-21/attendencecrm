import { z } from "zod";
import { error, json, requireUser } from "@/lib/api";
import { getStore, audit, enforceRateLimit } from "@/lib/store";
import { hashPassword, verifyPassword } from "@/lib/auth";

const forgotSchema = z.object({ email: z.email() });
const resetSchema = z.object({ token: z.string().min(10), password: z.string().min(12) });
const changeSchema = z.object({ currentPassword: z.string().min(8), newPassword: z.string().min(12) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const action = body?.action;
  const store = getStore();

  if (action === "forgot") {
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) return error("Enter a valid email.", 422);
    if (!enforceRateLimit(`forgot:${parsed.data.email}`, 3, 60_000)) return error("Too many reset requests.", 429);
    const user = store.users.find((item) => item.email === parsed.data.email);
    if (user) {
      const token = crypto.randomUUID() + crypto.randomUUID();
      store.resetTokens.push({ token, userId: user.id, expiresAt: new Date(Date.now() + 30 * 60_000).toISOString() });
      audit(user.id, "PASSWORD_RESET_REQUESTED", "User", user.id);
      return json({ ok: true, developmentResetToken: process.env.NODE_ENV === "production" ? undefined : token });
    }
    return json({ ok: true });
  }

  if (action === "reset") {
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) return error("Invalid reset request.", 422);
    const token = store.resetTokens.find((item) => item.token === parsed.data.token && new Date(item.expiresAt) > new Date());
    if (!token) return error("Reset link is invalid or expired.", 400);
    const user = store.users.find((item) => item.id === token.userId);
    if (!user) return error("Reset link is invalid or expired.", 400);
    user.passwordHash = hashPassword(parsed.data.password);
    user.forcePasswordChange = false;
    store.resetTokens = store.resetTokens.filter((item) => item.token !== token.token);
    audit(user.id, "PASSWORD_RESET_COMPLETED", "User", user.id);
    return json({ ok: true });
  }

  if (action === "change") {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    const parsed = changeSchema.safeParse(body);
    if (!parsed.success) return error("New password must be at least 12 characters.", 422);
    const user = store.users.find((item) => item.id === auth.user.id);
    if (!user || !verifyPassword(parsed.data.currentPassword, user.passwordHash)) return error("Current password is incorrect.", 400);
    user.passwordHash = hashPassword(parsed.data.newPassword);
    user.forcePasswordChange = false;
    audit(user.id, "PASSWORD_CHANGED", "User", user.id);
    return json({ ok: true });
  }

  return error("Unknown password action.", 400);
}
