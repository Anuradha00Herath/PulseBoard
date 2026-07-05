import crypto from "node:crypto";

// Must match auth-service's src/auth/apiKey.js exactly (plain SHA-256 hex, no
// salt) — both services are independent apps (see CLAUDE.md) so this is a
// deliberate small duplication rather than a shared package. The fixed test
// vector in each service's test suite guards against the two silently drifting.
export function hashApiKey(rawKey) {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export function apiKeyCacheKey(hash) {
  return `apikey:${hash}`;
}
