# McKanim premium route and motion upgrade

## Decision

Retain the existing HTML, CSS, and vanilla JavaScript, plus the approved McKanim green/cream/gold identity and sample UGX menu. Use **instant page-view navigation** instead of in-page scrolling for primary links.

- Routes: `/`, `/menu`, `/about`, `/gallery`, `/reviews`, `/reservations`, `/contact`.
- Browser History API handles back/forward. `aria-current="page"` indicates the active view.
- Each view has exactly one visible `h1`; focus moves to incoming page heading on explicit user navigation.
- Each route is also generated as `render-public/<route>/index.html`. Thus a direct URL or refresh on the static host serves a real document without relying on an unconfigured wildcard rewrite. Generated subpages inject `<base href="/">` so shared CSS/JS assets resolve from any route.
- The offline ZIP root `index.html` remains usable through `?page=menu` query routing, without requiring a development server.
- Only the incoming view receives a 200ms entrance animation. No scrolling animation.

## Design

- Keep Playfair Display + Poppins, restrained green/cream/gold colors.
- Stagger hero heading, supporting copy and CTA, 560ms max; image entrance 650ms. No continuous loops.
- Subtle static editorial callout over the hero (does not invent ratings/promotions).
- Tactile menu buttons, short filter fade, cards with subtle lift/zoom.
- Gallery photography displayed in varied aspect ratios, with interactive caption overlay and a native `<dialog>` lightbox: close, arrows, Escape, keyboard focus return.
- Respect `prefers-reduced-motion`. Avoid parallax, massive dependencies, and expensive layout-animation properties.
- Reviews are a placeholder information view only; no fabricated testimonials.
- Reservations and contact remain informational only. Do not claim a booking/payment is accepted without a real system.

## Content still pending owner confirmation

The restaurant's address, telephone number, operating hours, owner-approved menu/pricing, original food photography, booking policies, taxes and service fees are not provided. Do not infer any of them from sample content. The 16 UGX menu amounts remain illustrative.

## QA and staged deployment

Browser tests cover direct route navigation, history, reload/deep links, cart, filters, UGX, lightbox keyboard controls, responsive layout, reduced motion and reservation honesty. Axe checks assess common WCAG failures; manual keyboard/real-device review remains necessary.

Render static staging must deploy branch `feature/mckanim-premium-routed-experience` only after PR validation and explicit deployment review. Existing service has auto-deploy off. No changes have been merged into `main`, and the DineSight backend is untouched.

### Release caveat

Other hosts may handle directory paths as `/menu/` rather than `/menu`; both resolve to the same view. If canonical slash-free paths become mandatory, configure a host-level URL rewrite/redirect policy. Render provides redirect/rewrite rules through its dashboard. The current implementation avoids dependency on those settings.
