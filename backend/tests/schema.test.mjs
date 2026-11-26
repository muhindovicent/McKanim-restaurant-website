import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const schema = fs.readFileSync(fileURLToPath(new URL("../prisma/schema.prisma", import.meta.url)), "utf8");
const constraints = fs.readFileSync(fileURLToPath(new URL("../prisma/sql/required-constraints.sql", import.meta.url)), "utf8");
const app = fs.readFileSync(fileURLToPath(new URL("../src/main.ts", import.meta.url)), "utf8");
const menu = fs.readFileSync(fileURLToPath(new URL("../src/menu/public-menu.service.ts", import.meta.url)), "utf8");

test("models define the commercial restaurant and order backbone", () => {
  for (const model of ["Organization","Restaurant","StaffUser","DiningTable","TableQrToken","TableVisit","TableSession","MenuCategory","MenuItem","CustomerOrder","OrderItem","OutboxEvent"]) {
    assert.match(schema, new RegExp("model " + model + " \\{"));
  }
});

test("prices are integer UGX, not client-controlled decimals", () => {
  assert.match(schema, /priceUGX\s+Int/);
  assert.match(schema, /unitPriceUGX\s+Int/);
  assert.match(schema, /lineTotalUGX\s+Int/);
  assert.match(schema, /subtotalUGX\s+Int/);
  assert.match(schema, /currency\s+String\s+@default\("UGX"\)/);
  assert.match(constraints, /CHECK \("priceUGX" > 0\)/);
});

test("one active table session and unique idempotency are specified", () => {
  assert.match(constraints, /CREATE UNIQUE INDEX IF NOT EXISTS one_active_session_per_table/);
  assert.match(constraints, /WHERE status = 'ACTIVE'/);
  assert.match(schema, /@@unique\(\[visitId, idempotencyKey\]\)/);
  assert.match(schema, /guestTokenHash\s+String\s+@unique/);
});

test("unapproved menu entries and restaurants are hidden", () => {
  assert.match(schema, /published\s+Boolean\s+@default\(false\)/);
  assert.match(menu, /where: \{ published: true, available: true \}/);
  assert.match(menu, /!restaurant\.published/);
});

test("HTTPS cross-origin rules and request validation are present", () => {
  assert.match(app, /helmet\(\)/);
  assert.match(app, /credentials: false/);
  assert.match(app, /forbidNonWhitelisted: true/);
});

test("SaaS organizations own restaurant branches and start inactive", () => {
  assert.match(schema, /model Organization \{/);
  assert.match(schema, /organizationId\s+String\s+@db\.Uuid/);
  assert.match(schema, /organization\s+Organization\s+@relation\(fields: \[organizationId\]/);
  assert.match(schema, /active\s+Boolean\s+@default\(false\)/);
  assert.match(schema, /@@index\(\[organizationId, published\]\)/);
});

test("unapproved customer organizations cannot expose public menus", () => {
  assert.match(menu, /organization: \{ select: \{ active: true \} \}/);
  assert.match(menu, /!restaurant\.organization\.active/);
});

test("one-location SaaS starts with a single branch entitlement", () => {
  assert.match(schema, /branchLimit\s+Int\s+@default\(1\)/);
  assert.match(constraints, /branch_limit_positive CHECK \("branchLimit" > 0\)/);
});
