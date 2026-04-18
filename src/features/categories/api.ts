import { apiFetch } from "@/shared/lib/fetcher";
import type { Category } from "@/shared/types";

export interface CreateCategoryInput {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string | null;
  icon?: string | null;
}

export const categoriesApi = {
  list: () => apiFetch<Category[]>("/api/categories"),
  create: (input: CreateCategoryInput) =>
    apiFetch<Category>("/api/categories", { method: "POST", body: input }),
  update: (id: string, input: UpdateCategoryInput) =>
    apiFetch<Category>(`/api/categories/${id}`, { method: "PATCH", body: input }),
  remove: (id: string) =>
    apiFetch<null>(`/api/categories/${id}`, { method: "DELETE" }),
};
