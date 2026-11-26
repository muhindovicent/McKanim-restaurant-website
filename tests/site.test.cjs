const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const names = ["home", "menu", "about", "gallery", "reviews", "reservations", "contact"];
const pages = new Map(names.map(name => {
  const file = name === "home" ? "index.html" : `${name}/index.html`;
  return [name, fs.readFileSync(path.join(root, file), "utf8")];
}));
const html = pages.get("home");
const js = fs.readFileSync(path.join(root, "script.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const premium = fs.readFileSync(path.join(root, "premium.css"), "utf8");
const contentSource = fs.readFileSync(path.join(root, "content/site-content.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(contentSource, context, { timeout: 1000 });
const content = context.window.McKanimContent;

test("seven real semantic HTML documents have unique headings and route titles", () => {
  for (const [name, page] of pages) {
    assert.match(page, /<!DOCTYPE html>/i, name);
    assert.match(page, /<html lang="en">/, name);
    assert.match(page, /<title>[^<]+<\/title>/, name);
    assert.match(page, /name="viewport"/, name);
    assert.match(page, /<main id="main-content"/, name);
    assert.match(page, /<nav[^>]*aria-label="Primary"/, name);
    assert.equal((page.match(/<h1(?:\s|>)/g) || []).length, 1, name + " must have exactly one h1");
    assert.equal((page.match(/aria-current="page"/g) || []).length, 1, name + " must show one active link");
    const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, name + " has duplicate HTML IDs");
    for (const target of page.matchAll(/href="#([^"]+)"/g)) {
      assert.ok(ids.includes(target[1]), name + " missing in-page anchor " + target[1]);
    }
  }
});

test("all navigation links are real page URLs rather than scroll targets", () => {
  const pathMap = new Set(["/", "/menu/", "/about/", "/gallery/", "/reviews/", "/reservations/", "/contact/"]);
  for (const [name, page] of pages) {
    const base = "https://mckanim.example/" + (name === "home" ? "" : name + "/");
    const nav = page.match(/<nav class="nav-links"[\s\S]+?<\/nav>/)?.[0];
    assert.ok(nav, name + " primary navigation absent");
    const links = [...nav.matchAll(/href="([^"]+)"/g)];
    assert.equal(links.length, 7, name + " must link to all seven pages");
    assert.deepEqual(new Set(links.map(link => new URL(link[1], base).pathname)), pathMap);
    assert.ok(!links.some(link => link[1].startsWith("#")), name + " must not scroll between sections");
    for (const asset of ["premium.css", "styles.css", "script.js", "content/site-content.js"]) {
      const href = asset.endsWith(".css") ? page.match(new RegExp('href="([^"]*' + asset.replace(/\./g,"\\.") + ')"'))?.[1] :
        page.match(new RegExp('src="([^"]*' + asset.replace(/\./g,"\\.") + ')"'))?.[1];
      assert.ok(href, name + " does not load " + asset);
      assert.equal(new URL(href, base).pathname, "/" + asset);
    }
  }
});

test("all public routes preserve the menu preview trust boundary", () => {
  assert.equal(content.menuItems.length, 16);
  assert.equal(content.galleryImages.length, 8);
  assert.equal(content.restaurant.currency, "UGX");
  assert.equal(content.restaurant.mode, "concept-preview");
  for (const approved of Object.values(content.restaurant.approvals)) assert.equal(approved, false);
  assert.ok(content.menuItems.every(item => Number.isSafeInteger(item.price) && item.price > 0));
  assert.match(pages.get("menu"), /Illustrative prices in Ugandan shillings \(UGX\)/);
  assert.match(pages.get("reviews"), /invented testimonials/);
  assert.match(pages.get("contact"), /Verified contact details coming soon/);
  assert.match(pages.get("reservations"), /reservations are not available yet/i);
  assert.match(html, /Online ordering is not active yet/);
  assert.doesNotMatch(js, /Order Placed!|Table reserved for|Order reference:/i);
});

test("progressive motion and accessible controls are implemented", () => {
  assert.ok(premium.includes(".page-content { animation: page-reveal 180ms"));
  assert.match(premium, /page-reveal 180ms/);
  assert.match(premium, /prefers-reduced-motion: reduce/);
  assert.match(premium, /scroll-behavior: auto/);
  assert.match(js, /sessionStorage\.setItem/);
  assert.match(js, /aria-pressed/);
  assert.match(pages.get("gallery"), /<dialog class="gallery-lightbox"/);
  assert.match(pages.get("gallery"), /aria-label="Next photograph"/);
  assert.match(js, /dialog\.showModal\(\)/);
  assert.match(js, /lastGalleryTrigger\?\.focus\(\)/);
  assert.match(pages.get("reservations"), /id="reservationForm"[^>]+novalidate/);
  assert.match(pages.get("reservations"), /No information entered here is transmitted/);
  assert.match(js, /No reservation was sent or confirmed/);
  assert.match(html, /role="dialog" aria-modal="true" aria-labelledby="cartTitle" inert/);
  assert.match(premium, /focus-visible/);
});

test("sample menu and gallery images preserve image sizing and copy", () => {
  assert.match(html, /<img[^>]+class="hero-img"[^>]+fetchpriority="high"/);
  assert.match(js, /alt="Illustrative food photography:/);
  assert.match(js, /loading="lazy"/);
  assert.match(js, /return `UGX \$\{ugxFormatter\.format\(amountUGX\)\}`/);
  assert.match(pages.get("gallery"), /id="galleryLightbox"/);
  assert.ok(content.galleryImages.every(x => x.url.startsWith("https://images.unsplash.com/")));
});

test("all seven primary routes remain direct pages without scrollspy", () => {
  const routeFiles = ["index.html", "menu/index.html", "about/index.html", "gallery/index.html",
    "reviews/index.html", "reservations/index.html", "contact/index.html"];
  for (const file of routeFiles) assert.ok(fs.existsSync(path.join(root, file)), "Missing route page " + file);
  assert.ok(html.includes('href="./"'), "Homepage navigation must link to the root page");
  assert.ok(js.includes("function initNav("), "Primary navigation initializer must exist");
  assert.ok(!js.includes("history.pushState") && !js.includes("popstate"), "Navigation must remain direct-page");
  assert.ok(!js.includes("// Scrollspy"), "Scrollspy must remain absent");
});
test("gallery has a real accessible lightbox with controls", () => {
  assert.match(html, /id="galleryLightbox"/);
  for (const name of ["lightboxClose", "lightboxPrev", "lightboxNext", "lightboxImage"]) assert.ok(html.includes(`id="${name}"`));
  assert.match(js, /dialog\.showModal\(\)/);
  assert.match(js, /ArrowLeft/);
  assert.match(js, /ArrowRight/);
});
