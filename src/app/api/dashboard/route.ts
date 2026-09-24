import { json, requireUser } from "@/lib/api";
import { dashboardFor, getStore } from "@/lib/store";
import { visibleNav } from "@/lib/rbac";
import { canManageAllPeople, filterDashboardData } from "@/lib/access";

export async function GET() {
  const auth = await requireUser("dashboard:view");
  if ("response" in auth) return auth.response;
  const store = getStore();
  const scoped = filterDashboardData(auth.user.role, auth.user.employeeId, store);
  return json({
    dashboard: dashboardFor(auth.user.employeeId),
    nav: visibleNav(auth.user.role),
    ...scoped,
    auditLogs: canManageAllPeople(auth.user.role) ? store.auditLogs.slice(0, 20) : [],
    settings: {
      companyName: store.settings.companyName,
      timeZone: store.settings.timeZone,
      officeStart: store.settings.officeStart,
      officeEnd: store.settings.officeEnd,
      graceMinutes: store.settings.graceMinutes,
      geofenceEnabled: store.settings.geofenceEnabled,
    },
  });
}
