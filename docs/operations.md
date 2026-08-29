# Operations Guide

## Configuration

The application fails fast when required configuration is absent or unsafe.

| Variable              | Required | Meaning                                                           |
| --------------------- | -------: | ----------------------------------------------------------------- |
| `NODE_ENV`            |       No | `development`, `test`, or `production`; defaults to `development` |
| `DB_HOST`             |       No | MySQL host; defaults to `127.0.0.1`                               |
| `DB_PORT`             |       No | MySQL port; defaults to `3306`                                    |
| `DB_USER`             |      Yes | Least-privileged application user                                 |
| `DB_PASSWORD`         |      Yes | Application password; never commit it                             |
| `DB_NAME`             |      Yes | Database identifier using letters, numbers, and underscores       |
| `DB_CONNECTION_LIMIT` |       No | Pool size from 1 to 50; defaults to 10                            |

In production, supply these values through the deployment platform's secret manager. Do not bake `.env` into an image.

## Database lifecycle

Run migrations before every release:

```bash
pnpm db:health
pnpm db:migrate
pnpm smoke
```

Migrations execute in filename order under a MySQL advisory lock. The runner records a SHA-256 checksum. Never edit a migration after it has been applied; add a new numbered migration.

The demonstration seed is deterministic but should not be used to overwrite real workforce data. Production environments normally run migrations without `pnpm db:seed`.

## Backup and restore

Create an encrypted, access-controlled backup before schema changes:

```bash
mysqldump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --password \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_NAME" | gzip > "workforce-$(date +%Y%m%d-%H%M%S).sql.gz"
```

Restore into a new database first, validate it, and only then change application configuration:

```bash
gunzip --stdout workforce-backup.sql.gz | mysql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --password \
  restored_employee_manager
```

Test the restore procedure periodically. A backup that has never been restored is unproven.

## Release and rollback

1. Confirm CI and CodeQL are green.
2. Back up the target database.
3. Deploy the new immutable image or build.
4. Run `node dist/admin.js migrate`.
5. Run `node dist/admin.js health` and `node dist/admin.js smoke` when production data is expected.
6. Open the CLI and verify the organization summary and one joined employee view.

Application rollback is safe when the previous version understands the current schema. A destructive schema rollback requires a reviewed forward-fix migration or a validated backup restore; do not manually edit `schema_migrations`.

## Credential rotation

1. Create or update the least-privileged MySQL account.
2. Update the deployment secret without committing it.
3. restart the application and run the health check.
4. Revoke the old credential after successful verification.

The application user requires `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `ALTER`, `INDEX`, `REFERENCES`, and advisory-lock access for its own database when it runs migrations. Separate runtime and migration accounts may be used in stricter environments.

## Incident checklist

1. Stop writes if integrity may be affected.
2. Preserve logs and a database backup.
3. Reproduce with non-sensitive data.
4. Check migration checksums, foreign-key failures, pool exhaustion, and recent dependency changes.
5. Rotate credentials immediately if exposure is suspected.
6. Use private vulnerability reporting for security issues.
7. Record the fix, verification evidence, and prevention follow-up.

## Troubleshooting

- **Connection refused:** Confirm MySQL is healthy and `DB_HOST` is reachable from the application environment.
- **Access denied:** Verify the application user, password, host grant, and database privileges.
- **Migration checksum mismatch:** Restore the committed migration file; create a new migration for the intended change.
- **Deletion blocked:** Reassign dependent roles, employees, or direct reports before retrying.
- **Management cycle rejected:** Choose a manager who is not already below the employee in the reporting chain.
