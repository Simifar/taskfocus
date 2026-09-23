import { ok, withAuth } from "@/server/api";
import { getRequestTimeZone } from "@/server/tasks/date-policy";
import { taskErrorResponse } from "@/server/tasks/errors";
import { batchTaskSchema } from "@/server/tasks/schemas";
import { batchTasks } from "@/server/tasks/service";

export const POST = withAuth(async (request, { user }) => {
  try {
    const input = batchTaskSchema.parse(await request.json());
    return ok(
      await batchTasks(
        { userId: user.id, timeZone: getRequestTimeZone(request) },
        input,
      ),
    );
  } catch (error) {
    return taskErrorResponse("batch tasks", error);
  }
});
