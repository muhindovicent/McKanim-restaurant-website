const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/(images\.unsplash\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//, route => route.abort());
  await page.goto("/");
});

test("homepage uses route-based navigation without JS errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".hero-promo")).toHaveCount(2);
  await expect(page.locator(".menu-card")).toHaveCount(0);
  await expect(page.locator("#navLinks [aria-current=page]")).toHaveText("Home");
  expect(errors).toEqual([]);
});

test("direct menu routes, browser history, refresh and active indicators work", async ({ page }, testInfo) => {
  if (testInfo.project.name.includes("mobile")) {
    await page.locator("#hamburger").click();
  }
  await page.locator('#navLinks a[href="menu/"]').click();
  await expect(page).toHaveURL(/\/menu\/$/);
  await expect(page.locator("#navLinks [aria-current=page]")).toHaveText("Menu");
  await expect(page.locator(".menu-card")).toHaveCount(16);
  await page.reload();
  await expect(page.locator(".menu-card")).toHaveCount(16);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("#navLinks [aria-current=page]")).toHaveText("Home");
  await page.goForward();
  await expect(page).toHaveURL(/\/menu\/$/);
  await expect(page.locator(".menu-card")).toHaveCount(16);
});

test("every public page loads directly and displays correct active navigation", async ({ page }) => {
  for (const name of ["about", "gallery", "reviews", "reservations", "contact"]) {
    await page.goto("/" + name + "/");
    await expect(page.locator("#navLinks [aria-current=page]")).toHaveText(name[0].toUpperCase()+name.slice(1));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("category filters update menu and preserve original UGX prices", async ({ page }) => {
  await page.goto("/menu/");
  await expect(page.locator(".menu-card")).toHaveCount(16);
  const amounts = await page.locator(".menu-price").allTextContents();
  for (const price of amounts) expect(price).toMatch(/^UGX [0-9]{1,3}(?:,[0-9]{3})*$/);
  await expect(page.locator(".menu-card").first().locator(".menu-price")).toHaveText("UGX 35,000");
  await page.getByRole("button", { name: "Burgers", exact: true }).click();
  const count = await page.locator(".menu-card").count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThan(16);
  await expect(page.getByRole("button", { name: "Burgers", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.locator(".menu-card")).toHaveCount(16);
});

test("preview cart persists across pages, confirms no order and supports quantity changes", async ({ page }) => {
  await page.goto("/menu/");
  await page.locator(".menu-card .add-btn").first().click();
  await expect(page.locator("#cartCount")).toHaveText("1");
  await page.goto("/gallery/");
  await expect(page.locator("#cartCount")).toHaveText("1");
  await page.locator("#cartBtn").click();
  await expect(page.locator("#cartDrawer")).toHaveClass(/open/);
  await expect(page.locator("#cartClose")).toBeFocused();
  await expect(page.locator("#cartSubtotal")).toHaveText("UGX 35,000");
  await page.locator('[data-plus="1"]').click();
  await expect(page.locator("#cartSubtotal")).toHaveText("UGX 70,000");
  await page.locator("#checkoutBtn").click();
  await expect(page.locator("#checkoutModal")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Online ordering is not active yet" })).toBeVisible();
  await page.getByRole("button", { name: "Understood" }).click();
  await expect(page.locator("#checkoutModal")).not.toBeVisible();
});

test("gallery lightbox supports navigation, Escape and focus restoration", async ({ page }) => {
  await page.goto("/gallery/");
  await expect(page.locator(".gallery-item")).toHaveCount(8);
  const first = page.locator('[data-gallery-index="0"]');
  await first.click();
  await expect(page.locator("#galleryLightbox")).toBeVisible();
  await expect(page.locator("#lightboxPosition")).toHaveText("1 / 8");
  await page.getByRole("button", { name: "Next photograph" }).click();
  await expect(page.locator("#lightboxPosition")).toHaveText("2 / 8");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#lightboxPosition")).toHaveText("1 / 8");
  await page.keyboard.press("Escape");
  await expect(page.locator("#galleryLightbox")).not.toBeVisible();
  await expect(first).toBeFocused();
});

test("reservation preview validates accessible fields without claiming submission", async ({ page }) => {
  await page.goto("/reservations/");
  await page.getByRole("button", { name: /Check details \(preview only\)/ }).click();
  await expect(page.locator("#guestName")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#reservationStatus")).toContainText("No booking request has been sent");
  await page.locator("#guestName").fill("A Guest");
  await page.locator("#guestEmail").fill("guest@example.org");
  await page.locator("#visitDate").fill("2027-05-20");
  await page.locator("#partySize").selectOption("2");
  await page.locator("#visitTime").fill("19:00");
  await page.getByRole("button", { name: /Check details \(preview only\)/ }).click();
  await expect(page.locator("#reservationStatus")).toContainText("No reservation was sent or confirmed");
});

test("mobile menu opens, closes on Escape, navigates and avoids horizontal scrolling", async ({ page }, testInfo) => {
  if (!testInfo.project.name.includes("mobile")) test.skip();
  await expect(page.locator("#navLinks")).toHaveAttribute("inert", "");
  await page.getByRole("button", { name: "Toggle menu" }).click();
  await expect(page.locator("#navLinks")).toHaveClass(/open/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Toggle menu" })).toBeFocused();
  await page.locator("#hamburger").click();
  await page.getByRole("link", { name: "Gallery", exact: true }).first().click();
  await expect(page).toHaveURL(/\/gallery\/$/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("reduced motion removes decorative transitions while navigation remains functional", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/menu/");
  const duration = await page.locator(".menu-card").first().evaluate(el => getComputedStyle(el).animationDuration);
  expect(["0.00001s", "1e-05s", "0s"]).toContain(duration);
  await expect(page.locator(".menu-card")).toHaveCount(16);
});

test("capture desktop/mobile visual references", async ({ page }, testInfo) => {
  await page.unrouteAll();
  fs.mkdirSync("screenshots", { recursive: true });
  for (const target of ["/", "/menu/", "/gallery/"]) {
    await page.goto(target, { waitUntil: "domcontentloaded" });
    // Scroll to load images that intentionally defer downloading until visible.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const step = Math.max(480, Math.round((await page.evaluate(() => innerHeight)) * .8));
    for (let y = 0; y < height; y += step) {
      await page.evaluate(pos => scrollTo(0, pos), y);
      await page.waitForTimeout(75);
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(950);
    const name = target === "/" ? "home" : target.split("/")[1];
    await page.screenshot({ path: `screenshots/${testInfo.project.name}-${name}.png`, fullPage: true, timeout: 20000 });
  }
});
