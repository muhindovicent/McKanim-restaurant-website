# DineSight commercial discovery and production acceptance checklist

**Status:** Awaiting the purchasing client's confirmation. McKanim is a product concept with a prospective buyer, not an established restaurant with verified operations. Do not invent operating details.

## Product model (must decide before scaling architecture)
- [ ] Single-restaurant commissioned application (one client/one installation)
- [ ] Reusable DineSight product licensed to multiple restaurant clients
- [ ] Buyer wants source-code ownership vs hosted subscription with ongoing support
- [ ] Branding: McKanim demonstration, buyer's restaurant name, or co-branded DineSight

**Recommendation:** Deliver a reusable, restaurant-scoped core for one first-customer pilot; avoid prematurely implementing multi-tenant payments and tenant billing.

## Operational requirements to obtain from the buyer
- [ ] Restaurant location, floor plan and approximate number of tables
- [ ] Table naming/numbering and seating/merging/splitting policy
- [ ] Official menu, categories, UGX prices, taxes/service fees, promotions and availability
- [ ] Staff roles, headcount, shift management, employee login policy
- [ ] Kitchen equipment: Android tablet, laptop, kitchen display or receipt printer
- [ ] Customer mode: table QR orders, walk-in waiter orders, takeaway, delivery, reservations
- [ ] Payment methods: cash, mobile money, card, split payments, refunds, receipts
- [ ] Connectivity and power availability, backup/offline process
- [ ] Existing CCTV models and camera access (AI only after privacy review)
- [ ] Allergens/dietary information, public images and legal publishing permission

## Client sign-off and legal/commercial gate
- [ ] Written statement of work, agreed fixed scope, exclusions and delivery milestones
- [ ] Agreed acceptance criteria, user acceptance testing by the restaurant
- [ ] License/ownership and source-code access terms; subcontractor dependencies disclosed
- [ ] Hosting and recurring infrastructure costs, SMS/payment provider fees and who pays
- [ ] Warranty, maintenance/support, escalation and incident recovery expectations
- [ ] Data controller/processor roles, data retention and cross-border hosting risks
- [ ] Uganda PDPO registration/legal assessment where applicable
- [ ] Payment and operational data access, backup policy, and account administration

## Release gates (measurable, not aspirational)
1. **Functional:** A guest or waiter can submit an order once, a waiter confirms, kitchen prepares, delivery is acknowledged, bill totals are correct, and the table is released only after cleaning.
2. **Reliability:** Retry cannot duplicate orders; reconnecting kitchen terminals rebuild their queue from the database; backup restore drill passes.
3. **Security:** Server-side authorization per restaurant and role; object-level tests; staff password reset; no public staff credentials; secrets outside the repository.
4. **Performance:** Load testing with the buyer's expected number of simultaneous guests/orders; set targets from pilot measurements.
5. **Privacy:** Guest order data retention, surveillance transparency, role-scoped camera monitoring and recorded approval.
6. **Operational:** Kitchen and service staff demonstrate all common tasks in a realistic on-site pilot.
7. **Deployment:** Separate staging/production credentials, HTTPS, monitoring, migrations, backup schedule and rollback plan.

## Implementation sequence

**9A — backend foundation (current PR):** NestJS, PostgreSQL schema, public approved-menu endpoint, readiness checks, CI/ephemeral database verification. **No real ordering in this step.**

**9B — migrations and authenticated staff:** review/commit SQL migration, secure initial owner onboarding, access roles, unit and integration tests.

**9C — restaurant setup:** tables, QR revocation, approved catalog administration, image uploads and staff management.

**9D — transaction system:** provisional table visits, idempotent order creation, waiter confirmation, kitchen states, real-time notifications and reconciliation.

**9E — settlement and operational readiness:** payments (cash record first, provider integration later), receipts, reporting, cleaning, recovery and data-export controls.

**9F — client pilot:** deploy protected staging, conduct UAT, load/security/restore tests and obtain acceptance.

**Later:** separate camera vision service with privacy assessment and measured occupancy reliability.

## Official references used for the technical baseline
- NestJS: https://docs.nestjs.com/first-steps
- Prisma ORM v7 and NestJS: https://www.prisma.io/docs/guides/v7/frameworks/nestjs
- Prisma production migrations: https://docs.prisma.io/docs/cli/migrate/deploy
- OWASP API risks: https://owasp.org/projects/api-security-project/
- Uganda PDPO registration information: https://doingbusiness.finance.go.ug/licensing/pdpo-data-protection-registration
