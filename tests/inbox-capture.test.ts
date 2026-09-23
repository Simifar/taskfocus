import { test } from "node:test";
import assert from "node:assert/strict";

import { createInboxTaskInput } from "../src/features/dashboard/lib/inbox";

test("builds a minimal Inbox task without forced classification", () => {
  assert.deepEqual(createInboxTaskInput("  Call the bank  "), {
    title: "Call the bank",
    description: null,
    important: false,
    urgent: false,
    energyLevel: 3,
    dueDateStart: null,
    dueDateEnd: null,
  });
});

test("does not submit an empty Inbox capture", () => {
  assert.equal(createInboxTaskInput("   "), null);
});
