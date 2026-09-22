import { json, error } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { dashboardFor, getStore } from "@/lib/store";
import { visibleNav } from "@/lib/rbac";

export async function GET() {
  const user = await currentUser();
  if (!user) return error("Authentication required.", 401);
  const store = getStore();
  const employee = store.employees.find((item) => item.id === user.employeeId);
  const notifications = store.notifications.filter((item) => item.userId === user.id);
  return json({ user, employee, nav: visibleNav(user.role), notifications, dashboard: dashboardFor(user.employeeId) });
}
