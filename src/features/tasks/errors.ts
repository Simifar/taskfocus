import { ApiError } from "@/shared/lib/fetcher";

const TASK_ERROR_MESSAGES: Record<string, string> = {
  TODAY_LIMIT_REACHED: "На сегодня уже запланировано 5 активных задач",
  TASK_NOT_FOUND: "Задача больше не существует",
  PARENT_NOT_FOUND: "Родительская задача не найдена",
  FOREIGN_TASK: "Одна или несколько задач недоступны",
  INVALID_REORDER: "Не удалось сохранить такой порядок задач",
  SUBTASK_LEVEL_UNSUPPORTED: "Подзадачи второго уровня не поддерживаются",
  ARCHIVED_PARENT: "Нельзя добавить подзадачу в архивную задачу",
  VALIDATION_ERROR: "Проверьте параметры задачи",
};

export function describeTaskError(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  return TASK_ERROR_MESSAGES[error.code] ?? error.message ?? fallback;
}
