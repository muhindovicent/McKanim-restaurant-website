import test from "node:test";
import assert from "node:assert/strict";
import { hashOwnerPassword, verifyOwnerPassword, validateOwnerPassword } from "../dist/auth/password.js";

test("owner password policy requires long passwords and protects maximum length", () => {
  assert.throws(() => validateOwnerPassword("weak"), /12/);
  assert.throws(() => validateOwnerPassword("x".repeat(1025)), /12/);
  assert.doesNotThrow(() => validateOwnerPassword("a strong passphrase 2026"));
});

test("scrypt password hashing includes a random salt and verifies without exposing plaintext", async () => {
  const password = "Synthetic non-production demo passphrase";
  const first = await hashOwnerPassword(password);
  const second = await hashOwnerPassword(password);
  assert.match(first, /^scrypt\$131072\$8\$1\$/);
  assert.notEqual(first, second, "salts must differ");
  assert.ok(!first.includes(password));
  assert.equal(await verifyOwnerPassword(password, first), true);
  assert.equal(await verifyOwnerPassword("Incorrect passphrase", first), false);
  assert.equal(await verifyOwnerPassword(password, "invalid-hash"), false);
});
