import crypto from "node:crypto";

const KEY_PREFIX = "pb_";
const KEY_BYTES = 32;
const PREFIX_VISIBLE_CHARS = 8;

// API keys are high-entropy random tokens, not human-chosen secrets, so a fast
// hash is appropriate (unlike bcrypt for passwords) — ingestion-service (Sprint 2)
// needs to verify a key on every event at ≥5,000/sec, and bcrypt's deliberate
// slowness would make that throughput target impossible.
export function hashApiKey(rawKey) {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export function generateApiKey() {
  const raw = KEY_PREFIX + crypto.randomBytes(KEY_BYTES).toString("hex");
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, KEY_PREFIX.length + PREFIX_VISIBLE_CHARS),
  };
}

// Redis write-through cache key (see docs/sprint2-design.md #1). ingestion-service
// computes this same hash+key format independently to read the cache.
export function apiKeyCacheKey(hash) {
  return `apikey:${hash}`;
}
