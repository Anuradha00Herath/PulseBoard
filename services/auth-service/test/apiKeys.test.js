import { test } from "node:test";
import assert from "node:assert/strict";
import { generateApiKey, hashApiKey } from "../src/auth/apiKey.js";
import { validateApiKeyInput } from "../src/routes/apiKeys.js";
import { requireAdmin } from "../src/middleware/requireAdmin.js";

test("generateApiKey returns a raw key, its hash, and a matching display prefix", () => {
  const { raw, hash, prefix } = generateApiKey();

  assert.equal(raw.startsWith("pb_"), true);
  assert.equal(hash, hashApiKey(raw));
  assert.equal(raw.startsWith(prefix), true);
});

test("generateApiKey never returns the same raw key twice", () => {
  const first = generateApiKey();
  const second = generateApiKey();

  assert.notEqual(first.raw, second.raw);
  assert.notEqual(first.hash, second.hash);
});

test("hashApiKey is deterministic and does not just echo the input", () => {
  const raw = "pb_test-key";
  assert.equal(hashApiKey(raw), hashApiKey(raw));
  assert.notEqual(hashApiKey(raw), raw);
});

test("validateApiKeyInput accepts a non-empty name and trims it", () => {
  const { errors, name } = validateApiKeyInput({ name: "  ingestion-prod  " });
  assert.deepEqual(errors, []);
  assert.equal(name, "ingestion-prod");
});

test("validateApiKeyInput rejects a missing or blank name", () => {
  assert.equal(validateApiKeyInput({}).errors.length > 0, true);
  assert.equal(validateApiKeyInput({ name: "   " }).errors.length > 0, true);
});

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

test("requireAdmin allows a request from a system admin", () => {
  const req = { user: { role: "admin" } };
  const res = mockRes();
  let nextCalled = false;
  requireAdmin(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test("requireAdmin rejects a non-admin user", () => {
  const req = { user: { role: "editor" } };
  const res = mockRes();
  let nextCalled = false;
  requireAdmin(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test("requireAdmin rejects when req.user is missing", () => {
  const req = {};
  const res = mockRes();
  let nextCalled = false;
  requireAdmin(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});
