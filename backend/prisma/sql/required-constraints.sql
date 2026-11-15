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
