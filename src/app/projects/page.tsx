"use client";

import { useState } from "react";
import { EnhancedProjectManager } from "@/features/projects/components/enhanced-project-manager";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { useDashboardStore } from "@/features/dashboard/store";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib/fetcher";

export default function ProjectsPage() {
  // Use the enhanced projects hook
  const {
    projects,
    createProject,
    updateProject,
    deleteProject,
    toggleFavorite,
    archiveProject,
    selectProject,
    selectedProjectId,
    loading,
    error,
  } = useProjects({ autoRefresh: true });
  
  const setCategory = useDashboardStore((s) => s.setCategory);

  const handleProjectSelect = (projectId: string | null) => {
    selectProject(projectId);
    setCategory(projectId);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Projects</h1>
        <p className="text-muted-foreground">
          Organize your tasks into projects and track their progress
        </p>
      </div>

      <EnhancedProjectManager
        projects={projects}
        onProjectSelect={handleProjectSelect}
        selectedProjectId={selectedProjectId}
        onCreateProject={createProject}
        onUpdateProject={updateProject}
        onDeleteProject={deleteProject}
        onToggleFavorite={toggleFavorite}
        onArchiveProject={archiveProject}
      />
    </div>
  );
}
