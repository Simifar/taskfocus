import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Task, TasksListResponse } from "@/shared/types";
import { statsKeys } from "@/features/stats/hooks";
import {
  tasksApi,
  type CreateTaskInput,
  type CreateSubtaskInput,
  type ReorderInput,
  type TasksQuery,
  type UpdateTaskInput,
} from "./api";

export const taskKeys = {
  all: ["tasks"] as const,
  list: (q: TasksQuery) => ["tasks", "list", q] as const,
  detail: (id: string) => ["tasks", "detail", id] as const,
};

// The primary cache entry used by the dashboard.
const PRIMARY_LIST_KEY = taskKeys.list({});

type OptimisticCtx = { previousTasks: TasksListResponse | undefined };

function invalidateTasks(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: taskKeys.all });
  qc.invalidateQueries({ queryKey: statsKeys.all });
}

function snapshotAndCancel(qc: ReturnType<typeof useQueryClient>): OptimisticCtx {
  qc.cancelQueries({ queryKey: taskKeys.all });
  return { previousTasks: qc.getQueryData<TasksListResponse>(PRIMARY_LIST_KEY) };
}

function rollback(qc: ReturnType<typeof useQueryClient>, ctx: OptimisticCtx | undefined) {
  if (ctx?.previousTasks) qc.setQueryData(PRIMARY_LIST_KEY, ctx.previousTasks);
}

function patchList(
  qc: ReturnType<typeof useQueryClient>,
  updater: (old: TasksListResponse) => TasksListResponse,
) {
  qc.setQueryData<TasksListResponse>(PRIMARY_LIST_KEY, (old) => (old ? updater(old) : old));
}

function recalcActiveCount(items: TasksListResponse["items"]): number {
  return items.filter((t) => t.status === "active").length;
}

// ─── Queries ────────────────────────────────────────────────────────────────

export function useTasks(query: TasksQuery = {}) {
  return useQuery({
    queryKey: taskKeys.list(query),
    queryFn: () => tasksApi.list(query),
  });
}

export function useTask(id: string | null | undefined) {
  return useQuery({
    queryKey: taskKeys.detail(id ?? ""),
    queryFn: () => tasksApi.get(id as string),
    enabled: Boolean(id),
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(input),
    onSuccess: () => invalidateTasks(qc),
  });
}

export function useToggleComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      tasksApi.update(id, { status: completed ? "completed" : "active" }),

    onMutate: async ({ id, completed }) => {
      const ctx = snapshotAndCancel(qc);
      const newStatus = completed ? "completed" : ("active" as const);
      const completedAt = completed ? new Date().toISOString() : null;

      patchList(qc, (old) => {
        const items = old.items.map((task): Task => {
          if (task.id === id) return { ...task, status: newStatus, completedAt };
          const hasSub = task.subtasks.some((s) => s.id === id);
          if (!hasSub) return task;
          return {
            ...task,
            subtasks: task.subtasks.map((s): Task =>
              s.id === id ? { ...s, status: newStatus, completedAt } : s,
            ),
          };
        });
        return { ...old, items, activeCount: recalcActiveCount(items) };
      });

      return ctx;
    },
    onError: (_err, _vars, ctx) => rollback(qc, ctx),
    onSettled: () => invalidateTasks(qc),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      tasksApi.update(id, input),

    onMutate: async ({ id, input }) => {
      const ctx = snapshotAndCancel(qc);

      patchList(qc, (old) => {
        const items = old.items.map((task): Task => {
          if (task.id !== id) return task;
          const completedAt =
            input.status === "completed"
              ? new Date().toISOString()
              : input.status != null
                ? null
                : task.completedAt;
          return { ...task, ...input, completedAt };
        });
        return { ...old, items, activeCount: recalcActiveCount(items) };
      });

      return ctx;
    },
    onError: (_err, _vars, ctx) => rollback(qc, ctx),
    onSettled: () => invalidateTasks(qc),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),

    onMutate: async (id) => {
      const ctx = snapshotAndCancel(qc);

      patchList(qc, (old) => {
        const items = old.items
          .filter((t) => t.id !== id)
          .map((t) => ({ ...t, subtasks: t.subtasks.filter((s) => s.id !== id) }));
        return {
          ...old,
          items,
          totalCount: items.length,
          activeCount: recalcActiveCount(items),
        };
      });

      return ctx;
    },
    onError: (_err, _vars, ctx) => rollback(qc, ctx),
    onSettled: () => invalidateTasks(qc),
  });
}

export function useReorderTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReorderInput) => tasksApi.reorder(input),

    onMutate: async (input) => {
      const ctx = snapshotAndCancel(qc);
      const posMap = new Map(input.items.map(({ id, position }) => [id, position]));

      patchList(qc, (old) => {
        const items = old.items
          .map((t) => {
            const pos = posMap.get(t.id);
            return pos !== undefined ? { ...t, position: pos } : t;
          })
          .sort((a, b) => a.position - b.position);
        return { ...old, items };
      });

      return ctx;
    },
    onError: (_err, _vars, ctx) => rollback(qc, ctx),
    onSettled: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

export function useCreateSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubtaskInput) => tasksApi.createSubtask(input),
    onSuccess: () => invalidateTasks(qc),
  });
}
