import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateEventInput,
  buildEventEnvelope,
  normalizeEventsBody,
} from "../src/routes/events.js";

test("validateEventInput accepts a minimal valid event", () => {
  const { errors } = validateEventInput({ event_name: "page_view" });
  assert.deepEqual(errors, []);
});

test("validateEventInput accepts a fully populated event", () => {
  const { errors } = validateEventInput({
    event_id: "11111111-1111-1111-1111-111111111111",
    event_name: "click",
    timestamp: "2026-07-05T10:00:00Z",
    payload: { url: "/dashboard" },
  });
  assert.deepEqual(errors, []);
});

test("validateEventInput rejects a missing event_name", () => {
  const { errors } = validateEventInput({});
  assert.equal(errors.length > 0, true);
});

test("validateEventInput rejects a non-object event (e.g. null, string, array entry)", () => {
  assert.equal(validateEventInput(null).errors.length > 0, true);
  assert.equal(validateEventInput("oops").errors.length > 0, true);
  assert.equal(validateEventInput(undefined).errors.length > 0, true);
});

test("validateEventInput rejects an invalid timestamp", () => {
  const { errors } = validateEventInput({ event_name: "click", timestamp: "not-a-date" });
  assert.equal(errors.length > 0, true);
});

test("validateEventInput rejects a non-object payload", () => {
  const { errors } = validateEventInput({ event_name: "click", payload: "nope" });
  assert.equal(errors.length > 0, true);
});

test("validateEventInput rejects a blank event_id if provided", () => {
  const { errors } = validateEventInput({ event_name: "click", event_id: "   " });
  assert.equal(errors.length > 0, true);
});

test("buildEventEnvelope derives source from the authenticated API key, never the client", () => {
  const envelope = buildEventEnvelope(
    { event_name: "click", source: "attacker-supplied", payload: { x: 1 } },
    { keyId: "key-1", name: "ingestion-prod" }
  );
  assert.equal(envelope.source, "ingestion-prod");
});

test("buildEventEnvelope generates an event_id when absent and keeps a client-supplied one", () => {
  const generated = buildEventEnvelope({ event_name: "click" }, { name: "svc" });
  assert.equal(typeof generated.event_id, "string");
  assert.equal(generated.event_id.length > 0, true);

  const withId = buildEventEnvelope(
    { event_name: "click", event_id: "fixed-id" },
    { name: "svc" }
  );
  assert.equal(withId.event_id, "fixed-id");
});

test("buildEventEnvelope sets ingested_at server-side and defaults payload/client_timestamp", () => {
  const before = Date.now();
  const envelope = buildEventEnvelope({ event_name: "click" }, { name: "svc" });
  const after = Date.now();

  assert.deepEqual(envelope.payload, {});
  assert.equal(envelope.client_timestamp, null);
  const ingestedAtMs = Date.parse(envelope.ingested_at);
  assert.equal(ingestedAtMs >= before && ingestedAtMs <= after, true);
});

test("normalizeEventsBody wraps a single event in an array", () => {
  const events = normalizeEventsBody({ event_name: "click" });
  assert.deepEqual(events, [{ event_name: "click" }]);
});

test("normalizeEventsBody passes an array through unchanged", () => {
  const batch = [{ event_name: "a" }, { event_name: "b" }];
  assert.deepEqual(normalizeEventsBody(batch), batch);
});

test("normalizeEventsBody treats an empty array as zero events", () => {
  assert.deepEqual(normalizeEventsBody([]), []);
});
