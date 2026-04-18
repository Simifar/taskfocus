import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, projectTemplatesApi } from "@/features/categories/api";
import type { Category } from "@/shared/types";

export function useProjects(includeArchived = false) {
  return useQuery({
    queryKey: ["projects", includeArchived],
    queryFn: () => categoriesApi.list(includeArchived),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => categoriesApi.get(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof categoriesApi.create>[0]) => 
      categoriesApi.create(data),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.setQueryData(["project", newProject.id], newProject);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof categoriesApi.update>[1] }) => 
      categoriesApi.update(id, data),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.setQueryData(["project", updatedProject.id], updatedProject);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.removeQueries({ queryKey: ["project", projectId] });
    },
  });
}

export function useToggleProjectFavorite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: categoriesApi.toggleFavorite,
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.setQueryData(["project", updatedProject.id], updatedProject);
    },
  });
}

export function useArchiveProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: categoriesApi.archive,
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.setQueryData(["project", updatedProject.id], updatedProject);
    },
  });
}

export function useUnarchiveProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: categoriesApi.unarchive,
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.setQueryData(["project", updatedProject.id], updatedProject);
    },
  });
}

export function useReorderProjects() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: categoriesApi.reorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useProjectTemplates() {
  return useQuery({
    queryKey: ["project-templates"],
    queryFn: () => projectTemplatesApi.list(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useCreateProjectFromTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ templateId, name }: { templateId: string; name: string }) => 
      projectTemplatesApi.createFromTemplate(templateId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// Helper hook for project statistics
export function useProjectStats() {
  const { data: projects = [] } = useProjects();
  
  return {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => !p.isArchived).length,
    archivedProjects: projects.filter(p => p.isArchived).length,
    favoriteProjects: projects.filter(p => p.isFavorite).length,
    projectsWithTasks: projects.filter(p => (p._count?.tasks || 0) > 0).length,
    totalTasks: projects.reduce((sum, p) => sum + (p._count?.tasks || 0), 0),
    totalActiveTasks: projects.reduce((sum, p) => sum + (p._count?.activeTasks || 0), 0),
    totalCompletedTasks: projects.reduce((sum, p) => sum + (p._count?.completedTasks || 0), 0),
  };
}
