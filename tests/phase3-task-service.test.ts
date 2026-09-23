import { test } from "node:test";
import assert from "node:assert/strict";

import { TaskDomainError } from "../src/server/tasks/errors";
import {
  assertReorderOwnership,
  assertTodayCapacity,
  isRetryableTransactionError,
  withTransactionRetry,
} from "../src/server/tasks/policy";

test("rejects a reorder payload containing a task owned by another user", () => {
  assert.throws(
    () => assertReorderOwnership(["owned", "foreign"], new Set(["owned"])),
    (error: unknown) =>
      error instanceof TaskDomainError && error.code === "FOREIGN_TASK",
  );
});

test("rejects duplicate task ids in a reorder payload", () => {
  assert.throws(
    () => assertReorderOwnership(["same", "same"], new Set(["same"])),
    (error: unknown) =>
      error instanceof TaskDomainError && error.code === "INVALID_REORDER",
  );
});

test("uses one domain error for the daily capacity limit", () => {
  assert.doesNotThrow(() => assertTodayCapacity(4, 5));
  assert.throws(
    () => assertTodayCapacity(5, 5),
    (error: unknown) =>
      error instanceof TaskDomainError && error.code === "TODAY_LIMIT_REACHED",
  );
});

test("retries only transient transaction conflicts", () => {
  assert.equal(isRetryableTransactionError({ code: "P2034" }), true);
  assert.equal(isRetryableTransactionError({ cause: { sqlState: "40001" } }), true);
  assert.equal(isRetryableTransactionError({ cause: { sqlState: "40P01" } }), true);
  assert.equal(isRetryableTransactionError({ code: "P2002" }), false);
  assert.equal(isRetryableTransactionError(new Error("validation")), false);
});

test("retries a transient transaction failure a finite number of times", async () => {
  let attempts = 0;
  const result = await withTransactionRetry(async () => {
    attempts += 1;
    if (attempts < 2) throw { code: "P2034" };
    return "ok";
  });

  assert.equal(result, "ok");
  assert.equal(attempts, 2);
});
