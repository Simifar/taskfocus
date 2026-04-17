import { db } from "@/server/db";
import { ok, withAuth } from "@/server/api";

export const GET = withAuth(async (_request, { user }) => {
  const [activeTasks, completedTasks, archivedTasks] = await Promise.all([
    db.task.count({ where: { userId: user.id, status: "active", parentTaskId: null } }),
    db.task.count({ where: { userId: user.id, status: "completed", parentTaskId: null } }),
    db.task.count({ where: { userId: user.id, status: "archived", parentTaskId: null } }),
  ]);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const completedThisWeek = await db.task.count({
    where: {
      userId: user.id,
      status: "completed",
      completedAt: { gte: weekAgo },
      parentTaskId: null,
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completedToday = await db.task.count({
    where: {
      userId: user.id,
      status: "completed",
      completedAt: { gte: today },
      parentTaskId: null,
    },
  });

  return ok({
    activeTasks,
    completedTasks,
    archivedTasks,
    completedThisWeek,
    completedToday,
    totalTasks: activeTasks + completedTasks + archivedTasks,
  });
});
