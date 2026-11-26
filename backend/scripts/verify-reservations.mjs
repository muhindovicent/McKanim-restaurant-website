import "reflect-metadata";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../dist/generated/prisma/client.js";
import { ReservationsService } from "../dist/reservations/reservations.service.js";

const db = new PrismaClient({ adapter:new PrismaPg({ connectionString:process.env.DATABASE_URL }) });
const service = new ReservationsService(db,{ get:()=> "enabled" });
const closed = new ReservationsService(db,{ get:()=> "disabled" });
const tomorrow = new Date(Date.now()+3*86400000 + 3*3600000).toISOString().slice(0,10);
const guest = {
  guestName:"Integration Guest", guestPhone:"+256 700 000 111",
  guestEmail:"integration@example.test", visitDate:tomorrow, visitTime:"17:30",
  partySize:2, notes:"Test-only special occasion", idempotencyKey:randomUUID(),
};
try {
  const tenant = await db.organization.create({
    data:{slug:"reservation-ci-tenant",name:"Reservation CI Tenant",active:true},
  });
  const restaurant = await db.restaurant.create({
    data:{organizationId:tenant.id,slug:"reservation-ci",name:"Reservation CI",published:true,
      reservationRequestsEnabled:true},
  });
  const second = await db.organization.create({
    data:{slug:"reservation-other-tenant",name:"Other Tenant",active:true},
  });
  await db.restaurant.create({
    data:{organizationId:second.id,slug:"reservation-other",name:"Other Tenant",published:true,
      reservationRequestsEnabled:false},
  });
  assert.equal((await closed.publicConfig("reservation-ci")).acceptingRequests,false);
  assert.equal((await service.publicConfig("reservation-ci")).acceptingRequests,true);
  assert.equal((await service.publicConfig("reservation-other")).acceptingRequests,false);
  await assert.rejects(service.submit("reservation-other",guest),e=>e.status===503);

  const accepted = await service.submit("reservation-ci",guest);
  assert.equal(accepted.status,"PENDING_REVIEW");
  assert.equal(accepted.confirmed,false);
  const repeat = await service.submit("reservation-ci",guest);
  assert.equal(accepted.reference,repeat.reference);

  const row = await db.reservationRequest.findUniqueOrThrow({where:{id:accepted.reference}});
  assert.equal(row.restaurantId,restaurant.id);
  assert.equal(row.guestPhone,"+256700000111");
  assert.equal(row.visitDate,guest.visitDate);
  assert.equal(row.timeZone,"Africa/Kampala");
  assert.match(row.requestHash,/^[0-9a-f]{64}$/);
  assert.equal(await db.reservationRequest.count({where:{restaurantId:restaurant.id}}),1);
  await assert.rejects(service.submit("reservation-ci",{...guest,partySize:4}),e=>e.status===409);

  await service.submit("reservation-ci",{...guest,idempotencyKey:randomUUID(),visitTime:"18:00"});
  await service.submit("reservation-ci",{...guest,idempotencyKey:randomUUID(),visitTime:"18:30"});
  await assert.rejects(service.submit("reservation-ci",{...guest,idempotencyKey:randomUUID(),visitTime:"19:00"}),e=>e.status===429);

  // Database-level constraints prevent bypass by a future unvalidated caller.
  await assert.rejects(db.reservationRequest.create({data:{
    restaurantId:restaurant.id,guestName:"No",guestPhone:"+256700000111",partySize:0,
    visitDate:tomorrow,visitTime:"18:00",requestedFor:new Date(),requestHash:"a".repeat(64),
    idempotencyKey:randomUUID(),
  }}),e => Boolean(e));
  assert.equal(await db.reservationRequest.count({where:{restaurantId:second.id}}),0);
  console.log("Reservation PostgreSQL integration passed: gates, persistence, idempotency, tenant bounds, rate limit, constraints.");
} finally { await db.$disconnect(); }
