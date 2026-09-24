import type { AttendanceRecord, DailyReport, Employee, LeaveRequest, Project, Role, Task } from "./types";

export type PublicEmployee = Pick<
  Employee,
  "id" | "employeeCode" | "fullName" | "workEmail" | "department" | "designation" | "managerId" | "branch" | "shift" | "status" | "photoUrl" | "createdAt" | "updatedAt"
>;

export function canManageAllPeople(role: Role) {
  return role === "SUPER_ADMIN" || role === "HR_ADMIN";
}

export function canViewFinancialData(role: Role) {
  return role === "SUPER_ADMIN" || role === "HR_ADMIN" || role === "ACCOUNTANT";
}

export function employeeIdsForRole(role: Role, currentEmployeeId: string, employees: Employee[]) {
  if (canManageAllPeople(role) || role === "ACCOUNTANT") return new Set(employees.map((item) => item.id));
  if (role === "MANAGER") {
    return new Set([currentEmployeeId, ...employees.filter((item) => item.managerId === currentEmployeeId).map((item) => item.id)]);
  }
  return new Set([currentEmployeeId]);
}

export function canAccessEmployee(role: Role, currentEmployeeId: string, targetEmployeeId: string, employees: Employee[]) {
  return employeeIdsForRole(role, currentEmployeeId, employees).has(targetEmployeeId);
}

export function publicEmployee(employee: Employee): PublicEmployee {
  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    workEmail: employee.workEmail,
    department: employee.department,
    designation: employee.designation,
    managerId: employee.managerId,
    branch: employee.branch,
    shift: employee.shift,
    status: employee.status,
    photoUrl: employee.photoUrl,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}

export function filterDashboardData(
  role: Role,
  currentEmployeeId: string,
  data: {
    employees: Employee[];
    attendance: AttendanceRecord[];
    leaves: LeaveRequest[];
    projects: Project[];
    tasks: Task[];
    dailyReports: DailyReport[];
  },
) {
  const allowedEmployees = employeeIdsForRole(role, currentEmployeeId, data.employees);
  const visibleProjectIds = new Set(
    data.projects
      .filter((item) => item.managerId === currentEmployeeId || item.members.some((memberId) => allowedEmployees.has(memberId)))
      .map((item) => item.id),
  );

  return {
    employees: data.employees.filter((item) => allowedEmployees.has(item.id)).map(publicEmployee),
    attendance: data.attendance.filter((item) => allowedEmployees.has(item.employeeId)),
    leaves: data.leaves.filter((item) => allowedEmployees.has(item.employeeId)),
    projects: canManageAllPeople(role) || role === "ACCOUNTANT" ? data.projects : data.projects.filter((item) => visibleProjectIds.has(item.id)),
    tasks:
      canManageAllPeople(role) || role === "ACCOUNTANT"
        ? data.tasks
        : data.tasks.filter((item) => item.assigneeIds.some((employeeId) => allowedEmployees.has(employeeId)) || visibleProjectIds.has(item.projectId)),
    dailyReports: data.dailyReports.filter((item) => allowedEmployees.has(item.employeeId)),
  };
}
