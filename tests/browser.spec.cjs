const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/(images\.unsplash\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|videos\.pexels\.com)\//, route => route.abort());
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

test("primary navigation opens immediate clean routes and respects history", async ({ page }, testInfo) => {
  const isMobile = testInfo.project.name.includes("mobile");
  const links = [["Menu","/menu"],["About","/about"],["Gallery","/gallery"],["Reviews","/reviews"],["Reservations","/reservations"],["Contact","/contact"],["Home","/"]];
  for (const [label, path] of links) {
    if (isMobile) await page.getByRole("button", { name: "Toggle menu" }).click();
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(path === "/" ? "/$" : path + "$"));
    await expect(page.locator('[data-page]:not([hidden]) h1')).toHaveCount(1);
    await expect(page.locator(`#navLinks .nav-link[data-route="${path === "/" ? "home" : path === "/reservations" ? "reserve" : path.slice(1)}"]`)).toHaveAttribute("aria-current","page");
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
  const first = page.getByRole("button", { name: /View photograph 1 of 8/ });
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
  await expect(page.getByText(/Confirmed reservations require direct staff approval/i)).toBeVisible();
});

test("downloadable preview remains navigable from a local HTML file", async ({ page }) => {
  await page.goto("file://" + path.resolve(__dirname, "../index.html"));
  await expect(page.locator("#home")).toBeVisible();
  await page.locator(".hero-cta a[data-route=menu]").click();
  await expect(page.locator("#menu")).toBeVisible();
  await expect(page.locator(".menu-card")).toHaveCount(16);
  await expect(page.locator("#cartSubtotal")).toHaveText("UGX 0");
});

const reservationConfigUrl = "https://dinesight-api-staging.onrender.com/api/v1/public/restaurants/mckanim/reservation-requests/config";
const reservationPostUrl = "https://dinesight-api-staging.onrender.com/api/v1/public/restaurants/mckanim/reservation-requests";
const reservationHeaders = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type"};

async function setReservationAvailability(page, available) {
  await page.route(reservationConfigUrl, route => route.fulfill({
    status:200,headers:reservationHeaders,contentType:"application/json",
    body:JSON.stringify({acceptingRequests:available,bookingConfirmedAutomatically:false}),
  }));
}
async function fillReservation(page) {
  await page.locator("#reservationName").fill("Test Guest");
  await page.locator("#reservationPhone").fill("+256 700 111 222");
  const date = new Date(Date.now()+3*86400000+3*3600000).toISOString().slice(0,10);
  await page.locator("#reservationDate").fill(date);
  await page.locator("#reservationTime").fill("18:30");
  await page.locator("#reservationParty").selectOption("2");
  await page.locator("#reservationConsent").check();
}

test("reservation requests remain unavailable unless the restaurant approves them", async ({page}) => {
  await setReservationAvailability(page,false);
  await page.goto("/reservations");
  await expect(page.locator("#reservationForm")).toBeHidden();
  await expect(page.locator("#reservationAvailability")).toContainText("not active yet");
});

test("server-accepted reservation requests show pending review, not confirmed", async ({page}) => {
  await setReservationAvailability(page,true);
  let submits=0;
  await page.route(reservationPostUrl,route=>{
    if(route.request().method()==="OPTIONS")return route.fulfill({status:204,headers:reservationHeaders});
    const body=route.request().postDataJSON();
    expect(body.guestName).toBe("Test Guest");
    expect(body.partySize).toBe(2);
    expect(body.idempotencyKey).toMatch(/^[a-f0-9-]{36}$/);
    submits++;
    return route.fulfill({status:202,headers:reservationHeaders,contentType:"application/json",
      body:JSON.stringify({reference:"550e8400-e29b-41d4-a716-446655440000",status:"PENDING_REVIEW",confirmed:false})});
  });
  await page.goto("/reservations");
  await expect(page.locator("#reservationForm")).toBeVisible();
  await fillReservation(page);
  await page.locator("#reservationSubmit").click();
  await expect(page.locator("#reservationReceipt")).toBeVisible();
  await expect(page.locator("#reservationReceipt")).toContainText("Pending review");
  await expect(page.locator("#reservationReceipt")).toContainText("not confirmed");
  expect(submits).toBe(1);
});

test("booking API failures never create an invented success", async ({page}) => {
  await setReservationAvailability(page,true);
  await page.route(reservationPostUrl,route=>{
    if(route.request().method()==="OPTIONS")return route.fulfill({status:204,headers:reservationHeaders});
    return route.fulfill({status:503,headers:reservationHeaders,contentType:"application/json",body:'{"message":"Unavailable"}'});
  });
  await page.goto("/reservations");
  await fillReservation(page);
  await page.locator("#reservationSubmit").click();
  await expect(page.locator("#reservationError")).toBeVisible();
  await expect(page.locator("#reservationReceipt")).toBeHidden();
  await expect(page.locator("#reservationSubmit")).toBeEnabled();
});

test("cinematic film has a static fallback for reduced-motion visitors",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
  await expect(page.locator("#heroMotionToggle")).toBeHidden();
  await expect(page.locator(".hero-cinema-poster")).toBeVisible();
  await expect(page.locator("#heroCinemaVideo")).not.toBeVisible();
});
