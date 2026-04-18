"use client";

import { useState } from "react";
import { ProjectManager } from "@/features/projects/components/project-manager";
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject, useToggleProjectFavorite, useArchiveProject } from "@/features/projects/hooks";
import { useDashboardStore } from "@/features/dashboard/store";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib/fetcher";

export default function ProjectsPage() {
  const { data: projects = [] } = useProjects(true); // Include archived projects
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const toggleFavorite = useToggleProjectFavorite();
  const archiveProject = useArchiveProject();
  
  const setCategory = useDashboardStore((s) => s.setCategory);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleProjectSelect = (projectId: string | null) => {
    setSelectedProjectId(projectId);
    setCategory(projectId);
  };

  const handleCreateProject = async (data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    parentId?: string;
  }) => {
    try {
      const newProject = await createProject.mutateAsync(data);
      toast.success("Project created successfully");
      return newProject;
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to create project";
      toast.error(message);
      throw error;
    }
  };

  const handleUpdateProject = async (id: string, data: Partial<any>) => {
    try {
      const updatedProject = await updateProject.mutateAsync({ id, data });
      toast.success("Project updated successfully");
      return updatedProject;
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to update project";
      toast.error(message);
      throw error;
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject.mutateAsync(id);
      toast.success("Project deleted successfully");
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
        setCategory(null);
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to delete project";
      toast.error(message);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const updatedProject = await toggleFavorite.mutateAsync(id);
      toast.success("Project favorite status updated");
      return updatedProject;
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to toggle favorite";
      toast.error(message);
      throw error;
    }
  };

  const handleArchiveProject = async (id: string) => {
    try {
      const updatedProject = await archiveProject.mutateAsync(id);
      toast.success("Project archived successfully");
      return updatedProject;
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to archive project";
      toast.error(message);
      throw error;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Projects</h1>
        <p className="text-muted-foreground">
          Organize your tasks into projects and track their progress
        </p>
      </div>

      <ProjectManager
        projects={projects}
        onProjectSelect={handleProjectSelect}
        selectedProjectId={selectedProjectId}
        onCreateProject={handleCreateProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        onToggleFavorite={handleToggleFavorite}
        onArchiveProject={handleArchiveProject}
      />
    </div>
  );
}
