const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

async function audit(page, name) {
  // Axe automated tests detect common accessibility problems; manual review is still required.
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const issues = result.violations.map(v => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    nodes: v.nodes.slice(0, 5).map(n => ({ target: n.target, summary: n.failureSummary }))
  }));
  expect(issues, name + " accessibility violations:\n" + JSON.stringify(issues, null, 2)).toEqual([]);
}

test("automated accessibility audit: homepage", async ({ page }) => {
  await page.goto("/");
  await audit(page, "homepage");
});

test("automated accessibility audit: menu selection drawer", async ({ page }) => {
  await page.goto("/");
  await page.locator("#cartBtn").click();
  await expect(page.locator("#cartDrawer")).toHaveClass(/open/);
  await audit(page, "menu selection");
});

test("automated accessibility audit: ordering information dialog", async ({ page }) => {
  await page.goto("/menu");
  await page.locator(".menu-card .add-btn").first().click();
  await page.locator("#cartBtn").click();
  await page.locator("#checkoutBtn").click();
  await expect(page.locator("#checkoutModal")).toBeVisible();
  await audit(page, "ordering information");
});

test("automated accessibility audit: route-based navigation and gallery lightbox", async ({ page }) => {
  await page.goto("/gallery");
  await audit(page, "gallery page");
  await page.locator(".gallery-open").first().click();
  await expect(page.locator("#galleryLightbox")).toBeVisible();
  await audit(page, "gallery lightbox");
});

test("automated accessibility audit: reservation and reviews information", async ({ page }) => {
  await page.goto("/reservations");
  await audit(page, "reservations");
  await page.goto("/reviews");
  await audit(page, "reviews");
});
