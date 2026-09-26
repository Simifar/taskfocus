import { test } from "node:test";
import assert from "node:assert/strict";

import { getRestoredDashboardView } from "../src/features/dashboard/store";

test("restores a selected day after reload when its date was saved", () => {
  assert.equal(getRestoredDashboardView("day", "2026-09-26T00:00:00.000Z"), "day");
});

test("falls back to Today for older persisted day views without a date", () => {
  assert.equal(getRestoredDashboardView("day", null), "today");
  assert.equal(getRestoredDashboardView("day", "not-a-date"), "today");
});

test("keeps other persisted views unchanged", () => {
  assert.equal(getRestoredDashboardView("inbox", null), "inbox");
});
