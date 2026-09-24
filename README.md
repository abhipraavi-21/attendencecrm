# Attendance and Employee Management System

Production-oriented office CRM built with Next.js App Router, TypeScript, Tailwind CSS, server-side authentication, role-based permissions, validated API routes, PostgreSQL/Prisma schema, exports, seed data, and business-rule tests.

## Main Features

- Secure credentials login, logout, logout-all-devices, forgot/reset/change-password route, signed HTTP-only session cookie, login lockout, CSRF-checked mutations, rate limiting for sensitive endpoints, and safe error messages.
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

No default login credentials are committed or shown in the browser. Create the first administrator with `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`.

Development-only seed users are created only when `ALLOW_DEVELOPMENT_SEED_USERS=true` and `DEVELOPMENT_SEED_PASSWORD` is set locally. Never enable development seed users in production.

## Environment Variables

See `.env.example`.

Required for production:

- `DATABASE_URL`
- `AUTH_SECRET`
- `APP_URL`
- `INITIAL_ADMIN_EMAIL`
- `INITIAL_ADMIN_PASSWORD`
- `AUTH_SECRET`
- `PASSWORD_RESET_EMAIL_WEBHOOK_URL`

Optional:

- `PASSWORD_RESET_EMAIL_WEBHOOK_SECRET`
- SMTP variables for a future direct SMTP adapter
- `UPLOAD_MAX_MB`
- `OFFICE_TIME_ZONE`
- `ALLOW_DEVELOPMENT_SEED_USERS`
- `DEVELOPMENT_SEED_PASSWORD`
- `ALLOW_DEVELOPMENT_RESET_LINKS` for local development only

Password reset email is delivered by posting to `PASSWORD_RESET_EMAIL_WEBHOOK_URL`. If it is not configured, reset requests still return a generic response but no email is sent. In local development only, `ALLOW_DEVELOPMENT_RESET_LINKS=true` returns a reset link in the browser for testing.

## Database Setup

The normalized PostgreSQL schema lives in `prisma/schema.prisma`.

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Note: the local development runtime currently uses an in-memory store. Production should connect Prisma to PostgreSQL and run the schema migrations before launch.

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
5. Configure `PASSWORD_RESET_EMAIL_WEBHOOK_URL` for password reset email delivery.
6. Run health check at `/api/health`.

See `docs/DEPLOYMENT_CHECKLIST.md`.

## Backup and Recovery

- Enable managed PostgreSQL automated backups and point-in-time recovery.
- Export audit logs before destructive maintenance.
- Keep migrations reversible where practical.
- Roll back by deploying the previous Vercel build and restoring the last compatible database backup.

## Initial Administrator Setup

Set `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`, and a strong `AUTH_SECRET` in the target environment before first boot. The first admin is forced to change password after creation. Do not store production credentials in Git.

## Vercel Deployment Steps

1. Create or connect a Vercel project to this repository.
2. Provision a managed PostgreSQL database and set `DATABASE_URL`.
3. Set `APP_URL` to the production URL, for example `https://attendencecrm.vercel.app`.
4. Set a strong `AUTH_SECRET` of at least 32 characters.
5. Set `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` only in the target environment.
6. Set `EMAIL_FROM`, `PASSWORD_RESET_EMAIL_WEBHOOK_URL`, and optionally `PASSWORD_RESET_EMAIL_WEBHOOK_SECRET`.
7. Keep `ALLOW_DEVELOPMENT_SEED_USERS` and `ALLOW_DEVELOPMENT_RESET_LINKS` disabled in production.
8. Run `npm run db:generate` and `npm run db:migrate` during release.
9. Deploy, then verify `/api/health`.

## Known Limitations

- Biometric and face recognition are not implemented. The schema and attendance verification metadata leave extension points for future device integrations.
- WhatsApp notifications are documented as a future integration until a real provider API is configured.
- Local file upload storage adapter is documented as future work; production should use private object storage.
- Local data is in-memory for development use; production should connect Prisma to PostgreSQL.
