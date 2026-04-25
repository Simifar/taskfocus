import type { Task } from "@/shared/types";

export function mergeReorderedTasks(allTasks: Task[], reorderedTasks: Task[]) {
  const reorderedMap = new Map(reorderedTasks.map((task, index) => [task.id, index]));

  return allTasks.slice().sort((a, b) => {
    const aIndex = reorderedMap.get(a.id);
    const bIndex = reorderedMap.get(b.id);

    if (aIndex !== undefined && bIndex !== undefined) return aIndex - bIndex;
    if (aIndex !== undefined) return -1;
    if (bIndex !== undefined) return 1;
    return 0;
  });
}
