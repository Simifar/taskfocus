import { clearAuthCookie } from "@/server/auth";
import { ok } from "@/server/api";

export async function POST() {
  await clearAuthCookie();
  return ok(null);
}
