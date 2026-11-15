import "reflect-metadata";
import assert from "node:assert/strict";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../dist/generated/prisma/client.js";
import { BranchProvisioningService } from "../dist/onboarding/branch-provisioning.service.js";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const service = new BranchProvisioningService(db);

try {
  const organization = await db.organization.create({
    data: { slug: "concurrent-ci", name: "Concurrent CI Tenant" },
  });

  assert.equal(organization.active, false);
  assert.equal(organization.branchLimit, 1);

  // Two requests may race, but the row lock must serialize the decisions.
  const attempts = await Promise.allSettled([
    service.provision({ organizationId: organization.id, slug: "ci-one", name: "Restaurant One" }),
    service.provision({ organizationId: organization.id, slug: "ci-two", name: "Restaurant Two" }),
  ]);
  const successes = attempts.filter(result => result.status === "fulfilled");
  const failures = attempts.filter(result => result.status === "rejected");
  assert.equal(successes.length, 1, "Exactly one branch should be provisioned");
  assert.equal(failures.length, 1, "Concurrent second branch must be rejected");
  assert.equal(failures[0].reason.status, 409);

  assert.equal(await db.restaurant.count({ where: { organizationId: organization.id } }), 1);
  const first = await db.restaurant.findFirstOrThrow({ where: { organizationId: organization.id } });
  assert.equal(first.published, false, "New restaurant must not go public automatically");
  assert.equal(first.currency, "UGX");

  const other = await db.organization.create({
    data: { slug: "other-ci-tenant", name: "Other CI Tenant" },
  });
  const otherBranch = await service.provision({
    organizationId: other.id, slug: "ci-other-location", name: "Other Tenant Restaurant",
  });
  assert.equal(otherBranch.organizationId, other.id);
  assert.equal(await db.restaurant.count({ where: { organizationId: organization.id } }), 1,
    "Provisioning a different tenant must not affect the first tenant");

  await db.organization.update({
    where: { id: organization.id },
    data: { branchLimit: 2 },
  });
  const additional = await service.provision({
    organizationId: organization.id, slug: "ci-upgraded-location", name: "Upgraded Tenant",
  });
  assert.equal(additional.organizationId, organization.id);
  assert.equal(await db.restaurant.count({ where: { organizationId: organization.id } }), 2);
  console.log("PostgreSQL branch provisioning integration passed: concurrency, tenant scoping, unpublished default, and entitlement upgrade");
} finally {
  await db.$disconnect();
}
