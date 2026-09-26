import { test } from "node:test";
import assert from "node:assert/strict";

import {
  FOCUS_DURATION_SECONDS,
  formatFocusTime,
  getFocusProgress,
  getFocusRemainingSeconds,
} from "../src/features/dashboard/lib/focus";

test("formats focus time with stable minute and second padding", () => {
  assert.equal(formatFocusTime(FOCUS_DURATION_SECONDS), "25:00");
  assert.equal(formatFocusTime(61), "01:01");
  assert.equal(formatFocusTime(-1), "00:00");
});

test("clamps focus progress to the timer bounds", () => {
  assert.equal(getFocusProgress(FOCUS_DURATION_SECONDS), 0);
  assert.equal(getFocusProgress(FOCUS_DURATION_SECONDS / 2), 50);
  assert.equal(getFocusProgress(0), 100);
  assert.equal(getFocusProgress(-10), 100);
});

test("derives remaining time from the deadline instead of counting interval ticks", () => {
  assert.equal(getFocusRemainingSeconds(70_000, 10_000), 60);
  assert.equal(getFocusRemainingSeconds(11_001, 10_000), 2);
  assert.equal(getFocusRemainingSeconds(9_999, 10_000), 0);
});
