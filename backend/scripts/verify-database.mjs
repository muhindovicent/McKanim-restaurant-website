import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Client } from "pg";

const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

async function rejectsCode(sql, params, code) {
  await db.query("SAVEPOINT invalid_input");
  try {
    await db.query(sql, params);
    assert.fail("Expected PostgreSQL constraint " + code);
  } catch (error) {
    assert.equal(error.code, code, "Unexpected PostgreSQL error: " + error.message);
  } finally {
    await db.query("ROLLBACK TO SAVEPOINT invalid_input");
    await db.query("RELEASE SAVEPOINT invalid_input");
  }
}

try {
  await db.query("BEGIN");
  const oid = randomUUID();
  const otherOid = randomUUID();
  await db.query(
    'INSERT INTO organizations (id,slug,name,"updatedAt") VALUES ($1,$2,$3,now()), ($4,$5,$6,now())',
    [oid, "ci-tenant-one", "Tenant One", otherOid, "ci-tenant-two", "Tenant Two"]
  );
  const tenantDefault = await db.query(
    'SELECT active FROM organizations WHERE id = $1', [oid]
  );
  assert.equal(tenantDefault.rows[0].active, false, "organizations are disabled before approval");
  const entitlement = await db.query('SELECT "branchLimit" FROM organizations WHERE id = $1', [oid]);
  assert.equal(entitlement.rows[0].branchLimit, 1, "new customer starts with one branch");
  await rejectsCode(
    'UPDATE organizations SET "branchLimit" = 0 WHERE id = $1',
    [oid], "23514"
  );
  const rid = randomUUID();
  const otherRid = randomUUID();
  await db.query(
    `INSERT INTO restaurants (id,"organizationId",slug,name,published,"updatedAt")
     VALUES ($1,$2,$3,$4,false,now()), ($5,$6,$7,$8,false,now())`,
    [rid, oid, "ci-test", "CI Test Restaurant", otherRid, otherOid, "ci-other", "Other Tenant"]
  );
  const firstTenantRestaurants = await db.query(
    'SELECT id FROM restaurants WHERE "organizationId" = $1', [oid]
  );
  assert.deepEqual(firstTenantRestaurants.rows.map(row => row.id), [rid], "tenant filter must not include other organization's restaurant");
  await rejectsCode(
    'INSERT INTO restaurants (id,"organizationId",slug,name,"updatedAt") VALUES ($1,$2,$3,$4,now())',
    [randomUUID(), randomUUID(), "orphan-restaurant", "Missing Tenant"], "23503"
  );
  await rejectsCode(
    'INSERT INTO restaurants (id,"organizationId",slug,name,currency,"updatedAt") VALUES ($1,$2,$3,$4,$5,now())',
    [randomUUID(), oid, "other-ci", "Wrong Currency", "USD"], "23514"
  );

  const tid = randomUUID();
  await db.query(
    'INSERT INTO dining_tables (id,"restaurantId",label,capacity) VALUES ($1,$2,$3,$4)',
    [tid, rid, "T1", 2]
  );
  await rejectsCode(
    'INSERT INTO dining_tables (id,"restaurantId",label,capacity) VALUES ($1,$2,$3,$4)',
    [randomUUID(), rid, "T2", 0], "23514"
  );
  await db.query(
    'INSERT INTO table_sessions (id,"tableId",status) VALUES ($1,$2,$3)',
    [randomUUID(), tid, "ACTIVE"]
  );
  await rejectsCode(
    'INSERT INTO table_sessions (id,"tableId",status) VALUES ($1,$2,$3)',
    [randomUUID(), tid, "ACTIVE"], "23505"
  );

  const cid = randomUUID();
  await db.query(
    'INSERT INTO menu_categories (id,"restaurantId",name) VALUES ($1,$2,$3)',
    [cid, rid, "Mains"]
  );
  await rejectsCode(
    'INSERT INTO menu_items (id,"restaurantId","categoryId",name,description,"priceUGX","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,now())',
    [randomUUID(), rid, cid, "Invalid price", "Must reject zero price", 0], "23514"
  );
  await db.query(
    'INSERT INTO menu_items (id,"restaurantId","categoryId",name,description,"priceUGX","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,now())',
    [randomUUID(), rid, cid, "Synthetic menu item", "CI synthetic food", 35000]
  );

  const unpublished = await db.query('SELECT count(*)::int AS total FROM menu_items WHERE published = true');
  assert.equal(unpublished.rows[0].total, 0, "menu items must be unpublished by default");
  await db.query("ROLLBACK");
  console.log("PostgreSQL constraints passed: tenant organization boundary, foreign key ownership, UGX pricing, positive capacity, unique active session and unpublished defaults");
} catch (error) {
  await db.query("ROLLBACK");
  throw error;
} finally {
  await db.end();
}
