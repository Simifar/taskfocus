import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const weekViewSource = readFileSync(
  new URL("../src/features/dashboard/components/week-view.tsx", import.meta.url),
  "utf8",
);
const calendarViewSource = readFileSync(
  new URL("../src/features/dashboard/components/calendar-view.tsx", import.meta.url),
  "utf8",
);

function countOccurrences(source: string, value: string) {
  return source.split(value).length - 1;
}

test("week view has one date-specific create-task trigger", () => {
  assert.equal(countOccurrences(weekViewSource, "onCreateTask?.(date)"), 1);
  assert.match(weekViewSource, /aria-label=\{`Добавить задачу на \$\{format\(date, "d MMMM"/);
  assert.doesNotMatch(weekViewSource, /Нажмите, чтобы запланировать дело/);
});

test("calendar view has one date-specific create-task trigger", () => {
  assert.equal(countOccurrences(calendarViewSource, "onCreateTask?.(day)"), 1);
  assert.match(calendarViewSource, /aria-label=\{`Добавить задачу на \$\{format\(day, "d MMMM"/);
  assert.doesNotMatch(calendarViewSource, /onClick=\{\(\) => onCreateTask\?\.\(day\)\}[\s\S]*Добавить/);
});
