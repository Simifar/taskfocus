import { addDays } from "date-fns";
import { toast } from "sonner";

import { ApiError } from "@/shared/lib/fetcher";
import type { Task } from "@/shared/types";
import {
  useCreateSubtask,
  useDeleteTask,
  useReorderTasks,
  useToggleComplete,
  useUpdateTask,
} from "@/features/tasks/hooks";

function reportError(err: unknown, fallback: string) {
  const message = err instanceof ApiError ? err.message : fallback;
  toast.error(message);
}

export function useDashboardActions() {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleComplete = useToggleComplete();
  const createSubtask = useCreateSubtask();
  const reorderTasks = useReorderTasks();

  const handleToggleCompleteTask = async (task: Task) => {
    try {
      await toggleComplete.mutateAsync({
        id: task.id,
        completed: task.status !== "completed",
      });
      toast.success(
        task.status === "completed" ? "Задача снова активна" : "Задача выполнена! ✨",
      );
    } catch (err) {
      reportError(err, "Не удалось обновить задачу");
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
      reportError(err, "Ошибка назначения задачи");
    }
  };

  const handleAssignToWeek = async (taskId: string) => {
    try {
      const today = new Date();
      const weekEnd = addDays(today, 7);
      await updateTask.mutateAsync({
        id: taskId,
        input: {
          dueDateStart: today.toISOString(),
          dueDateEnd: weekEnd.toISOString(),
        },
      });
      toast.success("Задача назначена на неделю");
    } catch (err) {
      reportError(err, "Ошибка назначения задачи");
    }
  };

  const handleToggleSubtask = async (subtask: Task) => {
    try {
      await toggleComplete.mutateAsync({
        id: subtask.id,
        completed: subtask.status !== "completed",
      });
      toast.success(
        subtask.status === "completed" ? "Подзадача снова активна" : "Подзадача выполнена! ✨",
      );
    } catch (err) {
      reportError(err, "Не удалось обновить подзадачу");
    }
  };

  const handleAddSubtask = async (parentId: string, title: string) => {
    try {
      await createSubtask.mutateAsync({ parentId, title });
      toast.success("Подзадача добавлена");
    } catch (err) {
      reportError(err, "Не удалось добавить подзадачу");
    }
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
      await Promise.all(
        taskIds.map((id) => updateTask.mutateAsync({ id, input: { status: "archived" } })),
      );
      toast.success(`${taskIds.length} задач отправлено в архив`);
    } catch (err) {
      reportError(err, "Ошибка архивации задач");
    }
  };

  const handleBatchDelete = async (taskIds: string[]) => {
    try {
      await Promise.all(taskIds.map((id) => deleteTask.mutateAsync(id)));
      toast.success(`${taskIds.length} задач удалено`);
    } catch (err) {
      reportError(err, "Ошибка удаления задач");
    }
  };

  const handleBatchAssignToToday = async (taskIds: string[]) => {
    try {
      const today = new Date();
      await Promise.all(
        taskIds.map((id) =>
          updateTask.mutateAsync({
            id,
            input: {
              dueDateStart: today.toISOString(),
              dueDateEnd: today.toISOString(),
            },
          }),
        ),
      );
      toast.success(`${taskIds.length} задач назначено на сегодня`);
    } catch (err) {
      reportError(err, "Ошибка назначения задач");
    }
  };

  const handleBatchAssignToWeek = async (taskIds: string[]) => {
    try {
      const today = new Date();
      const weekEnd = addDays(today, 7);
      await Promise.all(
        taskIds.map((id) =>
          updateTask.mutateAsync({
            id,
            input: {
              dueDateStart: today.toISOString(),
              dueDateEnd: weekEnd.toISOString(),
            },
          }),
        ),
      );
      toast.success(`${taskIds.length} задач назначено на неделю`);
    } catch (err) {
      reportError(err, "Ошибка назначения задач");
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
    handleReorder,
    handleRestoreTask,
    handleToggleCompleteTask,
    handleToggleSubtask,
  };
}
