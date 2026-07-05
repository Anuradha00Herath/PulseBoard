import { Router } from "express";
import crypto from "node:crypto";
import { requireApiKey } from "../middleware/requireApiKey.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { publishEvents } from "../kafka.js";

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateEventInput(event) {
  if (!isPlainObject(event)) {
    return { errors: ["event must be an object."] };
  }

  const { event_id, event_name, timestamp, payload } = event;
  const errors = [];

  if (typeof event_name !== "string" || event_name.trim().length === 0) {
    errors.push("event_name is required.");
  }
  if (event_id !== undefined && (typeof event_id !== "string" || event_id.trim().length === 0)) {
    errors.push("event_id must be a non-empty string if provided.");
  }
  if (timestamp !== undefined && (typeof timestamp !== "string" || Number.isNaN(Date.parse(timestamp)))) {
    errors.push("timestamp must be a valid ISO 8601 string if provided.");
  }
  if (payload !== undefined && !isPlainObject(payload)) {
    errors.push("payload must be an object if provided.");
  }

  return { errors };
}

// source is never taken from the client — always the authenticated key's name
// (see docs/sprint2-design.md #3) so one key can't pollute another source's
// metrics. ingested_at (not client_timestamp) is what aggregation windows on.
export function buildEventEnvelope(event, apiKey) {
  return {
    event_id: event.event_id ?? crypto.randomUUID(),
    event_name: event.event_name,
    source: apiKey.name,
    client_timestamp: event.timestamp ?? null,
    ingested_at: new Date().toISOString(),
    payload: event.payload ?? {},
  };
}

export function normalizeEventsBody(body) {
  return Array.isArray(body) ? body : [body];
}

export const eventsRouter = Router();

eventsRouter.post("/events", requireApiKey, rateLimit, async (req, res, next) => {
  try {
    const events = normalizeEventsBody(req.body);
    if (events.length === 0) {
      return res.status(400).json({ errors: ["At least one event is required."] });
    }

    const perEventErrors = [];
    const envelopes = [];
    events.forEach((event, index) => {
      const { errors } = validateEventInput(event);
      if (errors.length > 0) {
        perEventErrors.push({ index, errors });
      } else {
        envelopes.push(buildEventEnvelope(event, req.apiKey));
      }
    });

    if (perEventErrors.length > 0) {
      return res.status(400).json({ errors: perEventErrors });
    }

    await publishEvents(envelopes);
    res.status(202).json({ accepted: envelopes.length });
  } catch (err) {
    next(err);
  }
});
