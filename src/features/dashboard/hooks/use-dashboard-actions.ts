import { toast } from "sonner";

import type { EisenhowerQuadrant, Task } from "@/shared/types";
import { describeTaskError } from "@/features/tasks/errors";
import { getCurrentWeekRange } from "@/features/dashboard/lib/task-date-filters";
import {
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

export function useDashboardActions() {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleComplete = useToggleComplete();
  const createSubtask = useCreateSubtask();
  const reorderTasks = useReorderTasks();
  const batchTasks = useBatchTasks();

  const handleToggleCompleteTask = async (task: Task) => {
    try {
      await toggleComplete.mutateAsync({
        id: task.id,
        completed: task.status !== "completed",
      });
      toast.success(task.status === "completed" ? "Задача снова активна" : "Задача выполнена");
      return true;
    } catch (err) {
      reportError(err, "Не удалось обновить задачу");
      return false;
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    try {
      await updateTask.mutateAsync({ id: taskId, input: { status: "archived" } });
      toast.success("Задача отправлена в архив");
    } catch (err) {
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

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success("Задача удалена");
    } catch (err) {
      reportError(err, "Не удалось удалить задачу");
    }
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
      toast.success("Задача назначена на сегодня");
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
      toast.success("Задача назначена на неделю");
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
      toast.success(subtask.status === "completed" ? "Подзадача снова активна" : "Подзадача выполнена");
    } catch (err) {
      reportError(err, "Не удалось обновить подзадачу");
    }
  };

  const handleAddSubtask = async (parentId: string, title: string) => {
    await createSubtask.mutateAsync({ parentId, title });
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await deleteTask.mutateAsync(subtaskId);
      toast.success("Подзадача удалена");
    } catch (err) {
      reportError(err, "Не удалось удалить подзадачу");
    }
  };

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
