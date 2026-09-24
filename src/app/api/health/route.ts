import { json } from "@/lib/api";

export async function GET() {
  const required = process.env.NODE_ENV === "production" ? ["AUTH_SECRET", "APP_URL", "DATABASE_URL"] : ["AUTH_SECRET"];
  const missing = required.filter((key) => !process.env[key]);
  const emailConfigured = Boolean(process.env.PASSWORD_RESET_EMAIL_WEBHOOK_URL);
  return json({
    ok: missing.length === 0,
    service: "attendance-crm",
    environment: process.env.NODE_ENV,
    checks: {
      requiredEnvironment: missing.length === 0 ? "ok" : "missing",
      passwordResetEmail: emailConfigured ? "configured" : "not_configured",
    },
    missing,
    time: new Date().toISOString(),
  }, missing.length ? 503 : 200);
}
