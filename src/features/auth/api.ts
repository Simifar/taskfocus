import { ApiError, apiFetch } from "@/shared/lib/fetcher";
import type { User } from "@/shared/types";
import { signIn, signOut } from "next-auth/react";

export const authApi = {
  me: () => apiFetch<User>("/api/auth/me"),
  login: async (input: { email: string; password: string }) => {
    const result = await signIn("credentials", {
      ...input,
      redirect: false,
      callbackUrl: "/",
    });

    if (!result?.ok) {
      throw new ApiError("INVALID_CREDENTIALS", "Неверный email или пароль", result?.status ?? 401);
    }

    return apiFetch<User>("/api/auth/me");
  },
  register: async (input: { email: string; username: string; password: string; name?: string }) => {
    await apiFetch<User>("/api/auth/register", { method: "POST", body: input });
    return authApi.login({ email: input.email, password: input.password });
  },
  logout: async () => {
    await signOut({ redirect: false, callbackUrl: "/login" });
    return null;
  },
  deleteAccount: () => apiFetch<null>("/api/auth/account", { method: "DELETE" }),
  updateProfile: (input: { name?: string | null }) =>
    apiFetch<User>("/api/auth/profile", { method: "PATCH", body: input }),
};
