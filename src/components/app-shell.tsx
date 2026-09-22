"use client";

import {
  Activity,
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Play,
  Search,
  Settings,
  ShieldCheck,
  Square,
  Sun,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AttendanceRecord, AuditLog, CompanySettings, DailyReport, Employee, LeaveRequest, Project, Task } from "@/lib/types";

type ApiState = {
  user: { id: string; email: string; role: string; employeeId: string };
  employee: { fullName: string; designation: string; department: string };
  nav: { label: string; href: string }[];
  notifications: { id: string; title: string; body: string; read: boolean }[];
  csrfToken?: string;
  dashboard: {
    totals: Record<string, number>;
    personal: {
      attendance?: { status: string; workedMinutes: number; breakMinutes: number };
      leaveBalance: number;
      payroll: Record<string, number>;
    };
  };
  employees?: Employee[];
  attendance?: AttendanceRecord[];
  leaves?: LeaveRequest[];
  projects?: Project[];
  tasks?: Task[];
  dailyReports?: DailyReport[];
  auditLogs?: AuditLog[];
  settings?: CompanySettings;
};

const iconFor = (label: string): LucideIcon => {
  if (label.includes("Attendance")) return CalendarCheck;
  if (label.includes("Leave") || label.includes("Holidays")) return Clock3;
  if (label.includes("Employee") || label.includes("Departments")) return UsersRound;
  if (label.includes("Project") || label.includes("Task")) return BriefcaseBusiness;
  if (label.includes("Report") || label.includes("Payroll")) return FileText;
  if (label.includes("Audit") || label.includes("Settings")) return Settings;
  return LayoutDashboard;
};

function minutes(value = 0) {
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  return `${hours}h ${mins}m`;
}

