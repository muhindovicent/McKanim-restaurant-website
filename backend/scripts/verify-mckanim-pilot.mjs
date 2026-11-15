import "reflect-metadata";
import assert from "node:assert/strict";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../dist/generated/prisma/client.js";
import { ensureMcKanimPilot, MCKANIM_PILOT } from "../dist/onboarding/mckanim-bootstrap.js";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

try {
  const first = await ensureMcKanimPilot(db);
  const second = await ensureMcKanimPilot(db);
  assert.equal(first.organization.id, second.organization.id, "Bootstrapping twice must not duplicate tenant");
  assert.equal(first.restaurant.id, second.restaurant.id, "Bootstrapping twice must not duplicate restaurant");
  assert.equal(first.organization.slug, "mckanim");
  assert.equal(first.restaurant.slug, "mckanim");
  assert.equal(first.restaurant.name, "McKanim Restaurant");
  assert.equal(first.restaurant.currency, "UGX");
  assert.equal(first.organization.active, false, "Must not activate client account before approval");
  assert.equal(first.restaurant.published, false, "Must not publish menu or restaurant");
  assert.equal(first.organization.branchLimit, 1);
  assert.equal(MCKANIM_PILOT.restaurantName, "McKanim Restaurant");
  assert.equal(await db.organization.count({ where: { slug: "mckanim" } }), 1);
  assert.equal(await db.restaurant.count({ where: { organizationId: first.organization.id } }), 1);
  assert.equal(await db.staffUser.count({ where: { restaurantId: first.restaurant.id } }), 0,
    "No seeded staff accounts or default passwords are permitted");
  assert.equal(await db.menuItem.count({ where: { restaurantId: first.restaurant.id } }), 0,
    "Do not turn sample menu items into live customer offers");
  console.log("McKanim pilot bootstrap passed: branded first tenant, idempotent, unpublished, no staff credentials or menu items");
} finally {
  await db.$disconnect();
}
