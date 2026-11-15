# McKanim Restaurant Website

This repository contains a static HTML/CSS/JavaScript concept website for McKanim Restaurant. It is being refined as the future customer-facing frontend of the **DineSight** restaurant operations project.

## Current status

**Preview only — not production ready.** The sample menu, illustrative UGX prices, stock photographs, business story, contact information and hours are not verified restaurant operating data. The current cart is for menu exploration only; clicking the ordering information button does not place an order. Reservations are unavailable.

## Local development

Open `index.html` using a local static web server or VS Code Live Server. No Node dependencies are required for the website itself.

For structural regression checks, use Node.js 22 or later:

```sh
node --check script.js
node --test tests/site.test.cjs
```

These checks verify basic document structure and prototype safety. They do **not** replace browser testing, accessibility auditing, performance measurement, or backend integration tests.

## Release gates

1. Confirm official McKanim name, brand and positioning.
2. Replace illustrative photos with authorized authentic restaurant photography.
3. Verify menu items and pricing in the restaurant's operating currency.
4. Publish real, verified address, contact, operating hours and policy pages.
5. Connect orders and reservations to a tested backend before enabling them.
6. Test keyboard navigation, mobile responsive layouts, browsers, Core Web Vitals and accessibility.
7. Deploy only after reviewing the preview branch and approving the changes.

## DineSight architecture path

The public McKanim website will eventually connect to the DineSight NestJS API and PostgreSQL database. The operational workflows (tables, QR ordering, kitchen, cleaning and real-time notifications) will be implemented separately and connected through secure APIs. Camera AI is a later feature, not a requirement for the first restaurant launch.

## Browser-based regression tests

Pull requests run static tests plus Chromium desktop and mobile tests through GitHub Actions. The browser workflow verifies that the page initializes, menu filters work, the menu selection dialog is honest, Escape closes the cart, and mobile navigation can be used by keyboard. Screenshots, traces and an HTML test report are uploaded as the `mckanim-browser-review` workflow artifact.

These tests do not establish production readiness or verify real business data. Do not merge or publish until you have visually reviewed the browser screenshots and supplied authentic restaurant content.

## Ugandan shilling display

All sample menu figures use **integer UGX amounts** and display as `UGX 35,000` (never `$35.00` or cents). The numbers are demonstration prices informed by public Kampala restaurant menus, **not a currency conversion and not McKanim's official prices**. The menu is still non-operational.

Before launch, the restaurant owner must provide approved item names, serving sizes, prices, applicable taxes/fees, availability, and currency rules. When DineSight is integrated, prices must come from the backend as integer Uganda shillings and be recalculated server-side; JavaScript-only figures must never determine final customer charges.

## Phase 7 — edit restaurant content separately from application logic

All **sample menu items, UGX prices and gallery image URLs** live in `content/site-content.js`. To change a demo price, edit the `price: 35000` entry for the corresponding dish there. Keep amounts as whole UGX integers and run the quality checks.

The `restaurant` section records which business information has **not yet been verified**. The present site deliberately refuses to enable real online ordering or reservations through this file alone. Do not change the approval flags or `mode` until there is an approved content-release process and a working DineSight backend.

The site uses a regular deferred script rather than fetching JSON, so it can be reviewed offline by opening `index.html` from a downloaded preview ZIP. Images and web fonts still require an internet connection.

### Preview without VS Code

In the Pull Request, open the GitHub Actions **McKanim site quality** workflow for the latest commit. Download the `mckanim-standalone-preview` artifact, extract it, and open `index.html` in your browser. No Git checkout, Live Server or terminal is needed.

For a future public preview URL, deploy a **separate protected staging environment** only after its access, source branch and public visibility are explicitly approved. GitHub Pages does not generally provide public pull-request preview deployments automatically.

## Phase 8 — DineSight integration contract (design only)

We have defined the future backend API in `contracts/dinesight-openapi.json` (OpenAPI 3.1.1) and the operational handoff in `docs/integration/PHASE8-HANDOFF.md`.

An **opt-in**, framework-independent API adapter is available at `integration/dinesight-client.js`. It is **not loaded by the current website** and does not turn on checkout, customer authentication, table QR sessions, or kitchen operations by itself. The site remains a preview until the backend has been built, secured, tested, and explicitly connected.

The proposed server is NestJS + PostgreSQL/Prisma. Guests submit only menu item IDs and quantities—not prices, amounts, or table IDs. Orders are priced in UGX by the backend, stored as pending, and confirmed by a waiter before being delivered to the kitchen.

Run the new contract checks with:

```sh
node --check integration/dinesight-client.js
node --test tests/*.test.cjs
```

Successful mock tests **are not proof of a running backend**. No restaurant ordering, billing, payments, or reservations are currently operational.
