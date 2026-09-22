import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { Role, User } from "./types";
import { getStore } from "./store";

const cookieName = process.env.SESSION_COOKIE_NAME || "attendance_crm_session";
const secret = process.env.AUTH_SECRET || "development-only-change-me";

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  employeeId: string;
  sessionVersion: number;
};

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}

export function signSession(user: User) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role, employeeId: user.employeeId, sv: user.sessionVersion }, secret, {
    expiresIn: "8h",
  });
}

export function verifySessionToken(token?: string): SessionUser | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret) as Record<string, unknown>;
    if (!payload.sub || !payload.email || !payload.role || !payload.employeeId || typeof payload.sv !== "number") return null;
    return {
      id: String(payload.sub),
      email: String(payload.email),
      role: payload.role as Role,
      employeeId: String(payload.employeeId),
      sessionVersion: payload.sv,
    };
  } catch {
    return null;
  }
}

export async function currentUser() {
  const jar = await cookies();
  const session = verifySessionToken(jar.get(cookieName)?.value);
  if (!session) return null;
  const store = getStore();
  const user = store.users.find((item) => item.id === session.id && item.active);
  return user && user.sessionVersion === session.sessionVersion ? session : null;
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(cookieName);
}

export function createCsrfToken() {
  return crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
}

export async function ensureCsrfCookie() {
  const jar = await cookies();
  const existing = jar.get("attendance_crm_csrf")?.value;
  if (existing) return existing;
  const token = createCsrfToken();
  jar.set("attendance_crm_csrf", token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return token;
}

export async function validateCsrf(request: Request) {
  const jar = await cookies();
  const cookieToken = jar.get("attendance_crm_csrf")?.value;
  const headerToken = request.headers.get("x-csrf-token");
  return Boolean(cookieToken && headerToken && cookieToken === headerToken);
}
