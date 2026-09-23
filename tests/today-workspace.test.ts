import { test } from "node:test";
import assert from "node:assert/strict";

import { getTodayTaskRecommendation } from "../src/features/dashboard/lib/today";

function task(overrides: Record<string, unknown> = {}) {
  return {
    id: "task-1",
    userId: "user-1",
    title: "Task",
    status: "active",
    important: false,
    urgent: false,
    energyLevel: 3,
    position: 0,
    dueDateStart: "2026-09-23",
    dueDateEnd: null,
    parentTaskId: null,
    createdAt: "2026-09-23T10:00:00.000Z",
    updatedAt: "2026-09-23T10:00:00.000Z",
    subtasks: [],
    ...overrides,
  };
}

const TODAY = new Date("2026-09-23T12:00:00.000Z");

test("recommends the task with the earliest planned range end", () => {
  const tasks = [
    task({ id: "later", dueDateEnd: "2026-09-30", position: 0 }),
    task({ id: "ending-today", dueDateEnd: "2026-09-23", position: 5 }),
  ];

  assert.equal(getTodayTaskRecommendation(tasks, TODAY)?.id, "ending-today");
});

test("uses lower effort only when a capacity filter is active", () => {
  const tasks = [
    task({ id: "high-effort", energyLevel: 5, position: 0 }),
    task({ id: "low-effort", energyLevel: 1, position: 1 }),
  ];

  assert.equal(getTodayTaskRecommendation(tasks, TODAY)?.id, "high-effort");
  assert.equal(getTodayTaskRecommendation(tasks, TODAY, 3)?.id, "low-effort");
});

test("uses position and creation time as stable tie breakers", () => {
  const tasks = [
    task({ id: "newer", position: 2, createdAt: "2026-09-23T09:00:00.000Z" }),
    task({ id: "first-position", position: 0, createdAt: "2026-09-23T11:00:00.000Z" }),
    task({ id: "older", position: 2, createdAt: "2026-09-23T08:00:00.000Z" }),
  ];

  assert.equal(getTodayTaskRecommendation(tasks, TODAY)?.id, "first-position");
  assert.equal(getTodayTaskRecommendation(tasks.slice(0, 1).concat(tasks[2]), TODAY)?.id, "older");
});

test("ignores completed, archived, undated, future, and subtask records", () => {
  const tasks = [
    task({ id: "completed", status: "completed" }),
    task({ id: "archived", status: "archived" }),
    task({ id: "undated", dueDateStart: null }),
    task({ id: "future", dueDateStart: "2026-09-24" }),
    task({ id: "subtask", parentTaskId: "parent-1" }),
  ];

  assert.equal(getTodayTaskRecommendation(tasks, TODAY), null);
});
