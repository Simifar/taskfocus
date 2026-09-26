import { test } from "node:test";
import assert from "node:assert/strict";

import { buildTaskSearchFilter } from "../src/server/tasks/search";

test("search matches task titles, descriptions, and owned subtasks", () => {
  assert.deepEqual(buildTaskSearchFilter("  report  ", "user-1"), {
    OR: [
      { title: { contains: "report", mode: "insensitive" } },
      { description: { contains: "report", mode: "insensitive" } },
      {
        subtasks: {
          some: {
            userId: "user-1",
            OR: [
              { title: { contains: "report", mode: "insensitive" } },
              { description: { contains: "report", mode: "insensitive" } },
            ],
          },
        },
      },
    ],
  });
});
