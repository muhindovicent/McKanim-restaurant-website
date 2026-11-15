# Neon staging database — first persistent migration approval gate

**Status 15 November 2026:** Schema validated on temporary Neon branches. No DineSight application tables have been installed on the default staging branch. This is an operational procedure, not authorization to apply the migration.

## Verified resources
- Neon project: `dinesight-staging` in `aws-eu-central-1`
- Default branch: `staging` (originally provider-named `production`; name corrected to reflect actual use)
- Database: `neondb`, containing existing `neon_auth` internal tables but **no DineSight public tables**
- Preview migration validation branches: `mcp-migration-2026-11-15T19-28-17` and `mcp-migration-2026-11-15T19-28-32`. These are temporary validation artifacts, **not** the authoritative staging database. Clean up using provider-approved migration completion/discard after explicit owner approval.

## Preview verification results
- 13 application tables created under `public`
- Partial unique index for one active session per dining table exists
- Partial unique index for one outstanding owner invitation per email/restaurant exists
- Positive UGX menu price check and positive branch entitlement check exist
- Prisma migration tracking table `_prisma_migrations` is **absent** on the preview branches because SQL was applied outside Prisma
- Default `staging` branch was not modified by the validation

## Critical migration rule
Do **not** use the Neon console's prepared SQL migration **Apply** for this initial DineSight schema. Applying SQL directly would create database objects without populating Prisma's migration history. Later `prisma migrate deploy` would attempt to reapply the same `0_init` migration and may fail. The prepared SQL previews should be **discarded**, after explicit authorization, instead of promoted to the default branch.

The reviewed source of truth is:
- `backend/prisma/migrations/0_init/migration.sql`
- `backend/prisma/migrations/migration_lock.toml`
- `backend/package-lock.json`

## Authorized installation procedure (not yet performed)
1. Confirm the target Neon project and branch are exclusively for DineSight staging (no production customer data).
2. Create a dedicated migration-capable PostgreSQL credential, stored in protected service/automation settings, never GitHub.
3. On a deliberately invoked one-time staging migration job, run `npm ci`, `npm run db:validate`, and `npm run db:migrate:deploy` against the exact approved `DATABASE_URL`.
4. Verify that `_prisma_migrations` contains a successfully finished `0_init` row, that 13 application tables exist, and that required custom constraints are present.
5. Run `npm run db:migrate:deploy` again to confirm there are no pending migrations.
6. Use a separate **least-privilege runtime** PostgreSQL role for the NestJS API, granting only necessary data access. Do not give the API application the migration-owner connection.
7. Deploy the API to an appropriately approved Render instance in Frankfurt, set exact `PUBLIC_WEB_ORIGIN` and `CORS_ORIGINS` to `https://mckanim-dinesight-preview.onrender.com`, and keep invitation delivery disabled.
8. Verify over HTTPS that `/api/v1/health/live` and `/api/v1/health/ready` are healthy, unpublished McKanim menu returns 404, and no owner login or order endpoints are active.
9. Test backups, restore and drift detection before any commercial customer data or payment processing.

## Release restrictions
- No actual migration to default staging branch is authorized by this document.
- No browser-accessible PostgreSQL credentials may be exposed.
- The public McKanim site remains an illustrative concept without functional ordering.
- An application reporting liveness but not readiness must never be described as operational.
- Do not merge draft PRs into `main` just to deploy staging.

## References
- Prisma migration deploy: https://www.prisma.io/docs/orm/prisma-migrate/workflows/deploying-database-changes
- Neon branching: https://neon.com/docs/introduction/branching
- OWASP access controls: https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
