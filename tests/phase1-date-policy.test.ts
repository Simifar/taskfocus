import { test } from "node:test";
import assert from "node:assert/strict";

import { toDateOnly } from "../src/shared/lib/dates/date-only";
import { getRequestTimeZone, parseDateQuery } from "../src/server/tasks/date-policy";
import {
  canAddToToday,
  classifyInboxTask,
  countScheduledActiveTasks,
  isScheduledForDate,
  normalisePlannedRange,
  TaskDatePolicyError,
} from "../src/shared/lib/dates/task-date-policy";

const TODAY = "2026-09-23";

function task(overrides: Record<string, unknown> = {}) {
  return {
    status: "active",
    parentTaskId: null,
    dueDateStart: null,
    dueDateEnd: null,
    ...overrides,
  };
}

test("rejects an end-only planned range", () => {
  assert.throws(
    () => normalisePlannedRange(null, "2026-09-23"),
    /Дата окончания требует даты начала/,
  );
});

test("rejects impossible calendar dates with a domain error", () => {
  assert.throws(
    () => normalisePlannedRange("2026-02-30", null),
    (error: unknown) =>
      error instanceof TaskDatePolicyError && error.code === "INVALID_DATE_RANGE",
  );
});

test("classifies only undated active root tasks as Inbox", () => {
  assert.equal(classifyInboxTask(task()), true);
  assert.equal(classifyInboxTask(task({ dueDateStart: "2026-09-24" })), false);
  assert.equal(classifyInboxTask(task({ status: "completed" })), false);
  assert.equal(classifyInboxTask(task({ parentTaskId: "parent-1" })), false);
});

test("matches a task scheduled for a single day", () => {
  assert.equal(isScheduledForDate(task({ dueDateStart: TODAY }), TODAY), true);
  assert.equal(isScheduledForDate(task({ dueDateStart: "2026-09-22" }), TODAY), false);
  assert.equal(isScheduledForDate(task({ dueDateStart: "2026-09-24" }), TODAY), false);
});

test("matches every day inside an inclusive planned range", () => {
  const range = task({ dueDateStart: "2026-09-21", dueDateEnd: "2026-09-25" });

  assert.equal(isScheduledForDate(range, "2026-09-21"), true);
  assert.equal(isScheduledForDate(range, TODAY), true);
  assert.equal(isScheduledForDate(range, "2026-09-25"), true);
  assert.equal(isScheduledForDate(range, "2026-09-26"), false);
});

test("does not count completed, archived, or subtasks toward the root daily limit", () => {
  const tasks = [
    task({ dueDateStart: TODAY }),
    task({ dueDateStart: TODAY, status: "completed" }),
    task({ dueDateStart: TODAY, status: "archived" }),
    task({ dueDateStart: TODAY, parentTaskId: "parent-1" }),
  ];

  assert.equal(countScheduledActiveTasks(tasks, TODAY), 1);
});

test("the daily limit is independent of an energy-filtered view", () => {
  const tasks = Array.from({ length: 5 }, (_, index) =>
    task({ dueDateStart: TODAY, energyLevel: index + 1 }),
  );

  assert.equal(countScheduledActiveTasks(tasks, TODAY), 5);
  assert.equal(canAddToToday(countScheduledActiveTasks(tasks, TODAY), 5), false);
});

test("normalises instants using the supplied timezone", () => {
  const instant = "2026-09-23T23:30:00.000Z";

  assert.equal(toDateOnly(instant, "Asia/Yekaterinburg"), "2026-09-24");
  assert.equal(toDateOnly(instant, "America/Los_Angeles"), "2026-09-23");
  assert.equal(toDateOnly("2026-09-23T00:00:00.000Z", "America/Los_Angeles"), "2026-09-23");
});

test("accepts a valid request timezone and falls back for invalid input", () => {
  assert.equal(
    getRequestTimeZone(new Request("http://localhost", { headers: { "x-time-zone": "Asia/Yekaterinburg" } })),
    "Asia/Yekaterinburg",
  );
  assert.equal(
    getRequestTimeZone(new Request("http://localhost", { headers: { "x-time-zone": "Not/AZone" } })),
    "UTC",
  );
});

test("falls back to today for an invalid date query", () => {
  assert.equal(
    parseDateQuery("2026-02-30", new Date("2026-09-23T12:00:00.000Z")),
    "2026-09-23",
  );
});
