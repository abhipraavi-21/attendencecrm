import type { Role } from "./types";

export const permissions = {
  SUPER_ADMIN: ["*"],
  HR_ADMIN: [
    "dashboard:view",
    "employees:manage",
    "attendance:manage",
    "leave:approve",
    "projects:manage",
    "tasks:manage",
    "reports:view",
    "settings:manage",
    "announcements:manage",
  ],
  MANAGER: [
    "dashboard:view",
    "team:view",
    "attendance:team",
    "leave:approve",
    "projects:manage",
    "tasks:manage",
    "daily_reports:review",
    "reports:view",
  ],
  EMPLOYEE: ["dashboard:view", "attendance:self", "leave:request", "tasks:self", "daily_reports:self"],
  ACCOUNTANT: ["dashboard:view", "payroll:view", "reports:view", "attendance:reports"],
} satisfies Record<Role, string[]>;

export function can(role: Role, permission: string) {
  const allowed = permissions[role] ?? [];
  return allowed.includes("*") || allowed.includes(permission);
}

export function visibleNav(role: Role) {
  const items = [
    ["Dashboard", "/", "dashboard:view"],
    ["Attendance", "/attendance", "attendance:manage"],
    ["My Attendance", "/attendance", "attendance:self"],
    ["Team Attendance", "/attendance", "attendance:team"],
    ["Leave", "/leave", "leave:request"],
    ["Employees", "/employees", "employees:manage"],
    ["Departments", "/settings", "settings:manage"],
    ["Projects", "/projects", "projects:manage"],
    ["Tasks", "/tasks", "tasks:self"],
    ["Daily Reports", "/daily-reports", "daily_reports:self"],
    ["Payroll", "/payroll", "payroll:view"],
    ["Performance", "/performance", "reports:view"],
    ["Assets", "/assets", "employees:manage"],
    ["Reports", "/reports", "reports:view"],
    ["Announcements", "/announcements", "announcements:manage"],
    ["Holidays", "/settings", "dashboard:view"],
    ["Audit Logs", "/audit-logs", "settings:manage"],
    ["Settings", "/settings", "settings:manage"],
  ] as const;
  return items.filter((item) => can(role, item[2])).map(([label, href]) => ({ label, href }));
}
