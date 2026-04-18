import { apiFetch } from "@/shared/lib/fetcher";
import type { Category, ProjectTemplate } from "@/shared/types";

export interface CreateCategoryInput {
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  parentId?: string;
  position?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
  isFavorite?: boolean;
  isArchived?: boolean;
  parentId?: string | null;
  position?: number;
}

export interface ReorderCategoriesInput {
  items: { id: string; position: number; parentId?: string | null }[];
}

export const categoriesApi = {
  list: (includeArchived = false) => 
    apiFetch<Category[]>("/api/categories", { query: { includeArchived } }),
  get: (id: string) => apiFetch<Category>(`/api/categories/${id}`),
  create: (input: CreateCategoryInput) =>
    apiFetch<Category>("/api/categories", { method: "POST", body: input }),
  update: (id: string, input: UpdateCategoryInput) =>
    apiFetch<Category>(`/api/categories/${id}`, { method: "PATCH", body: input }),
  remove: (id: string) =>
    apiFetch<null>(`/api/categories/${id}`, { method: "DELETE" }),
  reorder: (input: ReorderCategoriesInput) =>
    apiFetch<{ updated: number }>("/api/categories/reorder", {
      method: "PATCH",
      body: input,
    }),
  toggleFavorite: (id: string) =>
    apiFetch<Category>(`/api/categories/${id}/favorite`, { method: "POST" }),
  archive: (id: string) =>
    apiFetch<Category>(`/api/categories/${id}/archive`, { method: "POST" }),
  unarchive: (id: string) =>
    apiFetch<Category>(`/api/categories/${id}/unarchive`, { method: "POST" }),
};

export const projectTemplatesApi = {
  list: () => apiFetch<ProjectTemplate[]>("/api/project-templates"),
  createFromTemplate: (templateId: string, name: string) =>
    apiFetch<Category>("/api/project-templates/create", {
      method: "POST",
      body: { templateId, name },
    }),
};
