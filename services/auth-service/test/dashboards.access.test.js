import { test } from "node:test";
import assert from "node:assert/strict";
import { meetsAccessLevel, validateCollaboratorInput } from "../src/routes/dashboards.js";

test("meetsAccessLevel: owner and admin meet every access level", () => {
  assert.equal(meetsAccessLevel("owner", "viewer"), true);
  assert.equal(meetsAccessLevel("owner", "editor"), true);
  assert.equal(meetsAccessLevel("owner", "owner"), true);
  assert.equal(meetsAccessLevel("admin", "owner"), true);
});

test("meetsAccessLevel: editor meets viewer/editor but not owner-only checks", () => {
  assert.equal(meetsAccessLevel("editor", "viewer"), true);
  assert.equal(meetsAccessLevel("editor", "editor"), true);
  assert.equal(meetsAccessLevel("editor", "owner"), false);
});

test("meetsAccessLevel: viewer only meets viewer", () => {
  assert.equal(meetsAccessLevel("viewer", "viewer"), true);
  assert.equal(meetsAccessLevel("viewer", "editor"), false);
  assert.equal(meetsAccessLevel("viewer", "owner"), false);
});

test("meetsAccessLevel: no access (null) never meets any level", () => {
  assert.equal(meetsAccessLevel(null, "viewer"), false);
  assert.equal(meetsAccessLevel(undefined, "viewer"), false);
});

test("validateCollaboratorInput accepts a valid email/role and normalizes email", () => {
  const { errors, email } = validateCollaboratorInput({
    email: "  Collab@Example.com ",
    role: "editor",
  });
  assert.deepEqual(errors, []);
  assert.equal(email, "collab@example.com");
});

test("validateCollaboratorInput rejects a missing email", () => {
  const { errors } = validateCollaboratorInput({ role: "viewer" });
  assert.equal(errors.length > 0, true);
});

test("validateCollaboratorInput rejects an invalid role", () => {
  const { errors } = validateCollaboratorInput({ email: "a@example.com", role: "admin" });
  assert.equal(errors.length > 0, true);
});
