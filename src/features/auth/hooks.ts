import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "./api";
import { ApiError } from "@/shared/lib/fetcher";

export const authKeys = {
  me: ["auth", "me"] as const,
};

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
      await qc.fetchQuery({
        queryKey: authKeys.me,
        queryFn: authApi.me,
        staleTime: 0,
        retry: false,
      });
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: async () => {
      await qc.fetchQuery({
        queryKey: authKeys.me,
        queryFn: authApi.me,
        staleTime: 0,
        retry: false,
      });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
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
