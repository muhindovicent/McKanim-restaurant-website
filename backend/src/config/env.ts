import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url().refine(v => v.startsWith("postgresql://") || v.startsWith("postgres://"), "PostgreSQL connection required"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  CORS_ORIGINS: z.string().trim().min(1, "Specify permitted frontend origins"),
});

export function validateEnvironment(raw: Record<string, unknown>) {
  const config = schema.parse(raw);
  const origins = config.CORS_ORIGINS.split(",").map(o => o.trim());
  if (origins.length === 0 || origins.some(o => !o || o === "*")) {
    throw new Error("CORS_ORIGINS must specify explicit origins, not '*'");
  }
  for (const origin of origins) {
    const url = new URL(origin);
    if (url.origin !== origin) throw new Error("CORS_ORIGINS entries must be origins without paths");
    const loopback = ["localhost", "127.0.0.1"].includes(url.hostname);
    if (url.protocol !== "https:" && !(config.NODE_ENV !== "production" && loopback && url.protocol === "http:")) {
      throw new Error("Production CORS_ORIGINS must use HTTPS");
    }
  }
  return { ...config, ALLOWED_ORIGINS: origins };
}
