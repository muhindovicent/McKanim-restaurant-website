import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localVisitToUTC, ReservationsService } from "../dist/reservations/reservations.service.js";

function visitDateInThreeDays() {
  return new Date(Date.now() + 3 * 86400000 + 3 * 3600000).toISOString().slice(0, 10);
}
function input() {
  return {
    idempotencyKey: randomUUID(),
    guestName: "Synthetic Guest",
    guestPhone: "+256 700 111 222",
    visitDate: visitDateInThreeDays(),
    visitTime: "18:00",
    partySize: 3,
    guestEmail: "guest@example.test",
    notes: "Birthday request",
  };
}
function mocks({ enabled = true, published = true, active = true, existing = null, rateCount = 0 } = {}) {
  const calls = [];
  const record = { id: randomUUID(), status: "PENDING_REVIEW" };
  const db = {
    restaurant: {
      findUnique: async (args) => {
        calls.push(["restaurant", args]);
        return { id: "tenant-a", published, reservationRequestsEnabled: true, organization: { active } };
      },
    },
    reservationRequest: {
      findUnique: async () => existing,
      count: async () => rateCount,
      create: async ({ data }) => { calls.push(["create", data]); return record; },
    },
  };
  const config = { get: () => enabled ? "enabled" : "disabled" };
  return { calls, record, service: new ReservationsService(db, config) };
}

test("local date conversion uses Kampala UTC+3 and rejects impossible dates", () => {
  const date = localVisitToUTC("2027-06-10", "18:30", new Date("2027-06-09T09:00:00Z"));
  assert.equal(date.toISOString(), "2027-06-10T15:30:00.000Z");
  assert.throws(() => localVisitToUTC("2027-02-30","18:30",new Date("2027-02-01")), /calendar date/);
  assert.throws(() => localVisitToUTC("2027-06-10","25:00",new Date("2027-06-09")), /valid date and time/);
  assert.throws(() => localVisitToUTC("2027-06-10","18:30",new Date("2027-06-10T15:00:00Z")), /between 1 hour/);
});

test("no public submissions unless global and tenant flags are enabled", async () => {
  const disabled = mocks({ enabled: false });
  assert.equal((await disabled.service.publicConfig("mckanim")).acceptingRequests, false);
  await assert.rejects(disabled.service.submit("mckanim", input()), e => e.status === 503);
  for(const opts of [{ published: false }, { active: false }]) {
    const tenant = mocks(opts);
    assert.equal((await tenant.service.publicConfig("mckanim")).acceptingRequests, false);
    await assert.rejects(tenant.service.submit("mckanim", input()), e => e.status === 503);
  }
});

test("eligible request is recorded, scoped, pending review and returns a reference", async () => {
  const { service, calls, record } = mocks();
  const result = await service.submit("mckanim", input());
  assert.equal(result.status, "PENDING_REVIEW");
  assert.equal(result.confirmed, false);
  assert.equal(result.reference, record.id);
  assert.match(result.message, /NOT a confirmed/i);
  const inserted = calls.find(x => x[0] === "create")[1];
  assert.equal(inserted.restaurantId, "tenant-a");
  assert.equal(inserted.guestPhone, "+256700111222");
  assert.equal(inserted.partySize, 3);
  assert.equal(inserted.timeZone, "Africa/Kampala");
  assert.match(inserted.requestHash, /^[a-f0-9]{64}$/);
});

test("bad inputs and abusive volume fail before database writes", async () => {
  const invalid = mocks();
  await assert.rejects(invalid.service.submit("mckanim",{ ...input(), partySize:3, visitDate:"2027-02-30" }), e=>e.status===400);
  await assert.rejects(invalid.service.submit("mckanim",{ ...input(), guestPhone:"hello" }), e=>e.status===400);
  await assert.rejects(invalid.service.submit("mckanim",{ ...input(), website:"spam.invalid" }), e=>e.status===400);
  assert.equal(invalid.calls.filter(x=>x[0]==="create").length,0);
  const limited = mocks({rateCount:3});
  await assert.rejects(limited.service.submit("mckanim",input()), e=>e.status===429);
});

test("duplicate matching request returns existing receipt without another write", async () => {
  const draft = input();
  const first = mocks();
  const original = await first.service.submit("mckanim", draft);
  const row = first.calls.find(x=>x[0]==="create")[1];
  const duplicate = mocks({existing:{id:original.reference,status:"PENDING_REVIEW",requestHash:row.requestHash}});
  const receipt = await duplicate.service.submit("mckanim", draft);
  assert.equal(receipt.reference,original.reference);
  assert.equal(duplicate.calls.filter(x=>x[0]==="create").length,0);
  const malicious = mocks({existing:{id:original.reference,status:"PENDING_REVIEW",requestHash:"other"}});
  await assert.rejects(malicious.service.submit("mckanim",draft), e=>e.status===409);
});
