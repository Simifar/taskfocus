import { apiFetch } from "@/shared/lib/fetcher";
import type { StatsResponse } from "@/shared/types";

export const statsApi = {
  get: () => apiFetch<StatsResponse>("/api/stats"),
};
