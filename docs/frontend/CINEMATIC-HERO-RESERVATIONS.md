# McKanim — cinematic homepage and reservation request foundation

## Design reference
Reference: https://thevilla.ug/ (reviewed 16 Nov 2026).

The Villa uses oversized editorial headings, immersive hospitality photography, distinct kitchen/bar sections, short looping food films and prominent reservation calls to action. McKanim adopts **design principles**, not The Villa's code, logos, copy, imagery or business data.

### McKanim visual implementation
- Dark, full-bleed hero with existing illustrative venue photograph as the LCP-safe poster.
- Optional muted, looped background food footage; **not footage of McKanim**.
- Cinematic dark gradient preserving text contrast; existing brand typography and green/gold retained.
- Progressive enhancement: no film on `prefers-reduced-motion` or Save-Data; video pauses when page is hidden or navigation leaves Home; explicit Pause/Play control.
- Source of illustrative MP4: Pexels CDN `video-files/6353432/6353432-hd_720_1280_60fps.mp4`, referenced in an external verification catalog. Content is **illustrative** and must be visually reviewed for appropriateness before public client launch. Video may fail if the external CDN changes; the photographic poster always remains. Pexels license: https://www.pexels.com/license/. Owner-provided restaurant footage is preferred for launch.
- No animation framework, React migration or large self-hosted video added to GitHub.

## Reservations: request only
A reservation request is **not** a table booking. Customers supply name, phone, optional email, date, time, guest count and optional notes, and consent to contact. All records are `PENDING_REVIEW` until a staff workflow is implemented.

### Endpoint contract
- `GET /api/v1/public/restaurants/:restaurantSlug/reservation-requests/config`
- `POST /api/v1/public/restaurants/:restaurantSlug/reservation-requests` with JSON payload and a UUID idempotency key; **HTTP 202** only after PostgreSQL write succeeds.
- Response: opaque UUID reference, status `PENDING_REVIEW`, `confirmed:false`, explicit pending message.
- Dates and times refer to Africa/Kampala (EAT/UTC+03:00), 1h to 60 days in advance; no opening hours are invented.
- Party sizes 1–12 are **request bounds**, not a capacity/availability promise.
- Duplicate identical idempotency key returns original reference; different payload with reused key returns 409.
- Per phone number capped at three requests/hour; honeypot and global/restaurant double gates. Production requires additional cross-instance IP throttling and bot-abuse protection.

### Security and deployment controls
All must be true: `RESERVATION_REQUESTS_MODE=enabled` in protected backend environment, an active `Organization`, a published `Restaurant`, and `Restaurant.reservationRequestsEnabled=true`. **Every flag defaults off**. No public API or frontend permission can enable them.

Do not activate until the real McKanim owner has verified opening hours, capacities, booking review responsibility, privacy policy, consent wording, guest-data retention and a staff notification/acceptance flow. The frontend checks the server's eligibility endpoint and keeps the form hidden when not available. Failed requests never show a confirmation.

New migration: `backend/prisma/migrations/20261116010000_reservation_requests/migration.sql` is version-controlled. It must be independently reviewed and deployed with Prisma `migrate deploy` against the intended staging database; **do not issue raw schema SQL to the live staging branch**. This PR does not change the current Render API service or Neon staging schema.

### Outstanding before real bookings
1. Validate venue hours, actual table capacities, maximum party size and booking policy.
2. Implement authenticated manager dashboard to review and confirm/reject reservations.
3. Add email/SMS notifications and delivery retries, with verified sending identity.
4. Add robust abuse protection, CSRF/Origin strategy for browser submissions, PII privacy/retention, and backups.
5. Extend time-zone handling before selling to restaurants outside Uganda.
6. Confirm approved photos/video and replace sample menu with real UGX prices.

## Verification
Unit tests validate date conversions, opt-in gates, abuse limits and idempotency. PostgreSQL integration tests exercise tenant scoping, persistence and database constraints. Playwright tests mock the API to exercise disabled, pending and error states on desktop/mobile. Manual visual and real-network verification remain necessary.
