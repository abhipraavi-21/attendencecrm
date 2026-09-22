# Database Schema Notes

The Prisma schema in `prisma/schema.prisma` is normalized for PostgreSQL and includes users, employees, organization structure, attendance, breaks, corrections, leave, projects, tasks, reports, payroll summaries, reviews, assets, announcements, attachments, notifications, audit logs, and settings.

Important design choices:

- Important business records use archival/status fields instead of destructive deletes.
- Salary and payroll amounts use `Decimal`, not floating-point numbers.
- Attendance has a unique employee/date constraint to prevent duplicates.
- Daily reports have a unique employee/date constraint to enforce one report per day.
- Leave balances are scoped by employee, leave type, and year.
- Audit logs are append-only business records.
- Sensitive updates such as leave approval and payroll locking should run inside Prisma transactions in production.
