import { NextResponse } from "next/server";
import { currentUser, validateCsrf } from "./auth";
import { can } from "./rbac";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireUser(permission?: string) {
  const user = await currentUser();
  if (!user) return { response: error("Authentication required.", 401) };
  if (permission && !can(user.role, permission)) return { response: error("You are not allowed to perform this action.", 403) };
  return { user };
}

export async function requireProtectedMutation(request: Request, permission?: string) {
  const auth = await requireUser(permission);
  if ("response" in auth) return auth;
  if (!(await validateCsrf(request))) return { response: error("Request verification failed.", 403) };
  return auth;
}
