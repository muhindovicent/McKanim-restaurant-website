import test from "node:test";
import assert from "node:assert/strict";
import { BranchProvisioningService } from "../dist/onboarding/branch-provisioning.service.js";

const orgId = "550e8400-e29b-41d4-a716-446655440000";
function fakeDatabase({ branchLimit = 1, count = 0, missing = false } = {}) {
  const calls = [];
  const tx = {
    $queryRaw: async (strings, ...values) => {
      calls.push(["lock-organization", values[0]]);
      return missing ? [] : [{ id: orgId, branchLimit }];
    },
    restaurant: {
      count: async (query) => { calls.push(["count", query]); return count; },
      create: async ({ data }) => {
        calls.push(["create", data]);
        return { id: "generated", ...data };
      },
    },
  };
  const prisma = { $transaction: async (callback) => callback(tx) };
  return { calls, prisma };
}

test("new organizations can be provisioned with exactly one unpublished branch", async () => {
  const db = fakeDatabase();
  const service = new BranchProvisioningService(db.prisma);
  const result = await service.provision({ organizationId: orgId, slug: "mckanim", name: "McKanim Pilot" });
  assert.equal(result.organizationId, orgId);
  assert.equal(result.currency, "UGX");
  assert.equal(result.published, false);
  assert.deepEqual(db.calls.map(x => x[0]), ["lock-organization","count","create"]);
  assert.equal(db.calls[1][1].where.organizationId, orgId);
});

test("second branch is rejected before inserting into one-location subscription", async () => {
  const db = fakeDatabase({ count: 1 });
  const service = new BranchProvisioningService(db.prisma);
  await assert.rejects(service.provision({ organizationId: orgId, slug: "branch-two", name: "Branch Two" }),
    error => error.status === 409);
  assert.deepEqual(db.calls.map(x => x[0]), ["lock-organization","count"]);
});

test("multi-location entitlement can be increased without changing the data model", async () => {
  const db = fakeDatabase({ branchLimit: 3, count: 2 });
  const service = new BranchProvisioningService(db.prisma);
  const result = await service.provision({ organizationId: orgId, slug: "third-branch", name: "Third" });
  assert.equal(result.published, false);
  assert.equal(result.slug, "third-branch");
});

test("request cannot invent or borrow an organization", async () => {
  const db = fakeDatabase({ missing: true });
  const service = new BranchProvisioningService(db.prisma);
  await assert.rejects(service.provision({ organizationId: orgId, slug: "other", name: "Other" }),
    error => error.status === 404);
  assert.equal(db.calls.filter(x => x[0] === "create").length, 0);
});

test("rejects invalid input before hitting the database", async () => {
  const db = fakeDatabase();
  const service = new BranchProvisioningService(db.prisma);
  await assert.rejects(service.provision({ organizationId: "another-org", slug: "mckanim", name: "McKanim" }),
    error => error.status === 400);
  await assert.rejects(service.provision({ organizationId: orgId, slug: "../other", name: "McKanim" }),
    error => error.status === 400);
  assert.equal(db.calls.length, 0);
});
