import { err, handleUnknownError } from "@/server/api";
import { TaskDatePolicyError } from "@/server/tasks/date-policy";

export type TaskErrorCode =
  | "TASK_NOT_FOUND"
  | "PARENT_NOT_FOUND"
  | "FOREIGN_TASK"
  | "INVALID_REORDER"
  | "SUBTASK_LEVEL_UNSUPPORTED"
  | "ARCHIVED_PARENT"
  | "TODAY_LIMIT_REACHED";

export class TaskDomainError extends Error {
  readonly code: TaskErrorCode;
  readonly status: number;

  constructor(code: TaskErrorCode, message: string, status = 400) {
    super(message);
    this.name = "TaskDomainError";
    this.code = code;
    this.status = status;
  }
}

export const TASK_ERROR_MESSAGES = {
  TASK_NOT_FOUND: "Задача не найдена",
  PARENT_NOT_FOUND: "Родительская задача не найдена",
  FOREIGN_TASK: "Одна или несколько задач недоступны",
  INVALID_REORDER: "Некорректный порядок задач",
  SUBTASK_LEVEL_UNSUPPORTED: "Подзадачи второго уровня не поддерживаются",
  ARCHIVED_PARENT: "Нельзя добавить подзадачу в архивную задачу",
  TODAY_LIMIT_REACHED: "На сегодня уже запланировано 5 активных задач",
} as const;

export function taskErrorResponse(label: string, error: unknown) {
  if (error instanceof TaskDomainError) {
    return err(error.code, error.message, error.status);
  }
  if (error instanceof TaskDatePolicyError) {
    return err("VALIDATION_ERROR", error.message, 400);
  }
  return handleUnknownError(label, error);
}
