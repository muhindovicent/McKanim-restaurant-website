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

## Multi-restaurant SaaS direction (confirmed 15 November 2026)

DineSight is a product owned by its developer and intended for licensing/subscription to multiple restaurants; McKanim is a reference frontend, not the exclusive product owner. `Organization` is the paying customer boundary and `Restaurant.organizationId` identifies each branch. Newly created organizations default to **inactive**; their public menus must also be actively approved/published.

**Security warning:** Tenant IDs and foreign keys alone do not enforce object-level access controls or block cross-tenant references. Staff membership, organization-scoped authorization, audited support access, cross-branch consistency constraints, and two-tenant security tests must be implemented in later phases. No private staff or ordering endpoints are active now. PostgreSQL RLS is an optional defense in depth that depends on actual hosting privileges and a proper runtime DB role.

See `../docs/architecture/ADR-001-MULTI-TENANT-SAAS.md` and `../docs/commercial/DINESIGHT-LICENSING-MODEL.md`. No subscription billing has been implemented.

## Phase 9B.1 — first customer has one location

The product owner confirmed that the first paying restaurant client will operate a **single location**. New organizations now have `branchLimit = 1` by default. A dedicated **internal** `BranchProvisioningService` obtains a PostgreSQL row lock and verifies branch limits before inserting an unpublished restaurant branch. The service does not expose an HTTP route; a securely authenticated platform-admin onboarding process will be required later.

The `branchLimit` is an entitlement, not a completed subscription billing feature. Organizations remain inactive until approved. Additional branches can be supported by increasing the agreed entitlement later, without cloning the entire application.

**Not yet implemented:** owner accounts, login, authorized staff membership, subscription payment, kitchen, ordering, or full tenant-isolation enforcement. Provisioning through internal calls alone is not customer-ready.

Run `npm run build && npm test`; the new unit tests cover branch limit, disabled publishing, invalid IDs, and future multi-location entitlement.

## Phase 9B.3 — secure owner invitation foundation

`OwnerInvitation` stores a **hash** of each random one-time invitation token, not the token itself. An internal NestJS `OwnerInvitationService` can issue and atomically redeem 24-hour owner invitations, creating a restaurant-scoped OWNER staff record with a salted scrypt password hash. Unit and PostgreSQL tests exercise expiry, replay, revocation and restaurant boundaries. **No real email address is hardcoded or seeded**; the intended recipient must be supplied through secure configuration after a transactional mail provider and approved staging deployment exist.

There is **no authenticated owner login, no email delivery, no public invite endpoint, and no active production owner account yet**. Details: `../docs/security/MCKANIM-OWNER-INVITATION.md`.

## Staging hosting without custom domains

The first McKanim pilot will use **provider-generated HTTPS URLs** for Vercel's restaurant preview and Render's API. A separate Neon staging database will be provisioned after migrations and credentials are reviewed. See `../docs/deployment/STAGING-NO-CUSTOM-DOMAIN.md`.

Set `NODE_ENV=production` and `APP_ENV=staging` for staging API runtime. The exact URL copied from Vercel must be configured in both `PUBLIC_WEB_ORIGIN` and `CORS_ORIGINS`. Startup fails closed on missing, untrusted, non-HTTPS or mismatched origins. `INVITATION_DELIVERY_MODE` is locked to `disabled` until verified email service integration and user-facing redemption are implemented.

Do not assume a `.vercel.app` web URL authorizes transactional email sending or that an invitation acceptance page exists yet. Deployment has **not been executed** through this change.
