import assert from "node:assert/strict";
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
  const restaurant = await db.query(
    `INSERT INTO restaurants (slug,name,published) VALUES ('ci-test','CI Test Restaurant',false) RETURNING id`
  );
  const rid = restaurant.rows[0].id;
  await rejectsCode(
    'INSERT INTO restaurants (slug,name,currency) VALUES ($1,$2,$3)',
    ['other-ci','Wrong Currency','USD'], '23514'
  );

  const table = await db.query(
    'INSERT INTO dining_tables ("restaurantId",label,capacity) VALUES ($1,$2,$3) RETURNING id',
    [rid, 'T1', 2]
  );
  const tid = table.rows[0].id;
  await rejectsCode(
    'INSERT INTO dining_tables ("restaurantId",label,capacity) VALUES ($1,$2,$3)',
    [rid, 'T2', 0], '23514'
  );
  await db.query('INSERT INTO table_sessions ("tableId",status) VALUES ($1,$2)', [tid,'ACTIVE']);
  await rejectsCode(
    'INSERT INTO table_sessions ("tableId",status) VALUES ($1,$2)',
    [tid,'ACTIVE'], '23505'
  );
  const cat = await db.query(
    'INSERT INTO menu_categories ("restaurantId",name) VALUES ($1,$2) RETURNING id',
    [rid,'Mains']
  );
  await rejectsCode(
    'INSERT INTO menu_items ("restaurantId","categoryId",name,description,"priceUGX") VALUES ($1,$2,$3,$4,$5)',
    [rid, cat.rows[0].id,'Invalid price','Must reject zero price',0], '23514'
  );
  await db.query(
    'INSERT INTO menu_items ("restaurantId","categoryId",name,description,"priceUGX") VALUES ($1,$2,$3,$4,$5)',
    [rid,cat.rows[0].id,'Confirmed sample','CI synthetic food',35000]
  );
  const unpublished = await db.query('SELECT count(*)::int AS total FROM menu_items WHERE published = true');
  assert.equal(unpublished.rows[0].total, 0, "menu items must be unpublished by default");
  await db.query("ROLLBACK");
  console.log("PostgreSQL: price, capacity, currency, session uniqueness and unpublished defaults verified");
} finally {
  await db.end();
}
