import { TaskDomainError } from "@/server/tasks/errors";
import type { PlannedRange } from "@/shared/lib/dates/task-date-policy";
import { dateOnlyToDate } from "@/shared/lib/dates/date-only";
import { MAX_ACTIVE_TASKS_PER_DAY } from "@/shared/lib/task-limits";

export { MAX_ACTIVE_TASKS_PER_DAY } from "@/shared/lib/task-limits";
export const MIN_ENERGY_LEVEL = 1;
export const MAX_ENERGY_LEVEL = 5;
export const DEFAULT_ENERGY_LEVEL = 3;
export const DEFAULT_SUBTASK_ENERGY_LEVEL = 2;

export function assertUniqueTaskIds(ids: string[]) {
  if (new Set(ids).size !== ids.length) {
    throw new TaskDomainError("INVALID_REORDER", "В списке порядка есть повторяющиеся задачи");
  }
}

export function assertReorderOwnership(ids: string[], ownedIds: Set<string>) {
  assertUniqueTaskIds(ids);

  if (ids.some((id) => !ownedIds.has(id))) {
    throw new TaskDomainError("FOREIGN_TASK", "Одна или несколько задач недоступны", 404);
  }
}

export function assertTodayCapacity(count: number, limit = MAX_ACTIVE_TASKS_PER_DAY) {
  if (count >= limit) {
    throw new TaskDomainError(
      "TODAY_LIMIT_REACHED",
      `На одну дату можно запланировать не более ${limit} активных задач`,
    );
  }
}

function dateOrdinal(value: NonNullable<PlannedRange["start"]>) {
  return dateOnlyToDate(value).getTime() / 86_400_000;
}

export function assertTaskRangeCapacity(
  candidate: PlannedRange,
  existingRanges: PlannedRange[],
  additionalTaskCount = 1,
  limit = MAX_ACTIVE_TASKS_PER_DAY,
) {
  if (!candidate.start || additionalTaskCount < 1) return;

  const candidateStart = dateOrdinal(candidate.start);
  const candidateEnd = dateOrdinal(candidate.end ?? candidate.start);
  const events = new Map<number, number>();
  let countOnFirstDay = 0;

  const addEvent = (day: number, delta: number) => {
    events.set(day, (events.get(day) ?? 0) + delta);
  };

  for (const range of existingRanges) {
    if (!range.start) continue;

    const rangeStart = dateOrdinal(range.start);
    const rangeEnd = dateOrdinal(range.end ?? range.start);
    const overlapStart = Math.max(candidateStart, rangeStart);
    const overlapEnd = Math.min(candidateEnd, rangeEnd);
    if (overlapStart > overlapEnd) continue;

    if (overlapStart === candidateStart) countOnFirstDay += 1;
    else addEvent(overlapStart, 1);

    if (overlapEnd < candidateEnd) addEvent(overlapEnd + 1, -1);
  }

  let activeCount = countOnFirstDay;
  if (activeCount + additionalTaskCount > limit) throwTaskRangeCapacityError(limit);

  for (const day of [...events.keys()].sort((left, right) => left - right)) {
    activeCount += events.get(day) ?? 0;
    if (activeCount + additionalTaskCount > limit) throwTaskRangeCapacityError(limit);
  }
}

function throwTaskRangeCapacityError(limit: number): never {
  throw new TaskDomainError(
    "TODAY_LIMIT_REACHED",
    `На одну дату можно запланировать не более ${limit} активных задач`,
  );
}

function readField(value: unknown, field: string): unknown {
  if (typeof value !== "object" || value === null) return undefined;
  return field in value ? (value as Record<string, unknown>)[field] : undefined;
}

export function isRetryableTransactionError(error: unknown): boolean {
  const candidates = [error, readField(error, "cause")];

  return candidates.some((candidate) => {
    const code = readField(candidate, "code");
    const sqlState = readField(candidate, "sqlState") ?? readField(candidate, "sqlstate");
    return code === "P2034" || sqlState === "40001" || sqlState === "40P01";
  });
}

export async function withTransactionRetry<T>(
  operation: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isRetryableTransactionError(error) || attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, Math.min(attempt * 25, 100)));
    }
  }
}
