import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

import { getTaskAddTarget } from "../src/features/dashboard/lib/task-add-target";

const dashboardLayoutSource = readFileSync(
  new URL("../src/features/dashboard/components/dashboard-layout.tsx", import.meta.url),
  "utf8",
);
const mobileNavigationSource = readFileSync(
  new URL("../src/features/dashboard/components/mobile-navigation.tsx", import.meta.url),
  "utf8",
);

test("keeps implicit task creation undated in Inbox even when a click event is passed", () => {
  assert.equal(getTaskAddTarget(undefined, "inbox", false), "inbox");
  assert.equal(getTaskAddTarget({ type: "click" }, "inbox", false), "inbox");
});

test("routes an implicit task to Inbox when today's five-task limit is full", () => {
  assert.equal(getTaskAddTarget(undefined, "today", true), "inbox");
  assert.equal(getTaskAddTarget({ type: "click" }, "today", true), "inbox");
});

test("honors explicit Today and Inbox choices", () => {
  assert.equal(getTaskAddTarget("today", "inbox", false), "today");
  assert.equal(getTaskAddTarget("inbox", "today", false), "inbox");
});

test("defaults other views to a task planned for today", () => {
  assert.equal(getTaskAddTarget(undefined, "calendar", false), "today");
  assert.equal(getTaskAddTarget({ type: "click" }, "matrix", false), "today");
});

test("the dashboard sanitizes click callback values before choosing a destination", () => {
  assert.match(dashboardLayoutSource, /getTaskAddTarget\(requestedTarget, currentView, limitReached\)/);
  assert.match(mobileNavigationSource, /onClick=\{\(\) => onAddTask\(\)\}/);
});
