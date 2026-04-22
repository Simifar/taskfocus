import { db } from "@/server/db";
import { ok, withAuth } from "@/server/api";

export const GET = withAuth(async (_request, { user }) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Single groupBy query replaces 3 separate count queries
  const [countsByStatus, completedThisWeek, completedToday] = await Promise.all([
    db.task.groupBy({
      by: ["status"],
      where: { userId: user.id, parentTaskId: null },
      _count: { _all: true },
    }),
    db.task.count({
      where: {
        userId: user.id,
        status: "completed",
        completedAt: { gte: weekAgo },
        parentTaskId: null,
      },
    }),
    db.task.count({
      where: {
        userId: user.id,
        status: "completed",
        completedAt: { gte: today },
        parentTaskId: null,
      },
    }),
  ]);

  const activeTasks =
    countsByStatus.find((c) => c.status === "active")?._count._all ?? 0;
  const completedTasks =
    countsByStatus.find((c) => c.status === "completed")?._count._all ?? 0;
  const archivedTasks =
    countsByStatus.find((c) => c.status === "archived")?._count._all ?? 0;

  return ok({
    activeTasks,
    completedTasks,
    archivedTasks,
    completedThisWeek,
    completedToday,
    totalTasks: activeTasks + completedTasks + archivedTasks,
  });
});
