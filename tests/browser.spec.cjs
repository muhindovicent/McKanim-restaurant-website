const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/(images\.unsplash\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//, route => route.abort());
  await page.goto("/");
});

test("homepage loads without client JavaScript errors and renders menu", async ({ page }) => {
  const errors = [];
  page.on("pageerror", err => errors.push(err.message));
  await page.reload();
  await page.goto("/menu");
  const initialItems = await page.locator(".menu-card").count();
  expect(initialItems).toBeGreaterThan(5);
  await page.goto("/gallery");
  await expect(page.locator(".gallery-item")).not.toHaveCount(0);
  expect(errors).toEqual([]);
});

test("category filters update menu items and pressed state", async ({ page }) => {
  await page.goto("/menu");
  const allItems = await page.locator(".menu-card").count();
  expect(allItems).toBeGreaterThan(5);
  await page.getByRole("button", { name: "Burgers", exact: true }).click();
  const filtered = await page.locator(".menu-card").count();
  expect(filtered).toBeGreaterThan(0);
  expect(filtered).toBeLessThan(allItems);
  await expect(page.getByRole("button", { name: "Burgers", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.locator(".menu-card")).toHaveCount(allItems);
});

test("menu selection and ordering information never claim a real order", async ({ page }) => {
  await page.goto("/menu");
  await page.locator(".menu-card .add-btn").first().click();
  await expect(page.locator("#cartCount")).toHaveText("1");
  await page.locator("#cartBtn").click();
  await expect(page.locator("#cartDrawer")).toHaveClass(/open/);
  await expect(page.locator("#cartClose")).toBeFocused();
  await page.locator("#checkoutBtn").click();
  await expect(page.locator("#checkoutModal")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Online ordering is not active yet" })).toBeVisible();
  await page.getByRole("button", { name: "Understood" }).click();
  await expect(page.locator("#checkoutModal")).not.toBeVisible();
});

test("cart drawer closes via Escape and restores launcher focus", async ({ page }) => {
  await page.locator("#cartBtn").click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#cartDrawer")).not.toHaveClass(/open/);
  await expect(page.locator("#cartBtn")).toBeFocused();
});

test("mobile navigation opens, closes, and does not create horizontal overflow", async ({ page }, testInfo) => {
  if (!testInfo.project.name.includes("mobile")) test.skip();
  await expect(page.locator("#navLinks")).toHaveAttribute("inert", "");
  await page.getByRole("button", { name: "Toggle menu" }).click();
  await expect(page.locator("#navLinks")).toHaveClass(/open/);
  await expect(page.getByRole("button", { name: "Toggle menu" })).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.locator("#navLinks")).not.toHaveClass(/open/);
  await expect(page.getByRole("button", { name: "Toggle menu" })).toBeFocused();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("create visual review screenshot", async ({ page }, testInfo) => {
  // Allow actual public images and web fonts when recording screenshots.
  await page.unrouteAll();
  await page.reload({ waitUntil: "domcontentloaded" });
  // Scroll through the entire page to load lazily requested food and gallery photos.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.max(500, Math.round((await page.evaluate(() => window.innerHeight)) * 0.7));
  for (let y = 0; y < height; y += step) {
    await page.evaluate(pos => window.scrollTo(0, pos), y);
    await page.waitForTimeout(80);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1600);
  fs.mkdirSync("screenshots", { recursive: true });
  await page.screenshot({ path: "screenshots/" + testInfo.project.name + ".png", fullPage: true, timeout: 20000 });
});

test("all menu and cart price labels use UGX consistently", async ({ page }) => {
  await page.goto("/menu");
  const menuPrices = await page.locator(".menu-price").allTextContents();
  expect(menuPrices.length).toBe(16);
  for (const price of menuPrices) {
    expect(price).toMatch(/^UGX [0-9]{1,3}(?:,[0-9]{3})*$/);
  }
  await expect(page.locator(".menu-card").first().locator(".menu-price")).toHaveText("UGX 35,000");
  await page.locator(".menu-card .add-btn").first().click();
  await page.locator("#cartBtn").click();
  await expect(page.locator("#cartSubtotal")).toHaveText("UGX 35,000");
  await page.locator('[data-plus="1"]').click();
  await expect(page.locator("#cartSubtotal")).toHaveText("UGX 70,000");
});

test("primary navigation opens immediate clean routes and respects history", async ({ page }, testInfo) => {
  const isMobile = testInfo.project.name.includes("mobile");
  const links = [["Menu","/menu"],["About","/about"],["Gallery","/gallery"],["Reviews","/reviews"],["Reservations","/reservations"],["Contact","/contact"],["Home","/"]];
  for (const [label, path] of links) {
    if (isMobile) await page.getByRole("button", { name: "Toggle menu" }).click();
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(path === "/" ? "/$" : path + "$"));
    await expect(page.locator('[data-page]:not([hidden]) h1')).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current","page");
  }
  await page.goBack();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("heading", { name: "Stay close to McKanim" })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/$/);
});

test("direct deep links survive browser reload", async ({ page }) => {
  for (const route of ["/menu","/about","/gallery","/reviews","/reservations","/contact"]) {
    await page.goto(route);
    await expect(page.locator('[data-page]:not([hidden]) h1')).toHaveCount(1);
    await page.reload();
    await expect(page.locator('[data-page]:not([hidden]) h1')).toHaveCount(1);
  }
});

test("gallery lightbox supports keyboard navigation and focus restoration", async ({ page }) => {
  await page.goto("/gallery");
  const first = page.getByRole("button", { name: /Open photograph 1 of 8/ });
  await first.click();
  await expect(page.locator("#galleryLightbox")).toBeVisible();
  await expect(page.locator("#lightboxCount")).toHaveText("1 of 8");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#lightboxCount")).toHaveText("2 of 8");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#lightboxCount")).toHaveText("1 of 8");
  await page.keyboard.press("Escape");
  await expect(page.locator("#galleryLightbox")).not.toBeVisible();
  await expect(first).toBeFocused();
});

test("reduced motion disables entrance animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#home")).toBeVisible();
  const anim = await page.locator("#home").evaluate(el => getComputedStyle(el).animationName);
  expect(anim).toBe("none");
});

test("no fake reviews or booking confirmations are presented", async ({ page }) => {
  await page.goto("/reviews");
  await expect(page.getByText(/do not invent testimonials/i)).toBeVisible();
  await page.goto("/reservations");
  await expect(page.getByText(/Online reservations are not available yet/i)).toBeVisible();
});
