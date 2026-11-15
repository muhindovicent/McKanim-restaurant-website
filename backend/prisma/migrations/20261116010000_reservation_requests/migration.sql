-- Phase 10: reservation REQUESTS, not confirmed capacity bookings.
-- All customer organizations remain opted out until the operator explicitly enables requests.
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING_REVIEW', 'CONFIRMED', 'DECLINED', 'CANCELLED');

ALTER TABLE "restaurants"
  ADD COLUMN "reservationRequestsEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "reservation_requests" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "idempotencyKey" UUID NOT NULL,
    "requestHash" CHAR(64) NOT NULL,
    "guestName" VARCHAR(120) NOT NULL,
    "guestPhone" VARCHAR(20) NOT NULL,
    "guestEmail" VARCHAR(255),
    "requestedFor" TIMESTAMP(3) NOT NULL,
    "visitDate" VARCHAR(10) NOT NULL,
    "visitTime" VARCHAR(5) NOT NULL,
    "timeZone" VARCHAR(60) NOT NULL DEFAULT 'Africa/Kampala',
    "partySize" INTEGER NOT NULL,
    "notes" VARCHAR(500),
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reservation_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reservation_requests_party_size" CHECK ("partySize" BETWEEN 1 AND 12),
    CONSTRAINT "reservation_requests_visit_time" CHECK ("visitTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    CONSTRAINT "reservation_requests_visit_date" CHECK ("visitDate" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
);

CREATE UNIQUE INDEX "reservation_requests_restaurantId_idempotencyKey_key"
  ON "reservation_requests"("restaurantId", "idempotencyKey");
CREATE INDEX "reservation_requests_restaurantId_requestedFor_status_idx"
  ON "reservation_requests"("restaurantId", "requestedFor", "status");
CREATE INDEX "reservation_requests_restaurantId_guestPhone_createdAt_idx"
  ON "reservation_requests"("restaurantId", "guestPhone", "createdAt");

ALTER TABLE "reservation_requests"
  ADD CONSTRAINT "reservation_requests_restaurantId_fkey" FOREIGN KEY ("restaurantId")
  REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
