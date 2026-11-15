-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'MANAGER', 'WAITER', 'CHEF', 'CLEANER', 'CASHIER');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'PENDING_CONFIRMATION', 'IN_SERVICE', 'NEEDS_CLEANING', 'CLEANING', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_CONFIRMATION', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "branchLimit" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "organizationId" UUID NOT NULL,
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'UGX',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_invitations" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owner_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_users" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "StaffRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dining_tables" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "label" VARCHAR(30) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dining_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_qr_tokens" (
    "id" UUID NOT NULL,
    "tableId" UUID NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "table_qr_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_visits" (
    "id" UUID NOT NULL,
    "tableId" UUID NOT NULL,
    "guestTokenHash" VARCHAR(128) NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "table_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_sessions" (
    "id" UUID NOT NULL,
    "tableId" UUID NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "table_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_categories" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" VARCHAR(1200) NOT NULL,
    "priceUGX" INTEGER NOT NULL,
    "imageUrl" VARCHAR(2048),
    "available" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_orders" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "visitId" UUID NOT NULL,
    "sessionId" UUID,
    "confirmedById" UUID,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "currency" CHAR(3) NOT NULL DEFAULT 'UGX',
    "subtotalUGX" INTEGER NOT NULL,
    "idempotencyKey" UUID NOT NULL,
    "requestHash" VARCHAR(128) NOT NULL,
    "notes" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "menuItemId" UUID NOT NULL,
    "nameSnapshot" VARCHAR(160) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceUGX" INTEGER NOT NULL,
    "lineTotalUGX" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "aggregateId" UUID NOT NULL,
    "eventType" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatchedAt" TIMESTAMP(3),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_slug_key" ON "restaurants"("slug");

-- CreateIndex
CREATE INDEX "restaurants_organizationId_published_idx" ON "restaurants"("organizationId", "published");

-- CreateIndex
CREATE UNIQUE INDEX "owner_invitations_tokenHash_key" ON "owner_invitations"("tokenHash");

-- CreateIndex
CREATE INDEX "owner_invitations_restaurantId_email_idx" ON "owner_invitations"("restaurantId", "email");

-- CreateIndex
CREATE INDEX "owner_invitations_expiresAt_usedAt_idx" ON "owner_invitations"("expiresAt", "usedAt");

-- CreateIndex
CREATE INDEX "staff_users_restaurantId_role_idx" ON "staff_users"("restaurantId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_restaurantId_email_key" ON "staff_users"("restaurantId", "email");

-- CreateIndex
CREATE INDEX "dining_tables_restaurantId_status_idx" ON "dining_tables"("restaurantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "dining_tables_restaurantId_label_key" ON "dining_tables"("restaurantId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "table_qr_tokens_tokenHash_key" ON "table_qr_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "table_qr_tokens_tableId_revokedAt_idx" ON "table_qr_tokens"("tableId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "table_visits_guestTokenHash_key" ON "table_visits"("guestTokenHash");

-- CreateIndex
CREATE INDEX "table_visits_tableId_status_idx" ON "table_visits"("tableId", "status");

-- CreateIndex
CREATE INDEX "table_sessions_tableId_status_idx" ON "table_sessions"("tableId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_restaurantId_name_key" ON "menu_categories"("restaurantId", "name");

-- CreateIndex
CREATE INDEX "menu_items_restaurantId_published_available_idx" ON "menu_items"("restaurantId", "published", "available");

-- CreateIndex
CREATE INDEX "customer_orders_restaurantId_status_createdAt_idx" ON "customer_orders"("restaurantId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "customer_orders_visitId_idempotencyKey_key" ON "customer_orders"("visitId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "outbox_events_dispatchedAt_createdAt_idx" ON "outbox_events"("dispatchedAt", "createdAt");

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_invitations" ADD CONSTRAINT "owner_invitations_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dining_tables" ADD CONSTRAINT "dining_tables_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_qr_tokens" ADD CONSTRAINT "table_qr_tokens_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "dining_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_visits" ADD CONSTRAINT "table_visits_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "dining_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "dining_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "menu_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "table_visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "table_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "customer_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PostgreSQL constraints to fold into the first generated Prisma migration.
-- This file is NOT auto-applied. Do not mark as deployed.
-- Prisma schema cannot express all checks and conditional uniqueness rules.
CREATE UNIQUE INDEX IF NOT EXISTS one_active_session_per_table
  ON table_sessions ("tableId") WHERE status = 'ACTIVE';

ALTER TABLE dining_tables
  ADD CONSTRAINT capacity_positive CHECK (capacity > 0);
ALTER TABLE menu_items
  ADD CONSTRAINT positive_menu_price_ugx CHECK ("priceUGX" > 0);
ALTER TABLE customer_orders
  ADD CONSTRAINT nonnegative_order_subtotal_ugx CHECK ("subtotalUGX" >= 0);
ALTER TABLE order_items
  ADD CONSTRAINT positive_order_item_quantity CHECK (quantity > 0),
  ADD CONSTRAINT nonnegative_snapshot_price CHECK ("unitPriceUGX" >= 0),
  ADD CONSTRAINT correct_line_total CHECK ("lineTotalUGX" = "unitPriceUGX" * quantity);
ALTER TABLE restaurants
  ADD CONSTRAINT restaurant_currency_ugx CHECK (currency = 'UGX');
ALTER TABLE customer_orders
  ADD CONSTRAINT order_currency_ugx CHECK (currency = 'UGX');

-- Commercial branch limit: a new client starts with one approved restaurant location.
ALTER TABLE organizations ADD CONSTRAINT branch_limit_positive CHECK ("branchLimit" > 0);

-- Only one currently outstanding (unused/unrevoked) invitation to an email per restaurant.
-- Re-issue must revoke a previous invitation in the same transaction.
CREATE UNIQUE INDEX IF NOT EXISTS one_outstanding_owner_invite_per_email
  ON owner_invitations ("restaurantId", email)
  WHERE "usedAt" IS NULL AND "revokedAt" IS NULL;

ALTER TABLE owner_invitations
  ADD CONSTRAINT owner_invitation_expiry_after_creation CHECK ("expiresAt" > "createdAt");
