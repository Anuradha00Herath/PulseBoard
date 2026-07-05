import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSignupInput, validateLoginInput } from "../src/auth/validate.js";

test("validateSignupInput accepts a valid email/password and normalizes email", () => {
  const { errors, email } = validateSignupInput({ email: "  Test@Example.com ", password: "longenough" });
  assert.deepEqual(errors, []);
  assert.equal(email, "test@example.com");
});

test("validateSignupInput rejects a malformed email", () => {
  const { errors } = validateSignupInput({ email: "not-an-email", password: "longenough" });
  assert.equal(errors.length > 0, true);
});

test("validateSignupInput rejects a short password", () => {
  const { errors } = validateSignupInput({ email: "test@example.com", password: "short" });
  assert.equal(errors.length > 0, true);
});

test("validateLoginInput requires both email and password", () => {
  const { errors } = validateLoginInput({});
  assert.equal(errors.length, 2);
});
