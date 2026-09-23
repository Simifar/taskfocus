import { test } from "node:test";
import assert from "node:assert/strict";

import { getPlannedRootTasks } from "../src/features/dashboard/lib/plan";

function task(overrides: Record<string, unknown> = {}) {
  return {
    id: "task-1",
    status: "active",
    parentTaskId: null,
    dueDateStart: "2026-09-23",
    dueDateEnd: null,
    ...overrides,
  };
}

test("plan views share root-task filtering and keep completed tasks visible", () => {
  const tasks = [
    task({ id: "active" }),
    task({ id: "completed", status: "completed" }),
    task({ id: "archived", status: "archived" }),
    task({ id: "subtask", parentTaskId: "parent-1" }),
    task({ id: "other-day", dueDateStart: "2026-09-24" }),
  ];

  const result = getPlannedRootTasks(tasks, (candidate) => candidate.dueDateStart === "2026-09-23");

  assert.deepEqual(result.map((task) => task.id), ["active", "completed"]);
});

test("plan views can explicitly request active tasks only", () => {
  const tasks = [
    task({ id: "active" }),
    task({ id: "completed", status: "completed" }),
  ];

  const result = getPlannedRootTasks(
    tasks,
    () => true,
    ["active"],
  );

  assert.deepEqual(result.map((task) => task.id), ["active"]);
});
