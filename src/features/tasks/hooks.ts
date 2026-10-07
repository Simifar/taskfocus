import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Task, TasksListResponse } from "@/shared/types";
import { statsKeys } from "@/features/stats/hooks";
import {
  tasksApi,
  type CreateTaskInput,
  type CreateSubtaskInput,
  type BatchTasksInput,
  type ReorderInput,
  type TasksQuery,
  type UpdateTaskInput,
} from "./api";

export const taskKeys = {
  all: ["tasks"] as const,
  list: (q: TasksQuery) => ["tasks", "list", q] as const,
  detail: (id: string) => ["tasks", "detail", id] as const,
};

type QueryClient = ReturnType<typeof useQueryClient>;
type ListSnapshot = [readonly unknown[], TasksListResponse | undefined][];
export type OptimisticCtx = { snapshots: ListSnapshot };

const LISTS_KEY = ["tasks", "list"] as const;

function invalidateTasks(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: taskKeys.all });
  qc.invalidateQueries({ queryKey: statsKeys.all });
}

// Every dashboard view keeps its own list cache entry (today, inbox, week…),
// so optimistic patches and rollbacks must cover all of them, not one key.
export function snapshotAndCancel(qc: QueryClient): OptimisticCtx {
  void qc.cancelQueries({ queryKey: LISTS_KEY });
  return { snapshots: qc.getQueriesData<TasksListResponse>({ queryKey: LISTS_KEY }) };
}

export function rollback(qc: QueryClient, ctx: OptimisticCtx | undefined) {
  for (const [key, data] of ctx?.snapshots ?? []) qc.setQueryData(key, data);
}

function patchList(qc: QueryClient, updater: (old: TasksListResponse) => TasksListResponse) {
  qc.setQueriesData<TasksListResponse>({ queryKey: LISTS_KEY }, (old) => (old ? updater(old) : old));
}

export function removeTaskFromLists(qc: QueryClient, ids: string[]) {
  const removed = new Set(ids);
  patchList(qc, (old) => {
    const items = old.items
      .filter((t) => !removed.has(t.id))
      .map((t) => ({ ...t, subtasks: t.subtasks.filter((s) => !removed.has(s.id)) }));
    return {
      ...old,
      items,
      totalCount: Math.max(0, old.totalCount - (old.items.length - items.length)),
      activeCount: recalcActiveCount(items),
    };
  });
}

function patchTask(qc: QueryClient, id: string, patch: (task: Task) => Task) {
  patchList(qc, (old) => {
    const items = old.items.map((task): Task => {
      if (task.id === id) return patch(task);
      if (!task.subtasks.some((s) => s.id === id)) return task;
      return { ...task, subtasks: task.subtasks.map((s) => (s.id === id ? patch(s) : s)) };
    });
    return { ...old, items, activeCount: recalcActiveCount(items) };
  });
}

function recalcActiveCount(items: TasksListResponse["items"]): number {
  return items.filter((t) => t.status === "active").length;
}

// ─── Queries ────────────────────────────────────────────────────────────────

export function useTasks(query: TasksQuery = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: taskKeys.list(query),
    queryFn: () => tasksApi.list(query),
    enabled: options.enabled,
    // Paging through weeks/months or refining a search keeps the previous result on
    // screen until the next one arrives; switching views never shows foreign data.
    placeholderData: (previous, previousQuery) => {
      const prev = previousQuery?.queryKey[2] as TasksQuery | undefined;
      if (!prev) return undefined;
      const sameView = Boolean(prev.view) && prev.view === query.view;
      const bothSearches = Boolean(prev.search) && Boolean(query.search);
      return sameView || bothSearches ? previous : undefined;
    },
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

export const OPTIMISTIC_ID_PREFIX = "optimistic:";
let optimisticSeq = 0;

export function isOptimisticTask(task: Pick<Task, "id">) {
  return task.id.startsWith(OPTIMISTIC_ID_PREFIX);
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(input),

    // Undated captures land in Inbox immediately so typing never waits on the network.
    onMutate: async (input) => {
      const ctx = snapshotAndCancel(qc);
      if (input.dueDateStart || input.dueDateEnd || input.parentTaskId) return ctx;

      const now = new Date().toISOString();
      const placeholder: Task = {
        id: `${OPTIMISTIC_ID_PREFIX}${++optimisticSeq}`,
        userId: "",
        title: input.title,
        description: input.description ?? null,
        status: "active",
        important: input.important ?? false,
        urgent: input.urgent ?? false,
        energyLevel: input.energyLevel ?? 3,
        position: Number.MAX_SAFE_INTEGER,
        dueDateStart: null,
        dueDateEnd: null,
        parentTaskId: null,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        subtasks: [],
      };
      for (const [key, data] of ctx.snapshots) {
        const query = key[2] as TasksQuery | undefined;
        if (!data || query?.view !== "inbox") continue;
        qc.setQueryData<TasksListResponse>(key, {
          ...data,
          items: [...data.items, placeholder],
          totalCount: data.totalCount + 1,
          activeCount: data.activeCount + 1,
        });
      }
      return ctx;
    },
    onError: (_err, _vars, ctx) => rollback(qc, ctx),
    onSettled: () => invalidateTasks(qc),
  });
}

export function useToggleComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      tasksApi.update(id, { status: completed ? "completed" : "active" }),

    onMutate: async ({ id, completed }) => {
      const ctx = snapshotAndCancel(qc);
      const status = completed ? "completed" : ("active" as const);
      const completedAt = completed ? new Date().toISOString() : null;
      patchTask(qc, id, (task) => ({ ...task, status, completedAt }));
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
      patchTask(qc, id, (task) => {
        const completedAt =
          input.status === "completed"
            ? new Date().toISOString()
            : input.status != null
              ? null
              : task.completedAt;
        return { ...task, ...input, completedAt };
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
      removeTaskFromLists(qc, [id]);
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

export function useBatchTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BatchTasksInput) => tasksApi.batch(input),
    onMutate: async (input) => {
      const ctx = snapshotAndCancel(qc);
      if (input.action === "delete") removeTaskFromLists(qc, input.taskIds);
      if (input.action === "archive") {
        for (const id of input.taskIds) patchTask(qc, id, (task) => ({ ...task, status: "archived" }));
      }
      return ctx;
    },
    onError: (_err, _vars, ctx) => rollback(qc, ctx),
    onSettled: () => invalidateTasks(qc),
  });
}

export function useCreateSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubtaskInput) => tasksApi.createSubtask(input),
    onSuccess: (subtask, { parentId }) => {
      patchTask(qc, parentId, (task) =>
        task.subtasks.some((s) => s.id === subtask.id)
          ? task
          : { ...task, subtasks: [...task.subtasks, subtask] },
      );
      invalidateTasks(qc);
    },
  });
}

/** Finds the freshest copy of a task (or subtask) across every cached list. */
export function findCachedTask(qc: QueryClient, id: string): Task | null {
  for (const [, data] of qc.getQueriesData<TasksListResponse>({ queryKey: LISTS_KEY })) {
    for (const task of data?.items ?? []) {
      if (task.id === id) return task;
      const subtask = task.subtasks.find((s) => s.id === id);
      if (subtask) return subtask;
    }
  }
  return null;
}
