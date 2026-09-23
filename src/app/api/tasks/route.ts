import { ok, withAuth } from "@/server/api";
import { getRequestTimeZone, parseDateQuery } from "@/server/tasks/date-policy";
import { taskErrorResponse } from "@/server/tasks/errors";
import { createTaskSchema, taskStatusSchema, taskViewSchema } from "@/server/tasks/schemas";
import { createTask, listTasks } from "@/server/tasks/service";

export const GET = withAuth(async (request, { user }) => {
  const { searchParams } = new URL(request.url);
  const timeZone = getRequestTimeZone(request);
  const status = taskStatusSchema.safeParse(searchParams.get("status")).data;
  const view = taskViewSchema.safeParse(searchParams.get("view")).data;
  const energyValue = searchParams.get("energy");
  const energy = energyValue ? Number.parseInt(energyValue, 10) : undefined;

  try {
    const result = await listTasks(
      { userId: user.id, timeZone },
      {
        status,
        view,
        energy: Number.isInteger(energy) ? energy : undefined,
        search: searchParams.get("search") || undefined,
        date: parseDateQuery(searchParams.get("date"), new Date(), timeZone),
      },
    );
    return ok(result);
  } catch (error) {
    return taskErrorResponse("list tasks", error);
  }
});

export const POST = withAuth(async (request, { user }) => {
  try {
    const input = createTaskSchema.parse(await request.json());
    const task = await createTask(
      {
        userId: user.id,
        timeZone: getRequestTimeZone(request),
      },
      input,
    );
    return ok(task, { status: 201 });
  } catch (error) {
    return taskErrorResponse("create task", error);
  }
});
