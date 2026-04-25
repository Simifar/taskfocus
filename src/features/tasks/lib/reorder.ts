import type { Task } from "@/shared/types";

export function mergeReorderedTasks(allTasks: Task[], reorderedTasks: Task[]) {
  const reorderedIds = new Set(reorderedTasks.map((task) => task.id));
  const queue = [...reorderedTasks];

  return allTasks.map((task) => {
    if (!reorderedIds.has(task.id)) return task;
    return queue.shift() ?? task;
  });
}
