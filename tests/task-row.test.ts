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

test("describes schedules relative to today and keeps date-only days stable", async () => {
  const { describeTaskSchedule, parseTaskDay, toTaskDayInput } = await import("../src/features/tasks/lib/task-row");
  const now = new Date(2026, 9, 7, 9, 0);
  const tz = "UTC";

  assert.equal(describeTaskSchedule({ dueDateStart: "2026-10-07T00:00:00.000Z", dueDateEnd: "2026-10-07T00:00:00.000Z" }, now, tz)?.label, "Сегодня");
  assert.equal(describeTaskSchedule({ dueDateStart: "2026-10-08", dueDateEnd: "2026-10-08" }, now, tz)?.label, "Завтра");
  assert.equal(describeTaskSchedule({ dueDateStart: "2026-10-03", dueDateEnd: "2026-10-03" }, now, tz)?.tone, "overdue");
  assert.equal(describeTaskSchedule({ dueDateStart: "2026-10-05", dueDateEnd: "2026-10-09" }, now, tz)?.label, "до 9 окт.");
  assert.equal(describeTaskSchedule({ dueDateStart: null, dueDateEnd: null }, now, tz), null);

  const day = parseTaskDay("2026-10-07T00:00:00.000Z", "America/New_York");
  assert.equal(toTaskDayInput(day), "2026-10-07");
});
