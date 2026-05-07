import { db } from "@/server/db";
import { ok, withAuth } from "@/server/api";

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getCurrentWeekRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function scheduledBetween(start: Date, end: Date) {
  return {
    AND: [
      {
        OR: [
          { dueDateStart: { lte: end } },
          { dueDateStart: null, dueDateEnd: { lte: end } },
        ],
      },
      {
        OR: [
          { dueDateEnd: { gte: start } },
          { dueDateEnd: null, dueDateStart: { gte: start } },
        ],
      },
    ],
  };
}

export const GET = withAuth(async (_request, { user }) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const today = getTodayRange();
  const week = getCurrentWeekRange();

  // Single groupBy query replaces 3 separate count queries
  const [
    countsByStatus,
    completedThisWeek,
    completedToday,
    inboxTasks,
    todayTasks,
    weekTasks,
  ] = await Promise.all([
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
        completedAt: { gte: today.start },
        parentTaskId: null,
      },
    }),
    db.task.count({
      where: {
        userId: user.id,
        status: "active",
        parentTaskId: null,
        OR: [
          { dueDateStart: null },
          { dueDateStart: { gt: today.end } },
        ],
      },
    }),
    db.task.count({
      where: {
        userId: user.id,
        status: "active",
        parentTaskId: null,
        ...scheduledBetween(today.start, today.end),
      },
    }),
    db.task.count({
      where: {
        userId: user.id,
        status: "active",
        parentTaskId: null,
        ...scheduledBetween(week.start, week.end),
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
    inboxTasks,
    todayTasks,
    weekTasks,
    completedThisWeek,
    completedToday,
    totalTasks: activeTasks + completedTasks + archivedTasks,
  });
});
