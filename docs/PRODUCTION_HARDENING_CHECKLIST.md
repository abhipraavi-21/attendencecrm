# Production Hardening Checklist

## Repository Audit

- No prefilled frontend email or password values.
- No browser-visible seeded account list.
- `.env.example` contains variable names only.
- Development seed users require `ALLOW_DEVELOPMENT_SEED_USERS=true` and `DEVELOPMENT_SEED_PASSWORD`.
- Production initial admin requires environment-provided credentials.

## Authentication

- Passwords are hashed with bcrypt.
- Session cookies are HTTP-only, SameSite=Lax, secure in production, and expire after 8 hours.
- Session tokens carry a `sessionVersion`; password change, password reset, and logout-all-devices revoke older sessions.
- Login attempts are rate-limited by source key.
- Five failed account logins create a 15-minute temporary lockout.
- Login, logout, reset, and failed-login activity is audit logged.
- Protected mutations require a CSRF header matching the CSRF cookie.

## Backup-Safe Migration Plan

1. Take a managed PostgreSQL snapshot or point-in-time recovery marker.
2. Run Prisma migration in staging with copied production-like data.
3. Verify foreign keys, unique constraints, attendance calculations, leave balance transactions, and payroll summaries.
4. Deploy code with migrations as a release step.
5. Run smoke tests for login, attendance, leave, reports, exports, and health check.
6. Keep the previous deployment available for rollback.
7. If rollback is required, restore the previous app build and the last compatible database snapshot.

## External Integrations

- SMTP credentials are required for real email delivery.
- Private object storage is required for production employee documents and attachments.
- WhatsApp and biometric integrations remain future adapters until real provider credentials and devices are configured.
