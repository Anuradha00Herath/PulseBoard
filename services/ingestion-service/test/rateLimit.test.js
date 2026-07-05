import { test } from "node:test";
import assert from "node:assert/strict";
import { RATE_LIMIT_PER_SECOND } from "../src/middleware/rateLimit.js";

// FR20 acceptance criterion: "Ingestion API returns 429 above 100 req/sec from
// a single API key." The Redis-backed counting itself needs a live Redis
// instance to exercise (see the manual verification in the PR description),
// but the limit constant is pinned here so a future change to it is deliberate.
test("RATE_LIMIT_PER_SECOND matches the FR20 acceptance criterion", () => {
  assert.equal(RATE_LIMIT_PER_SECOND, 100);
});
