# McKanim production release gate

**Status:** Draft quality checklist. All items must be verified before the static concept becomes a production website. The DineSight platform and real checkout are separate projects.

## 1. Content authorization (restaurant owner)
- [ ] Confirm business name, address, phone, official email and opening hours.
- [ ] Confirm brand name spelling, founding date, head chef, cuisine and marketing claims (if shown).
- [ ] Confirm full menu names, descriptions, official UGX prices, availability, allergens, serving sizes, and photos.
- [ ] Confirm whether displayed UGX prices include tax/service charges and how the final bill is calculated.
- [ ] Provide original food and premises images, with explicit web publication rights and alt text.
- [ ] Verify external social links and real location map before displaying.
- [ ] Supply truthful, permissioned testimonials only if restaurant approves publication.

## 2. Restaurant operations
- [ ] Decide whether reservations will be handled by an external reservation provider, staff-managed workflow or a new DineSight module.
- [ ] Do not enable the checkout until the backend persists orders with unique idempotency keys and staff acceptance.
- [ ] Confirm how walk-in customers without smartphones will place orders.
- [ ] Add payment details only after a licensed processing integration has been validated.

## 3. Technical quality
- [ ] Keep source code on a review branch until approval; protect `main`.
- [ ] GitHub Actions static and desktop/mobile browser jobs passing.
- [ ] Axe automated WCAG A/AA issue list clear, followed by manual screen-reader/keyboard testing.
- [ ] Inspect image failures, responsive overflow, browser behavior, and cache handling.
- [ ] Record Lighthouse lab baseline; investigate LCP, CLS, and interaction concerns.
- [ ] Validate customer content across current Chrome, Safari and Firefox browsers.
- [ ] Review privacy, cookie, tracking and retention notices before collecting user data.
- [ ] Validate DNS, HTTPS, robots, canonical metadata and search indexing when a real production domain is selected.

## 4. Release decision
**Go** only when a restaurant representative approves content and owner details; all customer-facing actions are accurate; technical checks pass; and the deployment is tested in its actual hosting environment.

**No-go** if unverified claims, images or prices are represented as real, or if the site confirms orders/reservations that were never received.
