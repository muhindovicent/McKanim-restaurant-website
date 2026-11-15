# DineSight API — Phase 9A foundation (not production-ready)

A real NestJS + Prisma/PostgreSQL service scaffold for McKanim's planned commercial backend. **This is not a complete restaurant product**. Existing website ordering, staff dashboards and payments remain disabled.

## Prerequisites

- Node.js 22.22.3+ (or a currently supported Node.js 24 LTS)
- PostgreSQL with a dedicated database and least-privilege development credentials
- Environment variables configured from `.env.example` (never commit `.env`)

## Local setup

```sh
cd backend
npm install
cp .env.example .env
# Set DATABASE_URL to your own development PostgreSQL connection.
npm run db:validate
npm run db:migrate:dev
npm run db:generate
npm run build
npm run dev
```

This sequence is intended for a developer environment. Do not run development migrations on the production database. On production/staging use `npm run db:migrate:deploy` after migrations have been reviewed.

## Routes implemented in 9A

- `GET /api/v1/health/live`: process liveness (does not test DB)
- `GET /api/v1/health/ready`: database readiness (returns 503 when DB is unavailable)
- `GET /api/v1/public/restaurants/:restaurantSlug/menu`: reads **only published, available items** from PostgreSQL; no sample price fallback

**There are no order-creation, QR access, staff authentication, kitchen or payment endpoints yet.** Those require identity, authority, transactional integrity and integration tests.

## Database migration safety

The schema specifies the table and menu/order entities; `prisma/sql/required-constraints.sql` contains additional PostgreSQL checks and a partial unique index that Prisma schema cannot express. The SQL is a **review checklist**, not automatically applied. Integrate it into the initial generated migration before deploying or accepting real orders. Never mark the system commercially ready until these constraints have been verified in a real PostgreSQL instance.

No sample prices, users or default administrator accounts are seeded. An administrator onboarding process and approved McKanim catalog must precede launch.

## Testing

```sh
npm test
npm run db:validate
npm run build
```

Tests in 9A are primarily source/schema checks. Database integration tests and full operational end-to-end tests are required before release.

## Delivery architecture

McKanim stays the public restaurant website; the NestJS API is a separate application within the repository for now. A dedicated API deployment, managed PostgreSQL, secure staff authentication, rate limiting, monitoring, backups and data-protection controls are all required for the real customer product.
