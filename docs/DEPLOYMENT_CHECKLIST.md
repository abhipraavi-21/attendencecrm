# Deployment Checklist

- Create a managed PostgreSQL database.
- Set `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, and initial admin variables.
- Run `npm install`.
- Run `npm run db:generate`.
- Run `npm run db:migrate`.
- Seed the first administrator using a production seed script or admin creation command.
- Configure production file storage for employee documents and private attachments.
- Configure `EMAIL_FROM`, `PASSWORD_RESET_EMAIL_WEBHOOK_URL`, and optional `PASSWORD_RESET_EMAIL_WEBHOOK_SECRET` for password reset email delivery.
- Verify secure cookies over HTTPS.
- Run `npm run lint`, `npm run type-check`, `npm test`, and `npm run build`.
- Configure backups, point-in-time recovery, and rollback deployment.
- Ensure `ALLOW_DEVELOPMENT_SEED_USERS` is unset or false in production.
- Ensure `ALLOW_DEVELOPMENT_RESET_LINKS` is unset or false in production.
- Confirm no real credentials are committed in tracked files.
