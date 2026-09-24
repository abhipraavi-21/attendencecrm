import { z } from "zod";
import { error, json, requireProtectedMutation } from "@/lib/api";
import { getStore, audit, enforceRateLimit, hashToken } from "@/lib/store";
import { hashPassword, isStrongPassword, verifyPassword } from "@/lib/auth";
import { buildAppUrl, sendPasswordResetEmail } from "@/lib/mail";

const forgotSchema = z.object({ email: z.email() });
const resetSchema = z.object({
  token: z.string().min(32),
  password: z.string().refine(isStrongPassword, "Use at least 12 characters with uppercase, lowercase, number, and symbol."),
});
const changeSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().refine(isStrongPassword, "Use at least 12 characters with uppercase, lowercase, number, and symbol."),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const action = body?.action;
  const store = getStore();

  if (action === "forgot") {
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) return error("Enter a valid email.", 422);
    const normalizedEmail = parsed.data.email.toLowerCase();
    if (!enforceRateLimit(`forgot:${normalizedEmail}`, 3, 60_000)) return error("Too many reset requests. Try again later.", 429);
    const user = store.users.find((item) => item.email.toLowerCase() === normalizedEmail && item.active);
    let developmentResetLink: string | undefined;
    if (user) {
      const token = crypto.randomUUID() + crypto.randomUUID();
      store.resetTokens = store.resetTokens.filter((item) => item.userId !== user.id);
      store.resetTokens.push({ tokenHash: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + 30 * 60_000).toISOString() });
      const resetLink = buildAppUrl(`/reset-password?token=${encodeURIComponent(token)}`);
      const delivery = await sendPasswordResetEmail(user.email, resetLink);
      audit(user.id, "PASSWORD_RESET_REQUESTED", "User", user.id, { delivery: delivery.delivered ? "delivered" : delivery.reason });
      if (process.env.NODE_ENV !== "production" && process.env.ALLOW_DEVELOPMENT_RESET_LINKS === "true") {
        developmentResetLink = resetLink;
      }
    }
    return json({
      ok: true,
      message: "If an active account exists for that email, password reset instructions will be sent.",
      developmentResetLink,
    });
  }

  if (action === "reset") {
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) return error("Invalid reset request.", 422);
    const token = store.resetTokens.find((item) => item.tokenHash === hashToken(parsed.data.token) && new Date(item.expiresAt) > new Date());
    if (!token) return error("Reset link is invalid or expired.", 400);
    const user = store.users.find((item) => item.id === token.userId);
    if (!user) return error("Reset link is invalid or expired.", 400);
    if (!user.active) return error("Reset link is invalid or expired.", 400);
    user.passwordHash = hashPassword(parsed.data.password);
    user.forcePasswordChange = false;
    user.sessionVersion += 1;
    store.resetTokens = store.resetTokens.filter((item) => item.tokenHash !== token.tokenHash);
    audit(user.id, "PASSWORD_RESET_COMPLETED", "User", user.id);
    return json({ ok: true });
  }

  if (action === "change") {
    const auth = await requireProtectedMutation(request);
    if ("response" in auth) return auth.response;
    const parsed = changeSchema.safeParse(body);
    if (!parsed.success) return error("Use at least 12 characters with uppercase, lowercase, number, and symbol.", 422);
    const user = store.users.find((item) => item.id === auth.user.id);
    if (!user || !verifyPassword(parsed.data.currentPassword, user.passwordHash)) return error("Current password is incorrect.", 400);
    user.passwordHash = hashPassword(parsed.data.newPassword);
    user.forcePasswordChange = false;
    user.sessionVersion += 1;
    audit(user.id, "PASSWORD_CHANGED", "User", user.id);
    return json({ ok: true });
  }

  if (action === "logout-all") {
    const auth = await requireProtectedMutation(request);
    if ("response" in auth) return auth.response;
    const user = store.users.find((item) => item.id === auth.user.id);
    if (!user) return error("Authentication required.", 401);
    user.sessionVersion += 1;
    audit(user.id, "LOGOUT_ALL_DEVICES", "User", user.id);
    return json({ ok: true });
  }

  return error("Unknown password action.", 400);
}
