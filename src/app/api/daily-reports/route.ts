import { z } from "zod";
import { error, json, requireProtectedMutation } from "@/lib/api";
import { audit, getStore } from "@/lib/store";
import type { DailyReport } from "@/lib/types";

const schema = z.object({
  projectId: z.string(),
  taskId: z.string(),
  date: z.string(),
  workDescription: z.string().min(10),
  completed: z.string().min(2),
  pending: z.string().min(1),
  timeSpentHours: z.number().min(0).max(24),
  blockers: z.string().max(500).default("None"),
  link: z.string().optional(),
  nextPlan: z.string().min(3),
});

export async function POST(request: Request) {
  const auth = await requireProtectedMutation(request, "daily_reports:self");
  if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return error("Daily report is incomplete.", 422);
  const store = getStore();
  const duplicate = store.dailyReports.find((item) => item.employeeId === auth.user.employeeId && item.date === parsed.data.date);
  if (duplicate) return error("A report already exists for this date.", 409);
  const report: DailyReport = {
    id: `report_${Math.random().toString(36).slice(2, 10)}`,
    employeeId: auth.user.employeeId,
    status: "SUBMITTED",
    ...parsed.data,
  };
  store.dailyReports.unshift(report);
  audit(auth.user.id, "DAILY_REPORT_SUBMITTED", "DailyReport", report.id, report);
  return json(report);
}
