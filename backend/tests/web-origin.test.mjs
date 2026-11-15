import test from "node:test";
import assert from "node:assert/strict";
import { parseTrustedWebOrigin, buildOwnerInvitationLink } from "../dist/config/web-origin.js";
import { validateEnvironment } from "../dist/config/env.js";

const token = "a".repeat(43);
const base = {
  DATABASE_URL: "postgresql://staging_user:example_only@localhost:5432/test",
  NODE_ENV: "production",
  APP_ENV: "staging",
  PORT: "3001",
  CORS_ORIGINS: "https://mckanim-staging.example.vercel.app",
  INVITATION_DELIVERY_MODE: "disabled",
};

test("accepts only explicitly specified HTTPS frontend origins", () => {
  assert.equal(parseTrustedWebOrigin("https://mckanim-staging.example.vercel.app"),
    "https://mckanim-staging.example.vercel.app");
  assert.equal(parseTrustedWebOrigin("https://mckanim-staging.example.vercel.app/"),
    "https://mckanim-staging.example.vercel.app");
  for (const bad of [
    "http://mckanim-staging.example.vercel.app",
    "https://mckanim-staging.example.vercel.app/another",
    "https://mckanim-staging.example.vercel.app?q=1",
    "https://mckanim-staging.example.vercel.app#token",
    "https://user:pass@mckanim-staging.example.vercel.app",
    "https://*.vercel.app",
    "javascript:alert(1)",
    "https://mckanim-staging.example.vercel.app.evil.test/path",
  ]) {
    assert.throws(() => parseTrustedWebOrigin(bad), /origin|HTTPS|Invalid|explicit/i, bad);
  }
});

test("local HTTP only allowed when explicitly opted in for development", () => {
  assert.throws(() => parseTrustedWebOrigin("http://localhost:5500"), /HTTPS/);
  assert.equal(parseTrustedWebOrigin("http://localhost:5500", true), "http://localhost:5500");
  assert.throws(() => parseTrustedWebOrigin("http://example.org:5500", true), /HTTPS/);
});

test("staging requires explicit frontend URL, disabled delivery, and exact CORS match", () => {
  const ok = validateEnvironment({
    ...base,
    PUBLIC_WEB_ORIGIN: "https://mckanim-staging.example.vercel.app",
  });
  assert.equal(ok.APP_ENV, "staging");
  assert.equal(ok.PUBLIC_WEB_ORIGIN, "https://mckanim-staging.example.vercel.app");
  assert.equal(ok.INVITATION_DELIVERY_MODE, "disabled");
  assert.throws(() => validateEnvironment(base), /PUBLIC_WEB_ORIGIN/);
  assert.throws(() => validateEnvironment({
    ...base, PUBLIC_WEB_ORIGIN: "https://different.example.vercel.app",
  }), /CORS_ORIGINS/);
  assert.throws(() => validateEnvironment({
    ...base, PUBLIC_WEB_ORIGIN: "http://localhost:5500",
  }), /HTTPS/);
  assert.throws(() => validateEnvironment({
    ...base, PUBLIC_WEB_ORIGIN: "https://mckanim-staging.example.vercel.app",
    INVITATION_DELIVERY_MODE: "enabled",
  }), /invalid_value|expected|enum/i);
});

test("builds a token link using trusted origin, not a request Host header", () => {
  const link = buildOwnerInvitationLink("https://mckanim-staging.example.vercel.app", token);
  const parsed = new URL(link);
  assert.equal(parsed.origin, "https://mckanim-staging.example.vercel.app");
  assert.equal(parsed.pathname, "/accept-owner-invitation.html");
  assert.equal(parsed.search, "");
  assert.equal(parsed.hash, "#token=" + token);
  assert.throws(() => buildOwnerInvitationLink("https://evil.example", "short"), /token/);
});
