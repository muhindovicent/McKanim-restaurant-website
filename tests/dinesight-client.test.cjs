const test = require("node:test");
const assert = require("node:assert/strict");
const { createClient, DineSightApiError } = require("../integration/dinesight-client.js");

const ORDER_ID = "550e8400-e29b-41d4-a716-446655440000";
const ITEM_ID = "550e8400-e29b-41d4-a716-446655440001";
function fakeTransport(reply = { id: ORDER_ID, status: "PENDING_CONFIRMATION", currency: "UGX" }, code = 201) {
  const calls = [];
  async function request(url, options) {
    calls.push({ url, options });
    return new Response(JSON.stringify(reply), { status: code, headers: { "Content-Type": "application/json" } });
  }
  return { calls, request };
}

test("DineSight integration is opt-in, not a fake checkout", () => {
  assert.throws(() => createClient(), /baseUrl/);
  assert.throws(() => createClient({ baseUrl: "http://example.org/api/v1/" }), /HTTPS/);
  const transport = fakeTransport();
  const api = createClient({ baseUrl: "https://api.example.org/api/v1/", fetchImpl: transport.request });
  assert.equal(transport.calls.length, 0);
  assert.equal(typeof api.submitGuestOrder, "function");
});

test("menu reads from configured versioned API without guest identity", async () => {
  const transport = fakeTransport({ restaurantSlug: "mckanim", currency: "UGX", items: [] }, 200);
  const api = createClient({ baseUrl: "https://api.example.org/api/v1", fetchImpl: transport.request });
  const data = await api.getPublicMenu("mckanim");
  assert.equal(data.currency, "UGX");
  assert.equal(transport.calls[0].url, "https://api.example.org/api/v1/public/restaurants/mckanim/menu");
  assert.equal(transport.calls[0].options.headers.Authorization, undefined);
});

test("submission strips client-supplied prices and table identifiers", async () => {
  const transport = fakeTransport();
  const api = createClient({ baseUrl: "https://api.example.org/api/v1/", fetchImpl: transport.request });
  const res = await api.submitGuestOrder({
    guestAccessToken: "guest-secret", idempotencyKey: ORDER_ID,
    tableId: "attacker-table", subtotalUGX: 1,
    items: [{ menuItemId: ITEM_ID, quantity: 2, unitPriceUGX: 1 }],
    notes: "Less spice"
  });
  assert.equal(res.status, "PENDING_CONFIRMATION");
  const request = transport.calls[0];
  assert.equal(request.url, "https://api.example.org/api/v1/guest/orders");
  assert.equal(request.options.headers.Authorization, "Bearer guest-secret");
  assert.equal(request.options.headers["Idempotency-Key"], ORDER_ID);
  assert.deepEqual(JSON.parse(request.options.body), { items: [{ menuItemId: ITEM_ID, quantity: 2 }], notes: "Less spice" });
});

test("rejects malformed or unscoped actions before network request", async () => {
  const transport = fakeTransport();
  const api = createClient({ baseUrl: "https://api.example.org/api/v1/", fetchImpl: transport.request });
  assert.throws(() => api.getPublicMenu("../admin"), /slug/);
  assert.throws(() => api.requestTableAccess("short"), /QR token/);
  assert.throws(() => api.submitGuestOrder({ guestAccessToken: "guest", idempotencyKey: ORDER_ID, items: [{ menuItemId: ITEM_ID, quantity: 0 }] }), /quantity/);
  assert.throws(() => api.updateOrderStatus({ staffAccessToken: "staff", orderId: ORDER_ID, status: "ACCEPTED" }), /status/);
  assert.equal(transport.calls.length, 0);
});

test("API errors remain errors and are not interpreted as successful orders", async () => {
  const transport = fakeTransport({ code: "TABLE_NOT_CONFIRMED", message: "Waiter confirmation required" }, 409);
  const api = createClient({ baseUrl: "https://api.example.org/api/v1/", fetchImpl: transport.request });
  await assert.rejects(api.submitGuestOrder({ guestAccessToken: "guest", items: [{ menuItemId: ITEM_ID, quantity: 1 }], idempotencyKey: ORDER_ID }),
    error => error instanceof DineSightApiError && error.status === 409 && error.code === "TABLE_NOT_CONFIRMED");
});

test("staff kitchen queue uses staff credentials, never guest credentials", async () => {
  const transport = fakeTransport({ orders: [] }, 200);
  const api = createClient({ baseUrl: "https://api.example.org/api/v1/", fetchImpl: transport.request });
  await api.getKitchenQueue({ staffAccessToken: "staff-session" });
  assert.equal(transport.calls[0].options.headers.Authorization, "Bearer staff-session");
  assert.equal(transport.calls[0].url, "https://api.example.org/api/v1/staff/kitchen/orders");
});
