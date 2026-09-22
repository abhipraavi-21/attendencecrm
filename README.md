# Attendance and Employee Management System

Production-oriented office CRM built with Next.js App Router, TypeScript, Tailwind CSS, server-side authentication, role-based permissions, validated API routes, PostgreSQL/Prisma schema, exports, seed data, and business-rule tests.

## Main Features

- Secure credentials login, logout, forgot/reset/change-password route, signed HTTP-only session cookie, rate limiting for sensitive endpoints, and safe error messages.
- Roles: Super Admin, HR/Admin, Manager, Employee, Accountant.
- Server-side RBAC for dashboard, employees, attendance, leave, projects, tasks, reports, payroll, settings, and audit logs.
- Employee records with profile, employment, department, designation, branch, shift, salary/bank placeholders, status, documents, and archival status.
- Attendance check-in, checkout, breaks, current status, worked hours, break time, overtime, late marks, missed checkout, correction request hooks, verification metadata, CSV export.
- Configurable attendance policy stored in settings: office time, grace, full/half-day minutes, working days, breaks, geofence and IP flags.
- Leave request and approval workflow with overlap prevention and working-day calculation.
- Projects, client work, task tracking, daily work reports, notifications, audit logs, payroll-ready summaries, settings, and health check.
- Responsive corporate dashboard with mobile drawer, desktop sidebar, light/dark theme, tables, cards, forms, empty states, and accessible labels.

## Technology Stack

- Next.js `16.3.5` App Router
- React `19.2.8`
- TypeScript
- Tailwind CSS v4
- Zod validation
- bcryptjs password hashing
- jsonwebtoken signed sessions
- PostgreSQL schema with Prisma
- Node built-in test runner

## Local Installation

```bash
npm install --legacy-peer-deps --no-audit --no-fund
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`.

Seeded development accounts use password `ChangeMeBeforeProduction!123`:

- `admin@example.com`
- `hr@example.com`
- `manager@example.com`
- `employee@example.com`
- `accountant@example.com`

Change these before production.

## Environment Variables

See `.env.example`.

Required for production:

- `DATABASE_URL`
- `AUTH_SECRET`
- `APP_URL`
- `INITIAL_ADMIN_EMAIL`
- `INITIAL_ADMIN_PASSWORD`

Optional:

- SMTP variables for email delivery
- `UPLOAD_MAX_MB`
- `OFFICE_TIME_ZONE`

If SMTP is not configured, the app continues to work; email delivery should be logged as disabled by the production mail adapter.

## Database Setup

The normalized PostgreSQL schema lives in `prisma/schema.prisma`.

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Note: the local development runtime currently uses an in-memory seed store so the app runs immediately. The Prisma CLI install was blocked in this environment by an npm registry resolution issue involving a non-existent `workerd` package version. The schema is ready for managed PostgreSQL once Prisma CLI installs normally.

## Commands

```bash
npm run dev
npm run lint
npm run type-check
npm test
npm run build
npm run start
```

## Default Role Permissions

See `docs/ROLE_PERMISSION_MATRIX.md`.

## Main Workflows

See `docs/WORKFLOWS.md`.

## Deployment

Use Vercel with a managed PostgreSQL database:

1. Set environment variables in Vercel.
2. Run Prisma generate/migrate during deployment or as a release step.
3. Create the first admin from environment variables or a locked production seed command.
4. Configure durable private storage for employee documents and attachments.
5. Configure SMTP for password reset email delivery.
6. Run health check at `/api/health`.

See `docs/DEPLOYMENT_CHECKLIST.md`.

## Backup and Recovery

- Enable managed PostgreSQL automated backups and point-in-time recovery.
- Export audit logs before destructive maintenance.
- Keep migrations reversible where practical.
- Roll back by deploying the previous Vercel build and restoring the last compatible database backup.

## Known Limitations

- Biometric and face recognition are not implemented. The schema and attendance verification metadata leave extension points for future device integrations.
- WhatsApp notifications are documented as a future integration until a real provider API is configured.
- Local file upload storage adapter is documented as future work; production should use private object storage.
- Local data is in-memory for immediate demo use; production should connect Prisma to PostgreSQL.
