import { test, before } from "node:test";
import assert from "node:assert/strict";
import { requireInternalSecret } from "../src/middleware/requireInternalSecret.js";

before(() => {
  process.env.INTERNAL_API_SECRET = "test-internal-secret";
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

test("requireInternalSecret allows a request with the correct shared secret", () => {
  const req = { headers: { "x-internal-secret": "test-internal-secret" } };
  const res = mockRes();
  let nextCalled = false;
  requireInternalSecret(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test("requireInternalSecret rejects a wrong secret", () => {
  const req = { headers: { "x-internal-secret": "wrong" } };
  const res = mockRes();
  let nextCalled = false;
  requireInternalSecret(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test("requireInternalSecret rejects a missing secret header", () => {
  const req = { headers: {} };
  const res = mockRes();
  let nextCalled = false;
  requireInternalSecret(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});
