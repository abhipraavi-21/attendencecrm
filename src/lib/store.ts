import { hashPassword } from "./auth";
import { createHash } from "crypto";
import { calculateAttendance as calculateAttendanceRaw, calculateLeaveDays, payrollSummary } from "./business-rules";
import type {
  AttendanceRecord,
  AuditLog,
  BreakRecord,
  CompanySettings,
  DailyReport,
  Employee,
  LeaveRequest,
  Notification,
  Project,
  Task,
  User,
} from "./types";

type Store = {
  users: User[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  breaks: BreakRecord[];
  leaves: LeaveRequest[];
  projects: Project[];
  tasks: Task[];
  dailyReports: DailyReport[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  settings: CompanySettings;
  resetTokens: { tokenHash: string; userId: string; expiresAt: string }[];
  rateLimits: Map<string, { count: number; resetAt: number }>;
};

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const calculateAttendance = calculateAttendanceRaw as (input: {
  checkInAt: string;
  checkOutAt?: string;
  breaks: BreakRecord[];
  policy: CompanySettings;
}) => Pick<AttendanceRecord, "workedMinutes" | "breakMinutes" | "overtimeMinutes" | "lateMinutes" | "earlyDepartureMinutes" | "status">;

function employee(
  index: number,
  fullName: string,
  department: string,
  designation: string,
  branch = "Ahmedabad HQ",
): Employee {
  const code = `EMP-${String(index).padStart(4, "0")}`;
  return {
    id: `emp_${index}`,
    employeeCode: code,
    fullName,
    workEmail: `${fullName.toLowerCase().replaceAll(" ", ".")}@example.com`,
    personalEmail: `${fullName.toLowerCase().replaceAll(" ", ".")}@mail.com`,
    phone: `+91 90000 10${String(index).padStart(2, "0")}`,
    emergencyContact: "+91 90000 11999",
    dob: "1993-04-12",
    gender: index % 2 ? "Female" : "Male",
    address: "Corporate Park, SG Highway, Ahmedabad",
    department,
    designation,
    managerId: index > 3 ? "emp_3" : undefined,
    employmentType: "Full-time",
    joiningDate: `2024-0${Math.min(index, 9)}-10`,
    branch,
    shift: "General Shift",
    salaryAnnual: 420000 + index * 60000,
    bankAccountLast4: String(1000 + index),
    status: index === 8 ? "PROBATION" : "ACTIVE",
    notes: "Seeded employee record with restricted salary and bank fields.",
    documents: ["appointment-letter.pdf", "id-proof.pdf"],
    photoUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
    createdAt: now(),
    updatedAt: now(),
  };
}

function createInitialStore(): Store {
  const settings: CompanySettings = {
    companyName: "OfficeWorks Attendance CRM",
    address: "Corporate Park, Ahmedabad, Gujarat",
    timeZone: process.env.OFFICE_TIME_ZONE || "Asia/Kolkata",
    currency: "INR",
    officeStart: "09:30",
    officeEnd: "18:30",
    graceMinutes: 10,
    fullDayMinutes: 480,
    halfDayMinutes: 240,
    maxBreakMinutes: 60,
    allowMultipleBreaks: true,
    workingDays: [1, 2, 3, 4, 5],
    geofenceEnabled: false,
    officeLatitude: 23.0225,
    officeLongitude: 72.5714,
    geofenceRadiusMeters: 150,
    ipRestrictionEnabled: false,
    allowedIpRanges: ["127.0.0.1", "::1"],
  };

  const employees = [
    employee(1, "Aarav Shah", "Leadership", "Super Admin"),
    employee(2, "Meera Patel", "Human Resources", "HR Manager"),
    employee(3, "Rohan Mehta", "Engineering", "Project Manager"),
    employee(4, "Nisha Rao", "Engineering", "Frontend Developer"),
    employee(5, "Dev Singh", "Engineering", "Backend Developer"),
    employee(6, "Kavya Iyer", "Design", "UI Designer"),
    employee(7, "Imran Khan", "Finance", "Accountant"),
    employee(8, "Priya Desai", "QA", "QA Engineer"),
  ];

  const users: User[] = [];
  if (process.env.INITIAL_ADMIN_EMAIL && process.env.INITIAL_ADMIN_PASSWORD) {
    users.push({
      id: "user_initial_admin",
      email: process.env.INITIAL_ADMIN_EMAIL,
      passwordHash: hashPassword(process.env.INITIAL_ADMIN_PASSWORD),
      role: "SUPER_ADMIN",
      employeeId: "emp_1",
      active: true,
      forcePasswordChange: true,
      failedLoginCount: 0,
      sessionVersion: 1,
      createdAt: now(),
    });
  }

  if (process.env.NODE_ENV !== "production" && process.env.ALLOW_DEVELOPMENT_SEED_USERS === "true" && process.env.DEVELOPMENT_SEED_PASSWORD) {
    const seedUsers: Array<[string, string, User["role"], string]> = [
      ["user_dev_admin", "local-admin@attendance.test", "SUPER_ADMIN", "emp_1"],
      ["user_dev_hr", "local-hr@attendance.test", "HR_ADMIN", "emp_2"],
      ["user_dev_manager", "local-manager@attendance.test", "MANAGER", "emp_3"],
      ["user_dev_employee", "local-employee@attendance.test", "EMPLOYEE", "emp_4"],
      ["user_dev_accountant", "local-accountant@attendance.test", "ACCOUNTANT", "emp_7"],
    ];
    users.push(
      ...seedUsers.map(([userId, email, role, employeeId]) => ({
        id: userId,
        email,
        passwordHash: hashPassword(process.env.DEVELOPMENT_SEED_PASSWORD as string),
        role,
        employeeId,
        active: true,
        forcePasswordChange: true,
        failedLoginCount: 0,
        sessionVersion: 1,
        createdAt: now(),
      })),
    );
  }

  const attendance: AttendanceRecord[] = employees.slice(0, 6).map((item, index) => {
    const checkIn = new Date();
    checkIn.setHours(9, 25 + index * 4, 0, 0);
    const checkOut = new Date();
    checkOut.setHours(18, 35 - index, 0, 0);
    const computed = calculateAttendance({
      checkInAt: checkIn.toISOString(),
      checkOutAt: checkOut.toISOString(),
      breaks: [] as BreakRecord[],
      policy: settings,
    }) as Pick<
      AttendanceRecord,
      "workedMinutes" | "breakMinutes" | "overtimeMinutes" | "lateMinutes" | "earlyDepartureMinutes" | "status"
    >;
    return {
      id: `att_${index + 1}`,
      employeeId: item.id,
      date: today(),
      mode: index === 4 ? "WFH" : "WEB",
      checkInAt: checkIn.toISOString(),
      checkOutAt: checkOut.toISOString(),
      ...computed,
      verificationStatus: "VERIFIED",
      deviceInfo: "Chrome on Windows",
      ipAddress: "127.0.0.1",
      approvalHistory: [],
    };
  });

  const projects: Project[] = [
    {
      id: "proj_1",
      code: "WEB-24",
      name: "Corporate Website Rebuild",
      client: "Nimbus Digital",
      managerId: "emp_3",
      members: ["emp_3", "emp_4", "emp_6"],
      status: "IN_PROGRESS",
      priority: "HIGH",
      progress: 68,
      deadline: "2026-10-15",
      technology: "Next.js, PostgreSQL",
      stagingLink: "https://staging.example.com",
      productionLink: "https://example.com",
    },
    {
      id: "proj_2",
      code: "CRM-12",
      name: "Internal Attendance CRM",
      client: "Internal",
      managerId: "emp_3",
      members: ["emp_3", "emp_5", "emp_8"],
      status: "UNDER_REVIEW",
      priority: "URGENT",
      progress: 82,
      deadline: "2026-09-30",
      technology: "Next.js, Prisma",
    },
  ];

  const tasks: Task[] = [
    {
      id: "task_1",
      title: "Build attendance correction workflow",
      projectId: "proj_2",
      client: "Internal",
      assigneeIds: ["emp_5"],
      dueDate: "2026-09-28",
      priority: "HIGH",
      estimatedHours: 12,
      actualHours: 7,
      status: "IN_PROGRESS",
      checklist: [
        { title: "Validation", done: true },
        { title: "Approval history", done: false },
      ],
      comments: ["Use server-side authorization for manager approval."],
    },
    {
      id: "task_2",
      title: "Finalize dashboard mobile layouts",
      projectId: "proj_1",
      client: "Nimbus Digital",
      assigneeIds: ["emp_4", "emp_6"],
      dueDate: "2026-09-24",
      priority: "MEDIUM",
      estimatedHours: 8,
      actualHours: 5,
      status: "UNDER_REVIEW",
      checklist: [{ title: "360px smoke test", done: true }],
      comments: [],
    },
  ];

  const leaves: LeaveRequest[] = [
    {
      id: "leave_1",
      employeeId: "emp_4",
      type: "Sick Leave",
      from: "2026-09-25",
      to: "2026-09-25",
      days: 1,
      halfDay: false,
      reason: "Medical appointment",
      status: "PENDING_MANAGER",
      paid: true,
      approverComments: [],
      createdAt: now(),
    },
  ];

  const dailyReports: DailyReport[] = [
    {
      id: "report_1",
      employeeId: "emp_4",
      date: today(),
      projectId: "proj_1",
      taskId: "task_2",
      workDescription: "Completed responsive fixes and reviewed accessibility states.",
      completed: "Mobile navigation and table overflow handling",
      pending: "Manager review",
      status: "SUBMITTED",
      timeSpentHours: 7,
      blockers: "None",
      link: "https://github.com/example/pull/42",
      nextPlan: "Polish empty states and export controls.",
    },
  ];

  return {
    users,
    employees,
    attendance,
    breaks: [],
    leaves,
    projects,
    tasks,
    dailyReports,
    notifications: users.map((user) => ({
      id: id("notif"),
      userId: user.id,
      title: "Welcome to Attendance CRM",
      body: "Review your dashboard, attendance, leave, tasks, and reports.",
      read: false,
      createdAt: now(),
    })),
    auditLogs: [],
    settings,
    resetTokens: [],
    rateLimits: new Map(),
  };
}

const globalForStore = globalThis as typeof globalThis & { attendanceCrmStore?: Store };

export function getStore() {
  if (!globalForStore.attendanceCrmStore) globalForStore.attendanceCrmStore = createInitialStore();
  return globalForStore.attendanceCrmStore;
}

export function audit(userId: string, action: string, entity: string, entityId: string, after?: unknown, before?: unknown) {
  getStore().auditLogs.unshift({ id: id("audit"), userId, action, entity, entityId, before, after, createdAt: now() });
}

export function enforceRateLimit(key: string, max = 8, windowMs = 60_000) {
  const store = getStore();
  const current = store.rateLimits.get(key);
  const time = Date.now();
  if (!current || current.resetAt <= time) {
    store.rateLimits.set(key, { count: 1, resetAt: time + windowMs });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  return true;
}

export function dashboardFor(employeeId: string) {
  const store = getStore();
  const todayKey = today();
  const todayAttendance = store.attendance.filter((item) => item.date === todayKey);
  const employeeAttendance = store.attendance.filter((item) => item.employeeId === employeeId);
  const employeeLeaves = store.leaves.filter((item) => item.employeeId === employeeId);
  return {
    totals: {
      employees: store.employees.filter((item) => item.status !== "ARCHIVED").length,
      presentToday: todayAttendance.filter((item) => item.status === "PRESENT").length,
      absentToday: Math.max(0, store.employees.length - todayAttendance.length),
      lateToday: todayAttendance.filter((item) => item.lateMinutes > 0).length,
      onLeave: store.leaves.filter((item) => item.status.includes("PENDING") || item.status === "APPROVED").length,
      pendingLeave: store.leaves.filter((item) => item.status.includes("PENDING")).length,
      activeProjects: store.projects.filter((item) => ["IN_PROGRESS", "UNDER_REVIEW"].includes(item.status)).length,
      overdueTasks: store.tasks.filter((item) => new Date(item.dueDate) < new Date() && item.status !== "COMPLETED").length,
      missingReports: Math.max(0, store.employees.length - store.dailyReports.filter((item) => item.date === todayKey).length),
    },
    personal: {
      attendance: employeeAttendance.at(-1),
      leaveBalance: 14 - employeeLeaves.filter((item) => item.status === "APPROVED").reduce((sum, item) => sum + item.days, 0),
      tasks: store.tasks.filter((item) => item.assigneeIds.includes(employeeId)),
      reports: store.dailyReports.filter((item) => item.employeeId === employeeId),
      payroll: payrollSummary(employeeAttendance, employeeLeaves),
    },
  };
}

export function requestLeave(employeeId: string, input: Pick<LeaveRequest, "type" | "from" | "to" | "halfDay" | "reason" | "paid">) {
  const store = getStore();
  const overlaps = store.leaves.some(
    (leave) =>
      leave.employeeId === employeeId &&
      !["REJECTED", "CANCELLED"].includes(leave.status) &&
      new Date(input.from) <= new Date(leave.to) &&
      new Date(input.to) >= new Date(leave.from),
  );
  if (overlaps) throw new Error("Leave request overlaps an existing active request.");
  const days = calculateLeaveDays({ from: input.from, to: input.to, halfDay: input.halfDay });
  if (days <= 0) throw new Error("Leave request must include at least one working day.");
  const leave: LeaveRequest = {
    id: id("leave"),
    employeeId,
    type: input.type,
    from: input.from,
    to: input.to,
    halfDay: input.halfDay,
    reason: input.reason,
    paid: input.paid,
    days,
    status: "PENDING_MANAGER",
    approverComments: [],
    createdAt: now(),
  };
  store.leaves.unshift(leave);
  return leave;
}

export function recomputeAttendance(record: AttendanceRecord) {
  const store = getStore();
  const relatedBreaks: BreakRecord[] = store.breaks.filter((item) => item.attendanceId === record.id);
  const computed = calculateAttendance({
    checkInAt: record.checkInAt,
    checkOutAt: record.checkOutAt,
    breaks: relatedBreaks,
    policy: store.settings,
  }) as Pick<
    AttendanceRecord,
    "workedMinutes" | "breakMinutes" | "overtimeMinutes" | "lateMinutes" | "earlyDepartureMinutes" | "status"
  >;
  Object.assign(record, computed);
  return record;
}
