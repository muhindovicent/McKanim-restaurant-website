# McKanim Restaurant — first DineSight customer profile

**Owner-confirmed:** The first buyer's restaurant operates as **McKanim Restaurant**, with **one location**. DineSight remains a software platform owned by its developer and licensed/subscribed to independent restaurant organizations.

| Field | Confirmed value or status |
|---|---|
| Platform | DineSight (shared SaaS backend) |
| First customer organization | McKanim Restaurant |
| Organization slug | `mckanim` |
| First restaurant/branch | McKanim Restaurant |
| Restaurant slug | `mckanim` |
| Initial branch allowance | 1 |
| Currency | UGX |
| Actual street address | **Not provided** |
| Client owner's name, email and phone | **Not provided** |
| Published official menu, prices, allergens | **Not provided** |
| Registered company / legal trading entity | **Not confirmed** |
| Approved website media and operating hours | **Not provided** |

## What this profile enables

An explicit and **non-production-only** Prisma seed can provision one inactive organization and one unpublished restaurant branch under their actual owner-confirmed brand. This is a placeholder account structure, **not** a live client activation.

- Source: `backend/src/onboarding/mckanim-bootstrap.ts`
- Entry point: `backend/prisma/seed.ts`
- Prisma 7 command: `npm run db:seed` from the backend folder, with an explicit non-production guard.
- Automated PostgreSQL verification: `backend/scripts/verify-mckanim-pilot.mjs`

The seed does not create owner accounts, passwords, official menu items, payment settings, table layout, or live orders. It does not update an existing approved customer's details on repeated runs.

## Onboarding prerequisites

1. Obtain **authorized restaurant owner email** for invitation-based account enrollment, not a shared demo password.
2. Confirm the restaurant's physical address (and the legal trading entity if relevant).
3. Obtain table numbering/capacities and the first approved UGX menu.
4. Confirm operating hours, tax/service-charge policy, payment methods, kitchen device and receipt requirements.
5. Obtain client approval of SaaS licensing terms and data protection/hosting requirements.

## Production safety

The development seed intentionally refuses to execute when `NODE_ENV=production` or the explicit preview bootstrap acknowledgement is absent. Real production onboarding must be an authenticated, audited action performed by a platform administrator, and must not silently activate a restaurant or publish menu data.

No public website/backend deployment or real restaurant database is modified by this profile.
