import { z } from "zod";
import { parseTrustedWebOrigin } from "./web-origin.js";

const schema = z.object({
  DATABASE_URL: z.string().url().refine(v => v.startsWith("postgresql://") || v.startsWith("postgres://"), "PostgreSQL connection required"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  CORS_ORIGINS: z.string().trim().min(1, "Specify permitted frontend origins"),
  PUBLIC_WEB_ORIGIN: z.string().trim().optional(),
  // Email sending is intentionally unsupported until a verified provider,
  // authenticated invitation flow and safe URL handler are available.
  INVITATION_DELIVERY_MODE: z.literal("disabled").default("disabled"),
  // Explicit double-gate with per-restaurant reservationRequestsEnabled flag.
  RESERVATION_REQUESTS_MODE: z.enum(["disabled","enabled"]).default("disabled"),
});

export function validateEnvironment(raw: Record<string, unknown>) {
  const config = schema.parse(raw);
  const allowLoopback = config.NODE_ENV !== "production" && config.APP_ENV === "development";
  const origins = config.CORS_ORIGINS.split(",").map(o => o.trim());
  if (origins.length === 0 || origins.some(o => !o || o === "*")) {
    throw new Error("CORS_ORIGINS must specify explicit origins, not '*'");
  }
  for (const origin of origins) {
    parseTrustedWebOrigin(origin, allowLoopback);
  }
  if (new Set(origins).size !== origins.length) throw new Error("CORS_ORIGINS must be unique");
  const publicWebOrigin = config.PUBLIC_WEB_ORIGIN
    ? parseTrustedWebOrigin(config.PUBLIC_WEB_ORIGIN, allowLoopback)
    : undefined;
  if (config.APP_ENV === "staging" && !publicWebOrigin) {
    throw new Error("PUBLIC_WEB_ORIGIN is required for staging");
  }
  if (publicWebOrigin && !origins.includes(publicWebOrigin)) {
    throw new Error("PUBLIC_WEB_ORIGIN must be included exactly in CORS_ORIGINS");
  }
  if (config.APP_ENV === "staging" && config.NODE_ENV !== "production") {
    throw new Error("Staging must run with NODE_ENV=production");
  }
  return {
    ...config,
    PUBLIC_WEB_ORIGIN: publicWebOrigin,
    ALLOWED_ORIGINS: origins,
  };
}
