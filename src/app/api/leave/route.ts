import { z } from "zod";
import { error, json, requireProtectedMutation } from "@/lib/api";
import { audit, getStore, requestLeave } from "@/lib/store";

const schema = z.object({
  action: z.enum(["request", "approve", "reject", "cancel"]),
  id: z.string().optional(),
  type: z.string().min(2).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  halfDay: z.boolean().optional(),
  reason: z.string().min(3).max(500).optional(),
  paid: z.boolean().optional(),
  comment: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const auth = await requireProtectedMutation(request);
  if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return error("Invalid leave request.", 422);
  const store = getStore();

  if (parsed.data.action === "request") {
    if (!parsed.data.type || !parsed.data.from || !parsed.data.to || !parsed.data.reason) return error("Leave details are incomplete.", 422);
    try {
      const leave = requestLeave(auth.user.employeeId, {
        type: parsed.data.type,
        from: parsed.data.from,
        to: parsed.data.to,
        halfDay: Boolean(parsed.data.halfDay),
        reason: parsed.data.reason,
        paid: parsed.data.paid ?? true,
      });
      audit(auth.user.id, "LEAVE_REQUESTED", "LeaveRequest", leave.id, leave);
      return json(leave);
    } catch (err) {
      return error(err instanceof Error ? err.message : "Unable to create leave request.", 400);
    }
  }

  const leave = store.leaves.find((item) => item.id === parsed.data.id);
  if (!leave) return error("Leave request not found.", 404);
  const isApprover = ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"].includes(auth.user.role);
  if (!isApprover && leave.employeeId !== auth.user.employeeId) return error("You cannot update this leave request.", 403);
  const before = { ...leave };
  if (parsed.data.action === "approve") {
    if (!isApprover) return error("Only managers or HR can approve leave.", 403);
    leave.status = auth.user.role === "MANAGER" ? "PENDING_HR" : "APPROVED";
  }
  if (parsed.data.action === "reject") {
    if (!isApprover) return error("Only managers or HR can reject leave.", 403);
    leave.status = "REJECTED";
  }
  if (parsed.data.action === "cancel") leave.status = "CANCELLED";
  leave.approverComments.push(`${auth.user.email}: ${parsed.data.comment || parsed.data.action}`);
  audit(auth.user.id, `LEAVE_${parsed.data.action.toUpperCase()}`, "LeaveRequest", leave.id, leave, before);
  return json(leave);
}
