import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { authApi } from "./api";
import { ApiError } from "@/shared/lib/fetcher";

export const authKeys = {
  me: ["auth", "me"] as const,
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function syncCurrentUser(qc: ReturnType<typeof useQueryClient>) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const user = await authApi.me();
      qc.setQueryData(authKeys.me, user);
      return user;
    } catch (error) {
      const isRetryable401 = error instanceof ApiError && error.status === 401 && attempt < 2;
      if (!isRetryable401) throw error;
      await delay(150);
    }
  }

  throw new Error("Unable to confirm authenticated session");
}

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    staleTime: 5 * 60 * 1000,
    // Don't retry on 401 (invalid token), but retry once on server/network errors
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 1;
    },
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async () => {
      await syncCurrentUser(qc);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: async () => {
      await syncCurrentUser(qc);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await Promise.allSettled([
        authApi.logout(),
        signOut({ redirect: false, callbackUrl: "/" }),
      ]);
      return null;
    },
    onSuccess: () => {
      qc.clear();
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.deleteAccount,
    onSuccess: () => {
      qc.clear();
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (user) => {
      qc.setQueryData(authKeys.me, user);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: authApi.resetPassword,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
  });
}
