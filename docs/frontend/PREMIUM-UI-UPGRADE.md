# McKanim Premium UI/UX — Architecture & QA Report

**Branch:** `feature/mckanim-premium-multipage-motion`  
**Review:** Draft PR #7 against `feature/dinesight-staging-configuration`. No direct changes to `main`.  
**Frontend:** HTML5, CSS3 and vanilla JavaScript. No React migration, extra framework, animation library, or backend modifications.

## Implemented in review phases

### Phase 1 — Navigation and information architecture
- Replaced section-scroll navbar with **real, standalone** `/menu/`, `/about/`, `/gallery/`, `/reviews/`, `/reservations/`, `/contact/`, and homepage `/`.
- Native links provide deep links, refresh, back/forward navigation and standard tab/keyboard behavior even without JavaScript.
- Exactly one current-page navigation indicator via `aria-current="page"`; shared header/footer/branding are preserved.
- Main content has semantic heading hierarchy, and the skip link works on each page.
- Staging build script packages actual HTML routes instead of publishing an SPA fallback or exposing the repository root.
- Page-content fade is **180ms CSS-only** on arrival, with native navigation unimpeded. No scripted wait or scroll animation.

### Phase 2 — Editorial interaction and motion
- Staggered homepage hero entrance, modest photographic entrance and two static editorial promotional labels. No perpetual floating animations.
- Refined menu hover elevation, image zoom, category animations, tactile add-to-cart feedback.
- 16 original menu items and **unmodified whole-UGX sample prices** remain in `content/site-content.js`.
- Demo cart selected items persist across page changes **within a single browser tab** using sessionStorage, without creating a real order.
- Gallery reworked as a responsive masonry-style column layout with descriptive image captions, a native `<dialog>` full-screen lightbox, close button, previous/next, ArrowLeft/ArrowRight, Escape and focus restoration.
- About and Reviews editorial imagery and entry microinteractions. Reviews clearly declare that no verified guest feedback has been supplied.
- Reservation page adds **local-only accessible form validation**. It does not transmit or confirm any booking, store entered guest data or claim a successful transaction.
- Contact page provides a clear placeholder instead of a fake address, phone number or map marker. Map integration waits for a verified restaurant location.
- Accessible control focus styling and reduced-motion handling across animations.

### Phase 3 — Verification and controlled release
- Static tests validate page route sets, one H1 per page, IDs, shared asset references, active navigation and currency trust rules.
- Browser tests cover direct routes, browser history, refresh, mobile menu, preview cart across navigation, filters, UGX totals, gallery keyboard behavior, local form validation and reduced-motion.
- Axe-core WCAG 2.2 AA automated checks cover homepage, menu cart/modal, gallery lightbox and reservations.
- Render static publish allowlist explicitly includes only seven HTML documents, shared CSS/JS, favicon, content config and robots.txt.
- CI keeps a downloadable package of the actual seven-page static preview.
- Lighthouse is a baseline workflow, **not** proof of real mobile Core Web Vitals or on-site production performance.

## Files of interest

- Modified: `index.html`, `script.js`, `DESIGN-SPEC.md`, `scripts/build-mckanim-preview.sh`, `tests/site.test.cjs`, `tests/browser.spec.cjs`, `tests/accessibility.spec.cjs`, `.github/workflows/site-quality.yml`, `.vercelignore`
- Created: `premium.css`, `menu/index.html`, `about/index.html`, `gallery/index.html`, `reviews/index.html`, `reservations/index.html`, `contact/index.html`

## Unresolved production blockers

- Restaurant's official address, phone, operating hours and location pin require verification.
- Sample dishes/prices in UGX and stock photographs are **not** owner-approved commercial offers.
- Verified reviews have not been provided; fabricated social proof is prohibited.
- Backend-backed bookings, authentication, payment, real ordering and confirmations remain disabled.
- Restaurant owner must provide authentic photography, accessibility-approved alt text and image rights.
- Gallery currently uses external Unsplash photos; real asset ownership and a local image optimization pipeline remain release requirements.
- Automated CI must pass at the final commit, followed by visual review on actual Android devices and full browser-compatibility QA. A green Lighthouse job is not a production acceptance test.
- The existing Render staging URL is pinned to another branch with auto-deploy off; this PR does not automatically change that live website.

## Source standards

- MDN: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- W3C WAI modal dialog pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- Render static site routes: https://render.com/docs/redirects-rewrites

**User priority:** Direct pages immediately, elegant motion only where it improves comprehension, and reliable UX ahead of decorative spectacle.
