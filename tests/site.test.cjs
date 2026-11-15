const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "script.js"), "utf8");

test("landmarks, page title and viewport exist", () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<title>McKanim Restaurant/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /<main id="main-content">/);
  assert.match(html, /<nav[^>]*aria-label="Primary"/);
});

test("in-page anchor destinations exist", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  const destinations = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, "HTML IDs must be unique");
  for (const dest of destinations) {
    assert.ok(ids.includes(dest), "Missing anchor destination: " + dest);
  }
});

test("JavaScript element selectors refer to elements", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  const selectors = [...js.matchAll(/\$\("#([A-Za-z][\w-]*)"\)/g)].map((m) => m[1]);
  for (const id of selectors) assert.ok(ids.includes(id), "Missing JS element: " + id);
});

test("demo storefront does not claim a real order or booking", () => {
  assert.doesNotMatch(html, /Order Placed!|Your order has been confirmed/i);
  assert.doesNotMatch(js, /Table reserved for|Order reference:\s*/i);
  assert.match(html, /Online ordering is not active yet/);
  assert.match(html, /reservations are not available yet/i);
  assert.doesNotMatch(html, /Gourmet Avenue|\+1 \(555\)|12K\+ Happy Guests/);
});

test("menu and gallery imagery uses descriptive accessible images", () => {
  assert.match(html, /<img class="hero-img"[^>]*fetchpriority="high"/);
  assert.match(js, /alt="Illustrative food photography:/);
  assert.match(js, /loading="lazy"/);
  assert.match(css, /prefers-reduced-motion/);
});

test("menu selection and modal use accessible semantics", () => {
  assert.match(html, /role="dialog" aria-modal="true" aria-labelledby="cartTitle" inert/);
  assert.match(html, /<dialog class="order-dialog"/);
  assert.match(js, /showModal\(\)/);
  assert.match(html, /aria-controls="navLinks"/);
});

test("category filter operates on collections, not a single element", () => {
  const selector = '$$("#menuFilters .filter-btn").forEach';
  const collectionUses = js.split(selector).length - 1;
  assert.equal(collectionUses, 2, "The filter buttons must be iterated with querySelectorAll");
});

test("footer headings follow main page heading hierarchy", () => {
  assert.doesNotMatch(html, /<h4>/, "No skipped footer heading levels are allowed");
  assert.match(html, /<h3>Quick Links<\/h3>/);
});

test("hero photo uses responsive delivery while remaining clearly illustrative", () => {
  assert.match(html, /class="hero-img"[\s\S]*?srcset=/);
  assert.match(html, /sizes="\(max-width: 900px\) 92vw, 530px"/);
  assert.match(html, /not the actual McKanim venue/);
});
