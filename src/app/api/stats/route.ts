import { db } from "@/server/db";
import { ok, withAuth } from "@/server/api";
import {
  getCurrentWeekDateRange,
  getRequestTimeZone,
  getTimeZoneDateBounds,
  scheduledBetweenWhere,
} from "@/server/tasks/date-policy";
import { getTodayDateOnly } from "@/shared/lib/dates/date-only";

export const GET = withAuth(async (request, { user }) => {
  const timeZone = getRequestTimeZone(request);
  const todayDate = getTodayDateOnly(new Date(), timeZone);
  const today = getTimeZoneDateBounds(todayDate, timeZone);
  const weekDates = getCurrentWeekDateRange(new Date(), timeZone);
  const week = {
    start: getTimeZoneDateBounds(weekDates.start, timeZone).start,
    end: getTimeZoneDateBounds(weekDates.end, timeZone).end,
  };

  // Single groupBy query replaces 3 separate count queries.
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
        completedAt: { gte: week.start },
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
        dueDateStart: null,
        dueDateEnd: null,
      },
    }),
    db.task.count({
      where: {
        userId: user.id,
        status: "active",
        parentTaskId: null,
        ...scheduledBetweenWhere(todayDate, todayDate),
      },
    }),
    db.task.count({
      where: {
        userId: user.id,
        status: "active",
        parentTaskId: null,
        ...scheduledBetweenWhere(weekDates.start, weekDates.end),
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
