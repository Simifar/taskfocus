import { apiFetch } from "@/shared/lib/fetcher";
import type { Task, TasksListResponse } from "@/shared/types";

export type TaskStatus = "active" | "completed" | "archived";
export type Priority = "low" | "medium" | "high";

export interface TasksQuery {
  status?: TaskStatus;
  energy?: number | null;
  search?: string;
  categoryId?: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  priority?: Priority;
  energyLevel?: number;
  categoryId?: string | null;
  dueDateStart?: string | null;
  dueDateEnd?: string | null;
  parentTaskId?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: Priority;
  energyLevel?: number;
  categoryId?: string | null;
  status?: TaskStatus;
  dueDateStart?: string | null;
  dueDateEnd?: string | null;
}

export interface CreateSubtaskInput {
  parentId: string;
  title: string;
  energyLevel?: number;
}

export interface ReorderInput {
  items: { id: string; position: number }[];
}

export const tasksApi = {
  list: (q: TasksQuery = {}) =>
    apiFetch<TasksListResponse>("/api/tasks", {
      query: {
        status: q.status,
        energy: q.energy ?? undefined,
        search: q.search,
        categoryId: q.categoryId,
      },
    }),
  get: (id: string) => apiFetch<Task>(`/api/tasks/${id}`),
  create: (input: CreateTaskInput) =>
    apiFetch<Task>("/api/tasks", { method: "POST", body: input }),
  update: (id: string, input: UpdateTaskInput) =>
    apiFetch<Task>(`/api/tasks/${id}`, { method: "PUT", body: input }),
  remove: (id: string) =>
    apiFetch<null>(`/api/tasks/${id}`, { method: "DELETE" }),
  reorder: (input: ReorderInput) =>
    apiFetch<{ updated: number }>("/api/tasks/reorder", {
      method: "PATCH",
      body: input,
    }),
  createSubtask: (input: CreateSubtaskInput) =>
    apiFetch<Task>("/api/subtasks", { method: "POST", body: input }),
};
