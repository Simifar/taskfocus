import { TaskDomainError } from "@/server/tasks/errors";

export const MAX_ACTIVE_TASKS_PER_DAY = 5;
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
      `На сегодня уже запланировано ${limit} активных задач`,
    );
  }
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
