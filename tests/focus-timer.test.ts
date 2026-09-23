import { test } from "node:test";
import assert from "node:assert/strict";

import { FOCUS_DURATION_SECONDS, formatFocusTime, getFocusProgress } from "../src/features/dashboard/lib/focus";

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
