import { test } from "node:test";
import assert from "node:assert/strict";
import { validateDashboardInput, validateWidgetInput } from "../src/routes/dashboards.js";

test("validateDashboardInput accepts a missing layout_json and defaults to {}", () => {
  const { errors, layoutJson } = validateDashboardInput({});
  assert.deepEqual(errors, []);
  assert.deepEqual(layoutJson, {});
});

test("validateDashboardInput rejects a non-object layout_json", () => {
  const { errors } = validateDashboardInput({ layout_json: "not-an-object" });
  assert.equal(errors.length > 0, true);
});

test("validateWidgetInput accepts a known type and required metric_query", () => {
  const { errors, position } = validateWidgetInput({
    type: "line_chart",
    metric_query: "avg(cpu)",
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(position, {});
});

test("validateWidgetInput rejects an unknown type", () => {
  const { errors } = validateWidgetInput({ type: "pie_chart", metric_query: "avg(cpu)" });
  assert.equal(errors.length > 0, true);
});

test("validateWidgetInput rejects a missing metric_query", () => {
  const { errors } = validateWidgetInput({ type: "counter" });
  assert.equal(errors.length > 0, true);
});

test("validateWidgetInput rejects a non-object position", () => {
  const { errors } = validateWidgetInput({
    type: "table",
    metric_query: "count(*)",
    position: "top-left",
  });
  assert.equal(errors.length > 0, true);
});
