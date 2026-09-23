import { ok, withAuth } from "@/server/api";
import { taskErrorResponse } from "@/server/tasks/errors";
import { reorderSchema } from "@/server/tasks/schemas";
import { reorderTasks } from "@/server/tasks/service";
import { getRequestTimeZone } from "@/server/tasks/date-policy";

export const PATCH = withAuth(async (request, { user }) => {
  try {
    const input = reorderSchema.parse(await request.json());
    return ok(
      await reorderTasks(
        { userId: user.id, timeZone: getRequestTimeZone(request) },
        input,
      ),
    );
  } catch (error) {
    return taskErrorResponse("reorder tasks", error);
  }
});
