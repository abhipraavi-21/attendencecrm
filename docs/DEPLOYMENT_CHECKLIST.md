# Deployment Checklist

- Create a managed PostgreSQL database.
- Set `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, and initial admin variables.
- Run `npm install`.
- Run `npm run db:generate`.
- Run `npm run db:migrate`.
- Seed the first administrator using a production seed script or admin creation command.
- Configure production file storage for employee documents and private attachments.
- Configure SMTP variables if email delivery is required.
- Verify secure cookies over HTTPS.
- Run `npm run lint`, `npm run type-check`, `npm test`, and `npm run build`.
- Configure backups, point-in-time recovery, and rollback deployment.
- Rotate the fallback development password before production use.
