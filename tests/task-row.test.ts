import { test } from "node:test";
import assert from "node:assert/strict";

import { formatTaskRowSchedule } from "../src/features/tasks/lib/task-row";

test("formats a task date range as compact row metadata", () => {
  assert.equal(
    formatTaskRowSchedule({
      dueDateStart: "2026-09-23T12:00:00.000Z",
      dueDateEnd: "2026-09-23T12:00:00.000Z",
    }),
    "23 сент.",
  );
  assert.equal(
    formatTaskRowSchedule({
      dueDateStart: "2026-09-23T12:00:00.000Z",
      dueDateEnd: "2026-09-25T12:00:00.000Z",
    }),
    "23–25 сент.",
  );
});

test("does not show schedule metadata for an undated task", () => {
  assert.equal(
    formatTaskRowSchedule({ dueDateStart: null, dueDateEnd: null }),
    null,
  );
});
