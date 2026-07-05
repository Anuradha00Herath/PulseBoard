import { test, before } from "node:test";
import assert from "node:assert/strict";
import { signToken, verifyToken } from "../src/auth/jwt.js";

before(() => {
  process.env.JWT_SECRET = "test-secret";
});

test("signToken issues a token that verifyToken can decode", () => {
  const user = { id: "11111111-1111-1111-1111-111111111111", email: "a@example.com", role: "editor" };
  const token = signToken(user);
  const decoded = verifyToken(token);

  assert.equal(decoded.sub, user.id);
  assert.equal(decoded.email, user.email);
  assert.equal(decoded.role, user.role);
});

test("verifyToken rejects a tampered token", () => {
  const token = signToken({ id: "1", email: "a@example.com", role: "editor" });
  assert.throws(() => verifyToken(token + "tampered"));
});
