import { test } from "node:test";
import assert from "node:assert/strict";

import { createTask } from "../src/server/tasks/service";
import { TaskDomainError } from "../src/server/tasks/errors";

test("rejects a planned range when any included day already has five active tasks", async () => {
  const crowdedDate = new Date("2099-04-12T00:00:00.000Z");
  const existingTasks = Array.from({ length: 5 }, (_, index) => ({
    id: `existing-${index}`,
    status: "active",
    parentTaskId: null,
    dueDateStart: crowdedDate,
    dueDateEnd: null,
  }));
  const task = {
    count: async () => 0,
    findMany: async () => existingTasks,
    aggregate: async () => ({ _max: { position: -1 } }),
    create: async ({ data }: { data: unknown }) => data,
  };
  const transaction = { task };
  const client = {
    task,
    $transaction: async (work: (tx: typeof transaction) => Promise<unknown>) => work(transaction),
  };

  await assert.rejects(
    createTask(
      { userId: "user-1", timeZone: "UTC", client: client as never },
      {
        title: "Plan a range around the full day",
        important: false,
        urgent: false,
        energyLevel: 3,
        dueDateStart: "2099-04-10",
        dueDateEnd: "2099-04-14",
      },
    ),
    (error: unknown) =>
      error instanceof TaskDomainError && error.code === "TODAY_LIMIT_REACHED",
  );
});
