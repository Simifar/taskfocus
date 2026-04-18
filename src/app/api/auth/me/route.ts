import { ok, withAuth } from "@/server/api";

export const GET = withAuth(async (_request, { user }) => ok(user));

