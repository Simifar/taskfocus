type PlannedRootTask = {
  status: string;
  parentTaskId?: string | null;
};

export function getPlannedRootTasks<T extends PlannedRootTask>(
  tasks: readonly T[],
  predicate: (task: T) => boolean,
  statuses: readonly string[] = ["active", "completed"],
) {
  return tasks.filter(
    (task) =>
      !task.parentTaskId &&
      statuses.includes(task.status) &&
      predicate(task),
  );
}
