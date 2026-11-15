import "reflect-metadata";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../dist/generated/prisma/client.js";
import { OwnerInvitationService } from "../dist/onboarding/owner-invitation.service.js";
import { verifyOwnerPassword } from "../dist/auth/password.js";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const service = new OwnerInvitationService(db);
const password = "Synthetic test-only passphrase 2026";

try {
  const restaurant = await db.restaurant.findUniqueOrThrow({ where: { slug: "mckanim" } });
  const first = await service.issueOwnerInvitation(restaurant.id, "owner@example.org");
  const oldHash = createHash("sha256").update(first.rawToken).digest("hex");
  const persisted = await db.ownerInvitation.findUniqueOrThrow({ where: { tokenHash: oldHash } });
  assert.equal(persisted.email, "owner@example.org");
  assert.equal(persisted.restaurantId, restaurant.id);
  assert.notEqual(oldHash, first.rawToken);
  assert.equal(persisted.usedAt, null);
  assert.equal(first.rawToken.length, 43);

  const renewed = await service.issueOwnerInvitation(restaurant.id, "OWNER@example.org");
  assert.notEqual(first.rawToken, renewed.rawToken);
  const previous = await db.ownerInvitation.findUniqueOrThrow({ where: { tokenHash: oldHash } });
  assert.ok(previous.revokedAt instanceof Date, "Re-issue revokes previously outstanding token");
  await assert.rejects(
    service.redeemOwnerInvitation({ rawToken: first.rawToken, password, displayName: "Example Owner" }),
    error => error.status === 400,
  );

  const created = await service.redeemOwnerInvitation({
    rawToken: renewed.rawToken, password, displayName: "Example Owner",
  });
  assert.equal(created.restaurantId, restaurant.id);
  assert.equal(created.role, "OWNER");
  assert.equal(created.active, true);

  const owner = await db.staffUser.findUniqueOrThrow({
    where: { restaurantId_email: { restaurantId: restaurant.id, email: "owner@example.org" } },
  });
  assert.match(owner.passwordHash, /^scrypt\$/);
  assert.ok(!owner.passwordHash.includes(password));
  assert.equal(await verifyOwnerPassword(password, owner.passwordHash), true);

  await assert.rejects(
    service.redeemOwnerInvitation({ rawToken: renewed.rawToken, password, displayName: "Example Owner" }),
    error => error.status === 400,
  );

  const anotherRestaurant = await db.restaurant.findUniqueOrThrow({
    where: { slug: "ci-other-location" },
  });
  const anotherTenant = await service.issueOwnerInvitation(anotherRestaurant.id, "owner@example.org");
  const anotherRecord = await db.ownerInvitation.findUniqueOrThrow({
    where: { tokenHash: createHash("sha256").update(anotherTenant.rawToken).digest("hex") },
  });
  assert.equal(anotherRecord.restaurantId, anotherRestaurant.id);
  assert.notEqual(anotherRecord.restaurantId, restaurant.id);

  // Keep the database CHECK (expiresAt > createdAt) valid while simulating expiry.
  await db.ownerInvitation.update({
    where: { id: anotherRecord.id },
    data: { expiresAt: new Date(anotherRecord.createdAt.getTime() + 1) },
  });
  await new Promise(resolve => setTimeout(resolve, 20));
  await assert.rejects(
    service.redeemOwnerInvitation({ rawToken: anotherTenant.rawToken, password, displayName: "Example Owner" }),
    error => error.status === 400,
  );
  assert.equal(await db.staffUser.count({ where: { restaurantId: anotherRestaurant.id } }), 0);
  assert.equal(await db.staffUser.count({ where: { restaurantId: restaurant.id } }), 1);

  console.log("Owner invitation PostgreSQL tests passed: one-time, 24h expiry, reissue revocation, salted password, cross-tenant isolation");
} finally {
  await db.$disconnect();
}
