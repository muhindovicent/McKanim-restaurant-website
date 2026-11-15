# McKanim Restaurant Website

This repository contains a static HTML/CSS/JavaScript concept website for McKanim Restaurant. It is being refined as the future customer-facing frontend of the **DineSight** restaurant operations project.

## Current status

**Preview only — not production ready.** The sample menu, USD prices, stock photographs, business story, contact information and hours are not verified restaurant operating data. The current cart is for menu exploration only; clicking the ordering information button does not place an order. Reservations are unavailable.

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
