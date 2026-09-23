import { ok, withAuth } from "@/server/api";
import { getRequestTimeZone } from "@/server/tasks/date-policy";
import { taskErrorResponse } from "@/server/tasks/errors";
import { updateTaskSchema } from "@/server/tasks/schemas";
import { deleteTask, getTask, updateTask } from "@/server/tasks/service";

type RouteCtx = { params: Promise<{ id: string }> };

export const GET = withAuth<RouteCtx>(async (request, { params, user }) => {
  try {
    const { id } = await params;
    return ok(
      await getTask({ userId: user.id, timeZone: getRequestTimeZone(request) }, id),
    );
  } catch (error) {
    return taskErrorResponse("get task", error);
  }
});

export const PUT = withAuth<RouteCtx>(async (request, { params, user }) => {
  try {
    const { id } = await params;
    const input = updateTaskSchema.parse(await request.json());
    const task = await updateTask(
      {
        userId: user.id,
        timeZone: getRequestTimeZone(request),
      },
      id,
      input,
    );
    return ok(task);
  } catch (error) {
    return taskErrorResponse("update task", error);
  }
});

export const DELETE = withAuth<RouteCtx>(async (request, { params, user }) => {
  try {
    const { id } = await params;
    await deleteTask({ userId: user.id, timeZone: getRequestTimeZone(request) }, id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return taskErrorResponse("delete task", error);
  }
});
