export type Role = "SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "EMPLOYEE" | "ACCOUNTANT";

export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "PROBATION" | "NOTICE_PERIOD" | "RESIGNED" | "ARCHIVED";
export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "HALF_DAY"
  | "WORK_FROM_HOME"
  | "FIELD_WORK"
  | "HOLIDAY"
  | "WEEKLY_OFF"
  | "PAID_LEAVE"
  | "UNPAID_LEAVE"
  | "MISSED_CHECKOUT";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  employeeId: string;
  active: boolean;
  forcePasswordChange: boolean;
  failedLoginCount: number;
  lockedUntil?: string;
  sessionVersion: number;
  createdAt: string;
};

export type Employee = {
  id: string;
  employeeCode: string;
  fullName: string;
  workEmail: string;
  personalEmail: string;
  phone: string;
  emergencyContact: string;
  dob: string;
  gender: string;
  address: string;
  department: string;
  designation: string;
  managerId?: string;
  employmentType: string;
  joiningDate: string;
  branch: string;
  shift: string;
  salaryAnnual: number;
  bankAccountLast4: string;
  status: EmployeeStatus;
  lastWorkingDate?: string;
  notes: string;
  documents: string[];
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  date: string;
  mode: "WEB" | "WFH" | "FIELD";
  checkInAt: string;
  checkOutAt?: string;
  workedMinutes: number;
  breakMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  status: AttendanceStatus;
  verificationStatus: "PENDING" | "VERIFIED" | "FLAGGED";
  deviceInfo?: string;
  ipAddress?: string;
  latitude?: number;
  longitude?: number;
  approvalHistory: string[];
};

export type BreakRecord = {
  id: string;
  attendanceId: string;
  employeeId: string;
  startAt: string;
  endAt?: string;
  reason: string;
};

export type LeaveRequest = {
  id: string;
  employeeId: string;
  type: string;
  from: string;
  to: string;
  days: number;
  halfDay: boolean;
  reason: string;
  attachment?: string;
  status: "PENDING_MANAGER" | "PENDING_HR" | "APPROVED" | "REJECTED" | "CANCELLED";
  paid: boolean;
  approverComments: string[];
  createdAt: string;
};

export type Project = {
  id: string;
  code: string;
  name: string;
  client: string;
  managerId: string;
  members: string[];
  status: "PLANNED" | "IN_PROGRESS" | "ON_HOLD" | "UNDER_REVIEW" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  progress: number;
  deadline: string;
  technology: string;
  stagingLink?: string;
  productionLink?: string;
};

export type Task = {
  id: string;
  title: string;
  projectId: string;
  client: string;
  assigneeIds: string[];
  dueDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedHours: number;
  actualHours: number;
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "UNDER_REVIEW" | "COMPLETED" | "CANCELLED";
  checklist: { title: string; done: boolean }[];
  comments: string[];
};

export type DailyReport = {
  id: string;
  employeeId: string;
  date: string;
  projectId: string;
  taskId: string;
  workDescription: string;
  completed: string;
  pending: string;
  status: "DRAFT" | "SUBMITTED" | "REVIEWED";
  timeSpentHours: number;
  blockers: string;
  link?: string;
  nextPlan: string;
  managerComment?: string;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  createdAt: string;
};

export type CompanySettings = {
  companyName: string;
  address: string;
  timeZone: string;
  currency: string;
  officeStart: string;
  officeEnd: string;
  graceMinutes: number;
  fullDayMinutes: number;
  halfDayMinutes: number;
  maxBreakMinutes: number;
  allowMultipleBreaks: boolean;
  workingDays: number[];
  geofenceEnabled: boolean;
  officeLatitude: number;
  officeLongitude: number;
  geofenceRadiusMeters: number;
  ipRestrictionEnabled: boolean;
  allowedIpRanges: string[];
};
