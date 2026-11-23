/* Phase 8 integration adapter — NOT loaded by the public concept website.
 * Requires a configured HTTPS backend. Does not activate checkout.
 * Authoritative prices and authorization always belong to the DineSight API.
 */
(function (root, factory) {
  "use strict";
  const exports = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = exports;
  if (root) root.DineSightIntegration = exports;
})(typeof window === "undefined" ? null : window, function () {
  "use strict";
  class DineSightApiError extends Error {
    constructor(status, code, message) {
      super(message);
      this.name = "DineSightApiError";
      this.status = status;
      this.code = code;
    }
  }
  function requireToken(value, name) {
    if (typeof value !== "string" || !value.trim() || /[\r\n]/.test(value)) {
      throw new TypeError(name + " must be a non-empty credential");
    }
    return value.trim();
  }
  function requireUuid(value, name) {
    if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      throw new TypeError(name + " must be a UUID");
    }
    return value;
  }
  function createClient({ baseUrl, fetchImpl } = {}) {
    if (!baseUrl || typeof baseUrl !== "string") throw new TypeError("An explicit DineSight API baseUrl is required");
    const base = new URL(baseUrl.endsWith("/") ? baseUrl : baseUrl + "/");
    const local = base.hostname === "localhost" || base.hostname === "127.0.0.1";
    if (base.protocol !== "https:" && !(base.protocol === "http:" && local)) {
      throw new TypeError("DineSight API must use HTTPS except for local development");
    }
    if (!base.pathname.endsWith("/api/v1/")) throw new TypeError("baseUrl must finish with /api/v1/");
    const transport = fetchImpl || (typeof fetch === "function" ? fetch.bind(globalThis) : null);
    if (typeof transport !== "function") throw new TypeError("fetch implementation is required");
    async function request(path, { method = "GET", token, idempotencyKey, body } = {}) {
      const headers = { Accept: "application/json" };
      if (body !== undefined) headers["Content-Type"] = "application/json";
      if (token !== undefined) headers.Authorization = "Bearer " + requireToken(token, "token");
      if (idempotencyKey !== undefined) headers["Idempotency-Key"] = requireUuid(idempotencyKey, "idempotencyKey");
      const response = await transport(new URL(path, base).toString(), {
        method, headers, body: body === undefined ? undefined : JSON.stringify(body),
        credentials: "omit", cache: "no-store"
      });
      let data;
      try { data = await response.json(); } catch (_) { data = null; }
      if (!response.ok) {
        const error = data && typeof data === "object" ? data : {};
        throw new DineSightApiError(response.status, error.code || "API_ERROR", error.message || "Request failed");
      }
      return data;
    }
    return Object.freeze({
      getPublicMenu(restaurantSlug) {
        if (typeof restaurantSlug !== "string" || !/^[a-z0-9-]{2,80}$/.test(restaurantSlug)) {
          throw new TypeError("Invalid restaurant slug");
        }
        return request("public/restaurants/" + restaurantSlug + "/menu");
      },
      requestTableAccess(qrToken) {
        const token = requireToken(qrToken, "qrToken");
        if (token.length < 20 || token.length > 256) throw new TypeError("Invalid QR token length");
        return request("guest/table-access", { method: "POST", body: { qrToken: token } });
      },
      submitGuestOrder({ guestAccessToken, items, idempotencyKey, notes } = {}) {
        requireToken(guestAccessToken, "guestAccessToken");
        if (!Array.isArray(items) || items.length < 1 || items.length > 30) throw new TypeError("Order items required");
        const normalizedItems = items.map(item => {
          if (!item || typeof item !== "object") throw new TypeError("Invalid item");
          const menuItemId = requireUuid(item.menuItemId, "menuItemId");
          if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) throw new TypeError("Invalid item quantity");
          return { menuItemId, quantity: item.quantity };
        });
        if (notes !== undefined && (typeof notes !== "string" || notes.length > 300)) throw new TypeError("Invalid notes");
        const key = requireUuid(idempotencyKey, "idempotencyKey");
        return request("guest/orders", { method: "POST", token: guestAccessToken, idempotencyKey: key,
          body: { items: normalizedItems, ...(notes === undefined ? {} : { notes }) } });
      },
      getOwnOrder({ guestAccessToken, orderId } = {}) {
        const safeId = requireUuid(orderId, "orderId");
        return request("guest/orders/" + safeId, { token: guestAccessToken });
      },
      getKitchenQueue({ staffAccessToken } = {}) {
        return request("staff/kitchen/orders", { token: staffAccessToken });
      },
      confirmOrder({ staffAccessToken, orderId } = {}) {
        return request("staff/orders/" + requireUuid(orderId, "orderId") + "/confirm",
          { method: "POST", token: staffAccessToken });
      },
      updateOrderStatus({ staffAccessToken, orderId, status } = {}) {
        if (!["PREPARING", "READY", "SERVED", "CANCELLED"].includes(status)) throw new TypeError("Unsupported status");
        return request("staff/orders/" + requireUuid(orderId, "orderId") + "/status",
          { method: "PATCH", token: staffAccessToken, body: { status } });
      }
    });
  }
  return Object.freeze({ createClient, DineSightApiError });
});
