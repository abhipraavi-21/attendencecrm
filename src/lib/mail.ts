type PasswordResetDelivery =
  | { delivered: true }
  | { delivered: false; reason: "not_configured" | "provider_error" };

export function buildAppUrl(path: string) {
  const configured = process.env.APP_URL?.replace(/\/$/, "");
  const baseUrl = configured || (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<PasswordResetDelivery> {
  const webhookUrl = process.env.PASSWORD_RESET_EMAIL_WEBHOOK_URL;
  if (!webhookUrl) return { delivered: false, reason: "not_configured" };

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (process.env.PASSWORD_RESET_EMAIL_WEBHOOK_SECRET) {
    headers.authorization = `Bearer ${process.env.PASSWORD_RESET_EMAIL_WEBHOOK_SECRET}`;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        to: email,
        from: process.env.EMAIL_FROM,
        subject: "Reset your Attendance CRM password",
        resetLink,
      }),
    });
    return response.ok ? { delivered: true } : { delivered: false, reason: "provider_error" };
  } catch {
    return { delivered: false, reason: "provider_error" };
  }
}
