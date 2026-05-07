import { apiFetch } from "@/shared/lib/fetcher";
import type { User } from "@/shared/types";

export const authApi = {
  me: () => apiFetch<User>("/api/auth/me"),
  login: (input: { email: string; password: string }) =>
    apiFetch<User>("/api/auth/login", { method: "POST", body: input }),
  register: (input: { email: string; username: string; password: string }) =>
    apiFetch<User>("/api/auth/register", { method: "POST", body: input }),
  logout: () => apiFetch<null>("/api/auth/logout", { method: "POST" }),
  deleteAccount: () => apiFetch<null>("/api/auth/account", { method: "DELETE" }),
  updateProfile: (input: { name?: string | null }) =>
    apiFetch<User>("/api/auth/profile", { method: "PATCH", body: input }),
};
