import { json, requireUser } from "@/lib/api";
import { dashboardFor, getStore } from "@/lib/store";
import { visibleNav } from "@/lib/rbac";

export async function GET() {
  const auth = await requireUser("dashboard:view");
  if ("response" in auth) return auth.response;
  const store = getStore();
  return json({
    dashboard: dashboardFor(auth.user.employeeId),
    nav: visibleNav(auth.user.role),
    employees: store.employees,
    attendance: store.attendance,
    leaves: store.leaves,
    projects: store.projects,
    tasks: store.tasks,
    dailyReports: store.dailyReports,
    auditLogs: store.auditLogs.slice(0, 20),
    settings: store.settings,
  });
}
