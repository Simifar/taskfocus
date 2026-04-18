import { useQuery } from "@tanstack/react-query";
import { statsApi } from "./api";

export const statsKeys = {
  all: ["stats"] as const,
};

export function useStats() {
  return useQuery({
    queryKey: statsKeys.all,
    queryFn: statsApi.get,
    staleTime: 60_000,
  });
}
