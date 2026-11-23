const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "script.js"), "utf8");
const configSource = fs.readFileSync(path.join(root, "content", "site-content.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(configSource, context, { timeout: 1000 });
const contentConfig = context.window.McKanimContent;

test("landmarks, page title and viewport exist", () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<title>McKanim Restaurant/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /<main id="main-content" tabindex="-1">/);
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
  assert.match(html, /Confirmed reservations require direct staff approval/i);
  assert.doesNotMatch(html, /Gourmet Avenue|\+1 \(555\)|12K\+ Happy Guests/);
});

test("menu and gallery imagery uses descriptive accessible images", () => {
  assert.match(html, /<img\s+class="hero-img"[^>]*fetchpriority="high"/);
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

test("UGX is the only currency shown on the concept menu", () => {
  assert.match(html, /Illustrative prices in Ugandan shillings \(UGX\)/);
  assert.match(html, /id="cartSubtotal">UGX 0<\/strong>/);
  assert.doesNotMatch(html, /Sample menu in USD|\$0\.00/);
  assert.match(js, /new Intl\.NumberFormat\("en-UG"/);
  assert.match(js, /return `UGX \$\{ugxFormatter\.format\(amountUGX\)\}`/);
  const prices = contentConfig.menuItems.map(item => item.price);
  assert.equal(prices.length, 16, "All 16 sample items require UGX prices");
  for (const price of prices) assert.ok(Number.isSafeInteger(price) && price > 0);
  assert.equal(contentConfig.restaurant.currency, "UGX");
});

test("content configuration is loaded before application script", () => {
  const contentTag = 'src="content/site-content.js" defer';
  const appTag = 'src="script.js" defer';
  assert.ok(html.indexOf(contentTag) >= 0);
  assert.ok(html.indexOf(appTag) > html.indexOf(contentTag));
  assert.match(js, /const siteContent = window\.McKanimContent/);
  assert.equal(contentConfig.galleryImages.length, 8);
});

test("prototype cannot claim restaurant owner approval or enable fake transactions", () => {
  assert.equal(contentConfig.restaurant.mode, "concept-preview");
  for (const [name, approved] of Object.entries(contentConfig.restaurant.approvals)) {
    assert.equal(approved, false, name + " must remain unapproved until the owner verifies it");
  }
  const ids = contentConfig.menuItems.map(x => x.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(contentConfig.menuItems.every(x => typeof x.img === "string" && x.img.startsWith("https://")));
});

test("all seven primary routes are actual views without scrollspy", () => {
  const urls = ["/", "/menu", "/about", "/gallery", "/reviews", "/reservations", "/contact"];
  for (const path of urls) assert.ok(html.includes(`href="${path}"`), "Missing navbar route " + path);
  assert.equal([...html.matchAll(/data-page="(home|menu|about|gallery|reviews|reserve|contact)"/g)].length, 8);
  assert.match(js, /history\.pushState/);
  assert.match(js, /popstate/);
  assert.doesNotMatch(js, /\/\/ Scrollspy/);
});
test("gallery has a real accessible lightbox with controls", () => {
  assert.match(html, /id="galleryLightbox"/);
  for (const name of ["lightboxClose", "lightboxPrev", "lightboxNext", "lightboxImage"]) assert.ok(html.includes(`id="${name}"`));
  assert.match(js, /dialog\.showModal\(\)/);
  assert.match(js, /ArrowLeft/);
  assert.match(js, /ArrowRight/);
});
