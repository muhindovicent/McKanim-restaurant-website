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
  const initialItems = await page.locator(".menu-card").count();
  expect(initialItems).toBeGreaterThan(5);
  await expect(page.locator(".gallery-item")).not.toHaveCount(0);
  expect(errors).toEqual([]);
});

test("category filters update menu items and pressed state", async ({ page }) => {
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
