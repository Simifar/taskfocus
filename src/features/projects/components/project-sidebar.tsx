"use client";

import { useState, useMemo } from "react";
import type { Category } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { 
  FolderPlus, 
  MoreHorizontal, 
  Star, 
  Archive, 
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

interface ProjectSidebarProps {
  projects: Category[];
  selectedProjectId: string | null;
  onProjectSelect: (projectId: string | null) => void;
  onCreateProject: () => void;
  onToggleFavorite: (id: string) => void;
  onArchiveProject: (id: string) => void;
  onEditProject: (project: Category) => void;
  onDeleteProject: (id: string) => void;
}

export function ProjectSidebar({
  projects,
  selectedProjectId,
  onProjectSelect,
  onCreateProject,
  onToggleFavorite,
  onArchiveProject,
  onEditProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Group projects by hierarchy
  const rootProjects = useMemo(() => 
    projects.filter(p => !p.parentId).sort((a, b) => a.position - b.position),
    [projects]
  );

  const getSubprojects = (parentId: string) => 
    projects.filter(p => p.parentId === parentId).sort((a, b) => a.position - b.position);

  const favoriteProjects = useMemo(() => 
    projects.filter(p => p.isFavorite && !p.isArchived),
    [projects]
  );

  const toggleExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const renderProject = (project: Category, level = 0) => {
    const subprojects = getSubprojects(project.id);
    const isExpanded = expandedProjects.has(project.id);
    const hasSubprojects = subprojects.length > 0;
    const isSelected = selectedProjectId === project.id;
    const activeTasks = project._count?.activeTasks || 0;

    return (
      <div key={project.id} className="space-y-1">
        <div className="group relative">
          <Button
            variant={isSelected ? "default" : "ghost"}
            className={cn(
              "w-full justify-between text-sm",
              isSelected && "bg-emerald-600 hover:bg-emerald-700 text-white",
              level > 0 && "ml-4"
            )}
            onClick={() => onProjectSelect(project.id)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {hasSubprojects && (
                <div
                  className="h-4 w-4 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(project.id);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </div>
              )}
              
              <div
                className={cn(
                  "h-3 w-3 rounded-full flex-shrink-0",
                  project.color ? "" : "bg-gray-400"
                )}
                style={{ backgroundColor: project.color || undefined }}
              />
              
              <span className="truncate">{project.name}</span>
              
              {project.isFavorite && (
                <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
              )}
            </div>

            {activeTasks > 0 && (
              <Badge 
                variant={isSelected ? "secondary" : "outline"} 
                className={cn(
                  "text-xs h-4 px-1 flex-shrink-0",
                  isSelected && "bg-white/20 text-white border-white/30"
                )}
              >
                {activeTasks}
              </Badge>
            )}
          </Button>

          {/* Quick actions dropdown */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEditProject(project)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleFavorite(project.id)}>
                  {project.isFavorite ? "Remove favorite" : "Add favorite"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchiveProject(project.id)}>
                  {project.isArchived ? "Unarchive" : "Archive"}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDeleteProject(project.id)}
                  className="text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {hasSubprojects && isExpanded && (
          <div className="space-y-1">
            {subprojects.map(subproject => renderProject(subproject, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Favorites Section */}
      {favoriteProjects.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
            FAVORITES
          </p>
          <div className="space-y-1">
            {favoriteProjects.map(project => (
              <Button
                key={project.id}
                variant={selectedProjectId === project.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-between text-sm",
                  selectedProjectId === project.id && "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
                onClick={() => onProjectSelect(project.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
                  <span className="truncate">{project.name}</span>
                </div>
                
                {(project._count?.activeTasks || 0) > 0 && (
                  <Badge 
                    variant={selectedProjectId === project.id ? "secondary" : "outline"} 
                    className={cn(
                      "text-xs h-4 px-1 flex-shrink-0",
                      selectedProjectId === project.id && "bg-white/20 text-white border-white/30"
                    )}
                  >
                    {project._count?.activeTasks}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* All Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground px-2">
            PROJECTS
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onCreateProject}
          >
            <FolderPlus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        
        <div className="space-y-1">
          {/* All Projects option */}
          <Button
            variant={!selectedProjectId ? "default" : "ghost"}
            className={cn(
              "w-full justify-between text-sm",
              !selectedProjectId && "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
            onClick={() => onProjectSelect(null)}
          >
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              <span>All Projects</span>
            </div>
            <Badge 
              variant={!selectedProjectId ? "secondary" : "outline"} 
              className={cn(
                "text-xs h-4 px-1",
                !selectedProjectId && "bg-white/20 text-white border-white/30"
              )}
            >
              {projects.reduce((sum, p) => sum + (p._count?.activeTasks || 0), 0)}
            </Badge>
          </Button>

          {/* Project hierarchy */}
          {rootProjects.map(project => renderProject(project))}
        </div>
      </div>

      {projects.length === 0 && (
        <div className="text-center py-4">
          <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground mb-2">No projects yet</p>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={onCreateProject}
          >
            <FolderPlus className="h-3 w-3 mr-1" />
            Create Project
          </Button>
        </div>
      )}
    </div>
  );
}
