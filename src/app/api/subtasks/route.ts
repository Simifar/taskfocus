import { ok, withAuth } from "@/server/api";
import { taskErrorResponse } from "@/server/tasks/errors";
import { createSubtaskSchema } from "@/server/tasks/schemas";
import { createSubtask } from "@/server/tasks/service";
import { getRequestTimeZone } from "@/server/tasks/date-policy";

export const POST = withAuth(async (request, { user }) => {
  try {
    const input = createSubtaskSchema.parse(await request.json());
    const subtask = await createSubtask(
      { userId: user.id, timeZone: getRequestTimeZone(request) },
      input,
    );
    return ok(subtask, { status: 201 });
  } catch (error) {
    return taskErrorResponse("create subtask", error);
  }
});
