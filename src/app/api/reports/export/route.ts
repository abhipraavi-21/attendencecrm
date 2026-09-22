import { requireUser } from "@/lib/api";
import { getStore } from "@/lib/store";

export async function GET() {
  const auth = await requireUser("reports:view");
  if ("response" in auth) return auth.response;
  const store = getStore();
  const rows = [
    ["Employee", "Date", "Status", "Worked Hours", "Break Minutes", "Late Minutes", "Overtime Minutes"],
    ...store.attendance.map((item) => {
      const employee = store.employees.find((emp) => emp.id === item.employeeId);
      return [
        employee?.fullName || item.employeeId,
        item.date,
        item.status,
        (item.workedMinutes / 60).toFixed(2),
        String(item.breakMinutes),
        String(item.lateMinutes),
        String(item.overtimeMinutes),
      ];
    }),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="attendance-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
