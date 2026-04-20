"use client";

import { useState, useEffect, useCallback } from "react";
import type { Category } from "@/shared/types";
import { toast } from "sonner";

interface UseProjectsOptions {
  initialProjects?: Category[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseProjectsReturn {
  projects: Category[];
  loading: boolean;
  error: string | null;
  selectedProjectId: string | null;
  
  // Actions
  refetch: () => Promise<void>;
  createProject: (data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    parentId?: string;
  }) => Promise<Category>;
  updateProject: (id: string, data: Partial<Category>) => Promise<Category>;
  deleteProject: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<Category>;
  archiveProject: (id: string) => Promise<Category>;
  selectProject: (projectId: string | null) => void;
  reorderProjects: (projectIds: string[]) => Promise<void>;
  
  // Computed values
  activeProjects: Category[];
  archivedProjects: Category[];
  favoriteProjects: Category[];
  rootProjects: Category[];
  projectStats: {
    totalProjects: number;
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
  };
}

export function useProjects({
  initialProjects = [],
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
}: UseProjectsOptions = {}): UseProjectsReturn {
  const [projects, setProjects] = useState<Category[]>(initialProjects);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Fetch projects from API
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  // Create project
  const createProject = useCallback(async (data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    parentId?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const newProject = await response.json();
      setProjects(prev => [...prev, newProject]);
      toast.success("Project created successfully");
      return newProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error("Failed to create project");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update project
  const updateProject = useCallback(async (id: string, data: Partial<Category>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      const updatedProject = await response.json();
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      toast.success("Project updated successfully");
      return updatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error("Failed to update project");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete project
  const deleteProject = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      setProjects(prev => prev.filter(p => p.id !== id));
      
      // Clear selection if deleted project was selected
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
      }
      
      toast.success("Project deleted successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error("Failed to delete project");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/categories/${id}/favorite`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle favorite");
      }

      const updatedProject = await response.json();
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      
      const action = updatedProject.isFavorite ? "added to" : "removed from";
      toast.success(`Project ${action} favorites`);
      return updatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error("Failed to update favorites");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Archive/unarchive project
  const archiveProject = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/categories/${id}/archive`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to archive project");
      }

      const updatedProject = await response.json();
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      
      const action = updatedProject.isArchived ? "archived" : "unarchived";
      toast.success(`Project ${action} successfully`);
      return updatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error("Failed to archive project");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reorder projects
  const reorderProjects = useCallback(async (projectIds: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/categories/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder projects");
      }

      const updatedProjects = await response.json();
      setProjects(updatedProjects);
      toast.success("Projects reordered successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error("Failed to reorder projects");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Select project
  const selectProject = useCallback((projectId: string | null) => {
    setSelectedProjectId(projectId);
  }, []);

  // Computed values
  const activeProjects = projects.filter(p => !p.isArchived);
  const archivedProjects = projects.filter(p => p.isArchived);
  const favoriteProjects = activeProjects.filter(p => p.isFavorite);
  const rootProjects = activeProjects.filter(p => !p.parentId);

  const projectStats = {
    totalProjects: projects.length,
    totalTasks: projects.reduce((sum, p) => sum + (p._count?.tasks || 0), 0),
    activeTasks: projects.reduce((sum, p) => sum + (p._count?.activeTasks || 0), 0),
    completedTasks: projects.reduce((sum, p) => sum + (p._count?.completedTasks || 0), 0),
  };

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refetch, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  // Initial fetch
  useEffect(() => {
    if (initialProjects.length === 0) {
      refetch();
    }
  }, [refetch, initialProjects.length]);

  return {
    projects,
    loading,
    error,
    selectedProjectId,
    
    refetch,
    createProject,
    updateProject,
    deleteProject,
    toggleFavorite,
    archiveProject,
    selectProject,
    reorderProjects,
    
    activeProjects,
    archivedProjects,
    favoriteProjects,
    rootProjects,
    projectStats,
  };
}
