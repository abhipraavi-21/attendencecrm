import { json } from "@/lib/api";
import { getStore } from "@/lib/store";

export async function GET() {
  const store = getStore();
  return json({ ok: true, service: "attendance-crm", employees: store.employees.length, time: new Date().toISOString() });
}
