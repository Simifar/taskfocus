import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { EisenhowerQuadrant, Task } from "@/shared/types";
import { describeTaskError } from "@/features/tasks/errors";
import { getCurrentWeekRange } from "@/features/dashboard/lib/task-date-filters";
import { statsKeys } from "@/features/stats/hooks";
import { tasksApi } from "@/features/tasks/api";
import {
  removeTaskFromLists,
  rollback,
  snapshotAndCancel,
  taskKeys,
  useCreateSubtask,
  useBatchTasks,
  useDeleteTask,
  useReorderTasks,
  useToggleComplete,
  useUpdateTask,
} from "@/features/tasks/hooks";

function reportError(err: unknown, fallback: string) {
  toast.error(describeTaskError(err, fallback));
}

const UNDO_WINDOW_MS = 6000;

export function useDashboardActions() {
  const qc = useQueryClient();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleComplete = useToggleComplete();
  const createSubtask = useCreateSubtask();
  const reorderTasks = useReorderTasks();
  const batchTasks = useBatchTasks();

  // Feedback appears with the optimistic change, not after the round trip; a
  // failed request rolls the change back and replaces the toast with an error.
  const handleToggleCompleteTask = async (task: Pick<Task, "id" | "title" | "status">) => {
    const completing = task.status !== "completed";
    const toastId = completing
      ? toast.success("Выполнено", {
          description: task.title,
          duration: UNDO_WINDOW_MS,
          action: {
            label: "Отменить",
            onClick: () => void toggleComplete.mutateAsync({ id: task.id, completed: false }).catch(
              (err) => reportError(err, "Не удалось вернуть задачу"),
            ),
          },
        })
      : undefined;
    try {
      await toggleComplete.mutateAsync({ id: task.id, completed: completing });
      return true;
    } catch (err) {
      if (toastId !== undefined) toast.dismiss(toastId);
      reportError(err, "Не удалось обновить задачу");
      return false;
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    const toastId = toast.success("В архиве", {
      duration: UNDO_WINDOW_MS,
      action: {
        label: "Отменить",
        onClick: () => void updateTask.mutateAsync({ id: taskId, input: { status: "active" } }).catch(
          (err) => reportError(err, "Не удалось вернуть задачу"),
        ),
      },
    });
    try {
      await updateTask.mutateAsync({ id: taskId, input: { status: "archived" } });
    } catch (err) {
      toast.dismiss(toastId);
      reportError(err, "Не удалось отправить задачу в архив");
    }
  };

  const handleRestoreTask = async (taskId: string) => {
    try {
      await updateTask.mutateAsync({ id: taskId, input: { status: "active" } });
      toast.success("Задача восстановлена");
    } catch (err) {
      reportError(err, "Не удалось восстановить задачу");
    }
  };

  // Deletion is irreversible on the server, so it is deferred: the task
  // disappears immediately and is only removed after the undo window closes.
  const handleDeleteTask = (taskId: string, label = "Задача удалена") => {
    const ctx = snapshotAndCancel(qc);
    removeTaskFromLists(qc, [taskId]);
    let undone = false;

    const commit = window.setTimeout(async () => {
      if (undone) return;
      try {
        await tasksApi.remove(taskId);
      } catch (err) {
        rollback(qc, ctx);
        reportError(err, "Не удалось удалить задачу");
      } finally {
        void qc.invalidateQueries({ queryKey: taskKeys.all });
        void qc.invalidateQueries({ queryKey: statsKeys.all });
      }
    }, UNDO_WINDOW_MS);

    toast(label, {
      duration: UNDO_WINDOW_MS,
      action: {
        label: "Отменить",
        onClick: () => {
          undone = true;
          window.clearTimeout(commit);
          rollback(qc, ctx);
        },
      },
    });
  };

  const handleAssignToToday = async (taskId: string) => {
    try {
      const today = new Date();
      await updateTask.mutateAsync({
        id: taskId,
        input: {
          dueDateStart: today.toISOString(),
          dueDateEnd: today.toISOString(),
        },
      });
      toast.success("Запланировано на сегодня");
    } catch (err) {
      reportError(err, "Не удалось назначить задачу");
    }
  };

  const handleAssignToWeek = async (taskId: string) => {
    try {
      const { start, end } = getCurrentWeekRange();
      await updateTask.mutateAsync({
        id: taskId,
        input: {
          dueDateStart: start.toISOString(),
          dueDateEnd: end.toISOString(),
        },
      });
      toast.success("Запланировано на эту неделю");
    } catch (err) {
      reportError(err, "Не удалось назначить задачу");
    }
  };

  const handleMoveToQuadrant = async (taskId: string, quadrant: EisenhowerQuadrant) => {
    const important = quadrant === "do" || quadrant === "schedule";
    const urgent = quadrant === "do" || quadrant === "delegate";

    try {
      await updateTask.mutateAsync({ id: taskId, input: { important, urgent } });
      return true;
    } catch (err) {
      reportError(err, "Не удалось изменить приоритет задачи");
      return false;
    }
  };

  const handleScheduleTask = async (taskId: string, date: Date) => {
    const localNoon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    const dateIso = localNoon.toISOString();

    try {
      await updateTask.mutateAsync({
        id: taskId,
        input: { dueDateStart: dateIso, dueDateEnd: dateIso },
      });
      return true;
    } catch (err) {
      reportError(err, "Не удалось перенести задачу на этот день");
      return false;
    }
  };

  const handleToggleSubtask = async (subtask: Task) => {
    try {
      await toggleComplete.mutateAsync({
        id: subtask.id,
        completed: subtask.status !== "completed",
      });
    } catch (err) {
      reportError(err, "Не удалось обновить подзадачу");
    }
  };

  const handleAddSubtask = async (parentId: string, title: string) => {
    await createSubtask.mutateAsync({ parentId, title });
  };

  const handleDeleteSubtask = (subtaskId: string) => handleDeleteTask(subtaskId, "Подзадача удалена");

  const handleBatchArchive = async (taskIds: string[]) => {
    try {
      await batchTasks.mutateAsync({ action: "archive", taskIds });
      toast.success(`${taskIds.length} задач отправлено в архив`);
      return true;
    } catch (err) {
      reportError(err, "Не удалось архивировать задачи");
      return false;
    }
  };

  const handleBatchDelete = async (taskIds: string[]) => {
    try {
      await batchTasks.mutateAsync({ action: "delete", taskIds });
      toast.success(`${taskIds.length} задач удалено`);
      return true;
    } catch (err) {
      reportError(err, "Не удалось удалить задачи");
      return false;
    }
  };

  const handleBatchAssignToToday = async (taskIds: string[]) => {
    try {
      const today = new Date();
      await batchTasks.mutateAsync({
        action: "assign-range",
        taskIds,
        dueDateStart: today.toISOString(),
        dueDateEnd: today.toISOString(),
      });
      toast.success(`${taskIds.length} задач назначено на сегодня`);
      return true;
    } catch (err) {
      reportError(err, "Не удалось назначить задачи");
      return false;
    }
  };

  const handleBatchAssignToWeek = async (taskIds: string[]) => {
    try {
      const { start, end } = getCurrentWeekRange();
      await batchTasks.mutateAsync({
        action: "assign-range",
        taskIds,
        dueDateStart: start.toISOString(),
        dueDateEnd: end.toISOString(),
      });
      toast.success(`${taskIds.length} задач назначено на неделю`);
      return true;
    } catch (err) {
      reportError(err, "Не удалось назначить задачи");
      return false;
    }
  };

  const handleReorder = async (reordered: Task[]) => {
    try {
      await reorderTasks.mutateAsync({
        items: reordered.map((task, index) => ({ id: task.id, position: index })),
      });
    } catch (err) {
      reportError(err, "Не удалось сохранить порядок");
    }
  };

  return {
    handleAddSubtask,
    handleArchiveTask,
    handleAssignToToday,
    handleAssignToWeek,
    handleBatchArchive,
    handleBatchAssignToToday,
    handleBatchAssignToWeek,
    handleBatchDelete,
    handleDeleteSubtask,
    handleDeleteTask,
    handleMoveToQuadrant,
    handleReorder,
    handleRestoreTask,
    handleToggleCompleteTask,
    handleToggleSubtask,
    handleScheduleTask,
  };
}
