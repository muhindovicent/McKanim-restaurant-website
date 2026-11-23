const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const contract = JSON.parse(fs.readFileSync(path.join(root, "contracts/dinesight-openapi.json"), "utf8"));
const website = fs.readFileSync(path.join(root, "index.html"), "utf8");

test("OpenAPI is explicit, versioned, and still a draft", () => {
  assert.equal(contract.openapi, "3.1.1");
  assert.match(contract.info.version, /draft/);
  assert.equal(contract.servers[0].url, "/api/v1");
});

test("public menu exposes UGX only; orders are priced by backend", () => {
  assert.equal(contract.components.schemas.PublicMenu.properties.currency.const, "UGX");
  const request = contract.components.schemas.SubmitOrderRequest.properties;
  const item = contract.components.schemas.OrderItemRequest.properties;
  assert.deepEqual(Object.keys(item).sort(), ["menuItemId", "quantity"]);
  assert.equal(item.quantity.minimum, 1);
  assert.equal(request.items.minItems, 1);
  assert.equal(contract.components.schemas.Order.properties.currency.const, "UGX");
  assert.equal(contract.components.schemas.Order.properties.subtotalUGX.type, "integer");
});

test("guest submission needs a credential and idempotency key", () => {
  const post = contract.paths["/guest/orders"].post;
  assert.deepEqual(post.security, [{ GuestBearer: [] }]);
  assert.equal(post.parameters.find(p => p.name === "Idempotency-Key").required, true);
  assert.equal(post.responses["201"].description, "New pending order saved");
  assert.ok(post.responses["409"]);
});

test("QR scans do not immediately confirm table occupancy", () => {
  const open = contract.paths["/guest/table-access"].post;
  assert.equal(open.security.length, 0);
  assert.equal(contract.components.schemas.TableAccessResponse.properties.status.const, "PENDING_CONFIRMATION");
  assert.deepEqual(contract.paths["/staff/orders/{orderId}/confirm"].post["x-roles"], ["WAITER", "MANAGER"]);
});

test("kitchen endpoints are staff-only and cannot be invoked by guest tokens", () => {
  const paths = ["/staff/kitchen/orders", "/staff/orders/{orderId}/confirm", "/staff/orders/{orderId}/status"];
  for (const path of paths) {
    const operation = Object.values(contract.paths[path])[0];
    assert.deepEqual(operation.security, [{ StaffBearer: [] }]);
    assert.ok(operation["x-roles"].length);
  }
});

test("application continues as concept; no real API script is loaded", () => {
  assert.doesNotMatch(website, /src="integration\/dinesight-client\.js"/);
  assert.match(website, /Online ordering is not active yet/);
  assert.match(website, /content\/site-content\.js/);
});

test("all local OpenAPI references resolve", () => {
  function check(value) {
    if (!value || typeof value !== "object") return;
    if (typeof value.$ref === "string") {
      assert.ok(value.$ref.startsWith("#/components/schemas/"));
      assert.ok(contract.components.schemas[value.$ref.split("/").at(-1)], value.$ref);
    }
    for (const v of Object.values(value)) check(v);
  }
  check(contract.paths);
  check(contract.components.schemas);
});
