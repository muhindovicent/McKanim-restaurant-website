/**
 * Trusted frontend origin for invitation links and CORS.
 *
 * Supply the exact HTTPS origin from the deployment dashboard. Never derive
 * an invitation URL from an incoming Host / X-Forwarded-Host header.
 */
export function parseTrustedWebOrigin(value: string, allowLoopback = false): string {
  if (typeof value !== "string" || !value.trim() || value !== value.trim()) {
    throw new TypeError("A trusted frontend origin is required");
  }
  let url: URL;
  try { url = new URL(value); } catch { throw new TypeError("Invalid frontend origin URL"); }
  const isLoopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(allowLoopback && url.protocol === "http:" && isLoopback)) {
    throw new TypeError("Frontend origin must use HTTPS");
  }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new TypeError("Frontend origin must not contain credentials, paths, queries, or fragments");
  }
  if (!url.hostname || value.includes("*")) throw new TypeError("Frontend origin must be an explicit host");
  const normalized = url.origin;
  if (value !== normalized && value !== normalized + "/") {
    throw new TypeError("Frontend origin must be an exact canonical URL");
  }
  return normalized;
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/**
 * Preview contract only. The invitation acceptance page and HTTPS delivery
 * are NOT active yet. The token fragment is not sent to the hosting server,
 * but it must be removed by the future client immediately after loading.
 */
export function buildOwnerInvitationLink(publicWebOrigin: string, token: string): string {
  const origin = parseTrustedWebOrigin(publicWebOrigin);
  if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) {
    throw new TypeError("Invalid invitation token");
  }
  const link = new URL("/accept-owner-invitation.html", origin);
  link.hash = "token=" + token;
  return link.toString();
}
