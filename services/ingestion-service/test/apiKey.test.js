import { test } from "node:test";
import assert from "node:assert/strict";
import { hashApiKey, apiKeyCacheKey } from "../src/auth/apiKey.js";

test("hashApiKey is deterministic and does not just echo the input", () => {
  const raw = "pb_test-key";
  assert.equal(hashApiKey(raw), hashApiKey(raw));
  assert.notEqual(hashApiKey(raw), raw);
});

// Fixed vector: auth-service computes this same hash independently (see
// docs/sprint2-design.md #1) — a hardcoded expected value here catches either
// side accidentally drifting from plain SHA-256 hex.
test("hashApiKey matches the fixed cross-service vector", () => {
  assert.equal(
    hashApiKey("pb_test-vector-key"),
    "8f3570c8423d01ae7560c18b1b932486f00ea233d2a4e4f32e3942119c24b5fb"
  );
});

test("apiKeyCacheKey matches the documented Redis key format", () => {
  assert.equal(apiKeyCacheKey("abc123"), "apikey:abc123");
});