export function AppShell() {
  const [data, setData] = useState<ApiState | null>(null);
  const [fullData, setFullData] = useState<ApiState | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function mutationHeaders() {
    return {
      "content-type": "application/json",
      ...(data?.csrfToken ? { "x-csrf-token": data.csrfToken } : {}),
    };
  }

  async function refresh() {
    const me = await fetch("/api/auth/me");
    if (me.ok) {
      const sessionData = await me.json();
      const dashboard = await fetch("/api/dashboard");
      setData(sessionData);
      setFullData(dashboard.ok ? await dashboard.json() : sessionData);
    } else {
      setData(null);
      setFullData(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setMessage("Signing in...");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json();
    if (!response.ok) {
      setMessage(body.error || "Login failed.");
      return;
    }
    setMessage("Signed in.");
    await refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", headers: mutationHeaders() });
    setData(null);
    setFullData(null);
  }

  async function logoutAllDevices() {
    setMessage("Signing out all sessions...");
    await fetch("/api/auth/password", {
      method: "POST",
      headers: mutationHeaders(),
      body: JSON.stringify({ action: "logout-all" }),
    });
    setData(null);
    setFullData(null);
  }

  async function requestPasswordReset() {
    if (!email) {
      setMessage("Enter your email first.");
      return;
    }
    const response = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "forgot", email }),
    });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? "If the account exists, reset instructions have been prepared." : body.error || "Unable to request reset.");
  }

  async function attendance(action: string) {
    setMessage("Updating attendance...");
    const response = await fetch("/api/attendance", {
      method: "POST",
      headers: mutationHeaders(),
      body: JSON.stringify({ action, note: "Submitted from dashboard" }),
    });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? `Attendance ${action} completed.` : body.error || "Attendance action failed.");
    await refresh();
  }

  async function requestLeave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      action: "request",
      type: String(form.get("type")),
      from: String(form.get("from")),
      to: String(form.get("to")),
      halfDay: form.get("halfDay") === "on",
      paid: form.get("paid") === "on",
      reason: String(form.get("reason")),
    };
    const response = await fetch("/api/leave", {
      method: "POST",
      headers: mutationHeaders(),
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Leave request submitted." : body.error || "Leave request failed.");
    await refresh();
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const firstProject = fullData?.projects?.[0];
    const firstTask = fullData?.tasks?.[0];
    const response = await fetch("/api/daily-reports", {
      method: "POST",
      headers: mutationHeaders(),
      body: JSON.stringify({
        date: String(form.get("date")),
        projectId: firstProject?.id || "proj_1",
        taskId: firstTask?.id || "task_1",
        workDescription: String(form.get("workDescription")),
        completed: String(form.get("completed")),
        pending: String(form.get("pending")),
        timeSpentHours: Number(form.get("timeSpentHours")),
        blockers: String(form.get("blockers") || "None"),
        nextPlan: String(form.get("nextPlan")),
      }),
    });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Daily report submitted." : body.error || "Daily report failed.");
    await refresh();
  }

  async function exportCsv() {
    const response = await fetch("/api/reports/export");
    if (!response.ok) {
      setMessage("Export failed.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const employees = useMemo(() => {
    const rows = fullData?.employees || [];
    return rows.filter((item) => `${item.fullName} ${item.department} ${item.designation}`.toLowerCase().includes(query.toLowerCase()));
  }, [fullData, query]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-900">
        <div className="h-24 w-24 animate-pulse rounded-lg border border-slate-200 bg-white" aria-label="Loading" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-dvh overflow-y-auto bg-slate-950 text-white">
        <section className="mx-auto grid min-h-dvh max-w-6xl items-start gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:items-center lg:py-8">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-cyan-300">Production-ready office operations</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">Attendance and Employee Management System</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              Secure role-based attendance, breaks, leave, daily reports, projects, tasks, payroll-ready summaries, audit logs, and exports.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Server-side RBAC", "Validated workflows", "Responsive dashboard"].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                  <ShieldCheck className="mb-3 h-5 w-5 text-cyan-300" aria-hidden />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={login} className="max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-lg border border-white/10 bg-white p-5 text-slate-950 shadow-2xl sm:p-6">
            <h2 className="text-xl font-semibold">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">Enter your office account credentials.</p>
            <label className="mt-4 block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
            <label className="mt-3 block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <div className="mt-2 flex h-10 items-center rounded-md border border-slate-300 focus-within:border-cyan-600 focus-within:ring-2 focus-within:ring-cyan-100">
              <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-full min-w-0 flex-1 rounded-md px-3 outline-none" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="grid h-9 w-10 place-items-center text-slate-500" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            </div>
            <button className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-200">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Sign in securely
            </button>
            <button type="button" onClick={requestPasswordReset} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50">
              <KeyRound className="h-4 w-4" aria-hidden />
              Forgot password
            </button>
            {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
          </form>
        </section>
      </main>
    );
  }

  const totals = fullData?.dashboard?.totals || data.dashboard.totals;
  const personal = fullData?.dashboard?.personal || data.dashboard.personal;
  const activeBreak = fullData?.attendance?.find((item) => item.employeeId === data.user.employeeId && !item.checkOutAt);

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-slate-200 bg-white p-4 transition dark:border-slate-800 dark:bg-slate-900 ${mobileNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex h-12 items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-700 text-white">
            <Activity className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="font-semibold">Attendance CRM</p>
            <p className="text-xs text-slate-500">{data.user.role.replaceAll("_", " ")}</p>
          </div>
        </div>
        <nav className="mt-6 grid gap-1">
          {data.nav.map((item) => {
            const Icon = iconFor(item.label);
            return (
              <a key={item.label} href={item.href} onClick={() => setMobileNav(false)} className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:text-slate-200 dark:hover:bg-slate-800">
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
              </a>
            );
          })}
        </nav>
      </aside>

      <section className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-20 flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:h-16">
          <div className="flex min-w-0 items-center gap-3">
            <button aria-label="Open navigation" onClick={() => setMobileNav(true)} className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 lg:hidden dark:border-slate-700">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">Office command center</h1>
              <p className="truncate text-xs text-slate-500">{data.employee.fullName} · {data.employee.designation}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button aria-label="Toggle theme" onClick={() => setDark(!dark)} className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 dark:border-slate-700">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-md border border-slate-200 dark:border-slate-700">
              <Bell className="h-4 w-4" />
              {data.notifications.some((item) => !item.read) ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" /> : null}
            </button>
            <button onClick={logout} className="flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700">
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Logout</span>
            </button>
            <button onClick={logoutAllDevices} className="hidden h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700 xl:flex">
              <KeyRound className="h-4 w-4" aria-hidden />
              Logout all
            </button>
          </div>
        </header>

        <div className="min-w-0 space-y-6 p-4 sm:p-6">
          {message ? <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-100">{message}</div> : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {([
              ["Employees", totals.employees, UsersRound],
              ["Present today", totals.presentToday, CalendarCheck],
              ["Pending leave", totals.pendingLeave, Clock3],
              ["Overdue tasks", totals.overdueTasks, BriefcaseBusiness],
            ] as Array<[string, number, LucideIcon]>).map(([label, value, Icon]) => (
              <div key={String(label)} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{String(label)}</p>
                  <Icon className="h-4 w-4 text-cyan-700" aria-hidden />
                </div>
                <p className="mt-3 text-3xl font-semibold">{String(value)}</p>
              </div>
            ))}
          </section>

          <section className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Today&apos;s Attendance</h2>
                  <p className="text-sm text-slate-500">Status, worked hours, breaks, late marks, and verification.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => attendance("check-in")} className="flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-medium text-white">
                    <Play className="h-4 w-4" aria-hidden />
                    Check in
                  </button>
                  <button onClick={() => attendance("start-break")} className="flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700">
                    <Clock3 className="h-4 w-4" aria-hidden />
                    Break
                  </button>
                  <button onClick={() => attendance("end-break")} className="flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    End break
                  </button>
                  <button onClick={() => attendance("check-out")} className="flex h-10 items-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-950">
                    <Square className="h-4 w-4" aria-hidden />
                    Check out
                  </button>
                </div>
              </div>
              <div className="mt-4 w-full overflow-x-auto">
                <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      {["Employee", "Status", "Worked", "Break", "Late", "Mode", "Verification"].map((header) => (
                        <th key={header} className="border-b border-slate-200 py-3 font-medium dark:border-slate-800">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(fullData?.attendance || []).map((item) => {
                      const employee = fullData?.employees?.find((emp) => emp.id === item.employeeId);
                      return (
                        <tr key={item.id}>
                          <td className="border-b border-slate-100 py-3 dark:border-slate-800">{employee?.fullName || item.employeeId}</td>
                          <td className="border-b border-slate-100 py-3 dark:border-slate-800"><Badge>{item.status}</Badge></td>
                          <td className="border-b border-slate-100 py-3 dark:border-slate-800">{minutes(item.workedMinutes)}</td>
                          <td className="border-b border-slate-100 py-3 dark:border-slate-800">{minutes(item.breakMinutes)}</td>
                          <td className="border-b border-slate-100 py-3 dark:border-slate-800">{minutes(item.lateMinutes)}</td>
                          <td className="border-b border-slate-100 py-3 dark:border-slate-800">{item.mode}</td>
                          <td className="border-b border-slate-100 py-3 dark:border-slate-800">{item.verificationStatus}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="min-w-0 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-semibold">My Status</h2>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div className="flex justify-between"><dt className="text-slate-500">Attendance</dt><dd>{personal.attendance?.status || "Not checked in"}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Worked</dt><dd>{minutes(personal.attendance?.workedMinutes)}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Break</dt><dd>{minutes(personal.attendance?.breakMinutes)}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Leave balance</dt><dd>{personal.leaveBalance} days</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Active record</dt><dd>{activeBreak ? "Checked in" : "Closed"}</dd></div>
                </dl>
              </div>
              <button onClick={exportCsv} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white">
                <Download className="h-4 w-4" aria-hidden />
                Export attendance CSV
              </button>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Panel title="Employees" description="Search, filter, and review active employee records. Salary and bank fields stay server-restricted.">
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employees" className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {employees.map((item) => (
                  <div key={item.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-cyan-50 text-sm font-semibold text-cyan-800" aria-hidden>
                        {item.fullName.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium">{item.fullName}</p>
                        <p className="text-xs text-slate-500">{item.employeeCode} · {item.department}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">{item.designation} · {item.branch}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Leave Request" description="Requests prevent overlapping ranges and calculate working days.">
              <form onSubmit={requestLeave} className="grid gap-3 sm:grid-cols-2">
                <input name="type" defaultValue="Casual Leave" className="field" aria-label="Leave type" />
                <label className="flex items-center gap-2 text-sm"><input name="paid" type="checkbox" defaultChecked /> Paid leave</label>
                <input name="from" type="date" required className="field" aria-label="From date" />
                <input name="to" type="date" required className="field" aria-label="To date" />
                <label className="flex items-center gap-2 text-sm"><input name="halfDay" type="checkbox" /> Half day</label>
                <input name="reason" required placeholder="Reason" className="field sm:col-span-2" />
                <button className="h-10 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white sm:col-span-2">Submit leave request</button>
              </form>
              <div className="mt-4 grid gap-2">
                {(fullData?.leaves || []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
                    <span>{item.type} · {item.days} day(s)</span>
                    <Badge>{item.status}</Badge>
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Panel title="Projects and Tasks" description="Real seeded client work, project progress, overdue detection, priorities, and task status.">
              <div className="space-y-3">
                {(fullData?.projects || []).map((project) => (
                  <div key={project.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-xs text-slate-500">{project.client} · {project.technology}</p>
                      </div>
                      <Badge>{project.status}</Badge>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-2 rounded-full bg-cyan-700" style={{ width: `${project.progress}%` }} /></div>
                  </div>
                ))}
                {(fullData?.tasks || []).map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
                    <span>{task.title}</span>
                    <Badge>{task.priority}</Badge>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Daily Work Report" description="Employees submit one report per day with project, task, links, blockers, and next plan.">
              <form onSubmit={submitReport} className="grid gap-3">
                <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="field" aria-label="Report date" />
                <textarea name="workDescription" required placeholder="Work description" className="field min-h-24 py-2" />
                <input name="completed" required placeholder="Completed work" className="field" />
                <input name="pending" required placeholder="Pending work" className="field" />
                <input name="timeSpentHours" type="number" min="0" max="24" step="0.5" defaultValue="7" className="field" aria-label="Time spent hours" />
                <input name="blockers" placeholder="Blockers" className="field" />
                <input name="nextPlan" required placeholder="Plan for next working day" className="field" />
                <button className="h-10 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white">Submit daily report</button>
              </form>
            </Panel>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <Panel title="Payroll Ready" description="Calculated from attendance and leave data.">
              <dl className="grid gap-3 text-sm">
                {Object.entries(personal.payroll).map(([key, value]) => (
                  <div key={key} className="flex justify-between"><dt className="capitalize text-slate-500">{key.replace(/([A-Z])/g, " $1")}</dt><dd>{String(value)}</dd></div>
                ))}
              </dl>
            </Panel>
            <Panel title="Settings" description="Attendance policy, geofence, IP restriction, and reporting defaults.">
              <dl className="grid gap-3 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Time zone</dt><dd>{fullData?.settings?.timeZone}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Office hours</dt><dd>{fullData?.settings?.officeStart} - {fullData?.settings?.officeEnd}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Grace</dt><dd>{fullData?.settings?.graceMinutes}m</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Geofence</dt><dd>{fullData?.settings?.geofenceEnabled ? "Enabled" : "Disabled"}</dd></div>
              </dl>
            </Panel>
            <Panel title="Audit Logs" description="Important actions are append-only for authorized roles.">
              <div className="space-y-2">
                {(fullData?.auditLogs || []).slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-md border border-slate-200 p-2 text-xs dark:border-slate-800">
                    <p className="font-medium">{item.action}</p>
                    <p className="text-slate-500">{item.entity} · {new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                ))}
                {!(fullData?.auditLogs || []).length ? <p className="text-sm text-slate-500">No audit events yet.</p> : null}
              </div>
            </Panel>
          </section>
        </div>
      </section>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex min-h-6 items-center rounded-md bg-slate-100 px-2 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">{children}</span>;
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
