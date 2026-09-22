import { z } from "zod";
import { error, json, requireProtectedMutation } from "@/lib/api";
import { audit, getStore, recomputeAttendance } from "@/lib/store";
import type { AttendanceRecord, BreakRecord } from "@/lib/types";

const schema = z.object({
  action: z.enum(["check-in", "check-out", "start-break", "end-break", "manual-entry", "correction-request"]),
  employeeId: z.string().optional(),
  mode: z.enum(["WEB", "WFH", "FIELD"]).optional(),
  note: z.string().max(500).optional(),
});

const today = () => new Date().toISOString().slice(0, 10);
const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export async function POST(request: Request) {
  const auth = await requireProtectedMutation(request);
  if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return error("Invalid attendance action.", 422);
  const store = getStore();
  const employeeId = parsed.data.employeeId || auth.user.employeeId;
  const canManage = ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"].includes(auth.user.role);
  if (employeeId !== auth.user.employeeId && !canManage) return error("You can only manage your own attendance.", 403);

  const open = store.attendance.find((item) => item.employeeId === employeeId && !item.checkOutAt);
  if (parsed.data.action === "check-in") {
    if (open) return error("You already have an active check-in.", 409);
    const record: AttendanceRecord = {
      id: id("att"),
      employeeId,
      date: today(),
      mode: parsed.data.mode || "WEB",
      checkInAt: new Date().toISOString(),
      workedMinutes: 0,
      breakMinutes: 0,
      overtimeMinutes: 0,
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
      status: "MISSED_CHECKOUT",
      verificationStatus: "VERIFIED",
      deviceInfo: request.headers.get("user-agent") || "Unknown device",
      ipAddress: request.headers.get("x-forwarded-for") || "local",
      approvalHistory: [],
    };
    store.attendance.push(record);
    audit(auth.user.id, "ATTENDANCE_CHECK_IN", "Attendance", record.id, record);
    return json(record);
  }

  if (!open && ["check-out", "start-break", "end-break"].includes(parsed.data.action)) {
    return error("No active attendance record found.", 409);
  }

  if (parsed.data.action === "check-out" && open) {
    const activeBreak = store.breaks.find((item) => item.attendanceId === open.id && !item.endAt);
    if (activeBreak) activeBreak.endAt = new Date().toISOString();
    open.checkOutAt = new Date().toISOString();
    recomputeAttendance(open);
    audit(auth.user.id, "ATTENDANCE_CHECK_OUT", "Attendance", open.id, open);
    return json(open);
  }

  if (parsed.data.action === "start-break" && open) {
    const activeBreak = store.breaks.find((item) => item.attendanceId === open.id && !item.endAt);
    if (activeBreak) return error("A break is already active.", 409);
    if (!store.settings.allowMultipleBreaks && store.breaks.some((item) => item.attendanceId === open.id)) {
      return error("Multiple breaks are disabled by policy.", 409);
    }
    const breakRecord: BreakRecord = {
      id: id("break"),
      attendanceId: open.id,
      employeeId,
      startAt: new Date().toISOString(),
      reason: parsed.data.note || "Break",
    };
    store.breaks.push(breakRecord);
    audit(auth.user.id, "BREAK_STARTED", "Break", breakRecord.id, breakRecord);
    return json(breakRecord);
  }

  if (parsed.data.action === "end-break" && open) {
    const activeBreak = store.breaks.find((item) => item.attendanceId === open.id && !item.endAt);
    if (!activeBreak) return error("No active break found.", 409);
    activeBreak.endAt = new Date().toISOString();
    recomputeAttendance(open);
    audit(auth.user.id, "BREAK_ENDED", "Break", activeBreak.id, activeBreak);
    return json(activeBreak);
  }

  if (parsed.data.action === "correction-request") {
    const record = store.attendance.find((item) => item.employeeId === employeeId && item.date === today());
    if (!record) return error("No attendance record available for correction.", 404);
    record.approvalHistory.push(`Correction requested by ${auth.user.email}: ${parsed.data.note || "No note"}`);
    audit(auth.user.id, "ATTENDANCE_CORRECTION_REQUESTED", "Attendance", record.id, record);
    return json(record);
  }

  return error("Unsupported action.", 400);
}
