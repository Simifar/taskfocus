import { test } from "node:test";
import assert from "node:assert/strict";

import { getMobileNavSection } from "../src/features/dashboard/lib/mobile-navigation";

test("keeps primary mobile navigation on its matching section", () => {
  assert.equal(getMobileNavSection("today", "today"), "today");
  assert.equal(getMobileNavSection("inbox", "today"), "inbox");
  assert.equal(getMobileNavSection("week", "today"), "week");
});

test("opens the all-sections navigation for planning and archive views", () => {
  for (const view of ["calendar", "matrix", "archive"] as const) {
    assert.equal(getMobileNavSection(view, "today"), "sections");
  }
});

test("marks a day view with the section it was opened from", () => {
  assert.equal(getMobileNavSection("day", "today"), "today");
  assert.equal(getMobileNavSection("day", "week"), "week");
  assert.equal(getMobileNavSection("day", "calendar"), "sections");
});
