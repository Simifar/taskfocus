"use client";

import { useState, useMemo } from "react";
import type { Category } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { 
  FolderPlus, 
  MoreHorizontal, 
  Star, 
  Archive, 
  Edit, 
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  GripVertical
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

interface EnhancedProjectSidebarProps {
  projects: Category[];
  selectedProjectId: string | null;
  onProjectSelect: (projectId: string | null) => void;
  onCreateProject: () => void;
  onToggleFavorite: (id: string) => void;
  onArchiveProject: (id: string) => void;
  onEditProject: (project: Category) => void;
  onDeleteProject: (id: string) => void;
  onReorderProjects?: (projectIds: string[]) => void;
}

export function EnhancedProjectSidebar({
  projects,
  selectedProjectId,
  onProjectSelect,
  onCreateProject,
  onToggleFavorite,
  onArchiveProject,
  onEditProject,
  onDeleteProject,
  onReorderProjects,
}: EnhancedProjectSidebarProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [draggedProject, setDraggedProject] = useState<string | null>(null);

  // Filter active projects only
  const activeProjects = useMemo(() => 
    projects.filter(p => !p.isArchived),
    [projects]
  );

  // Group projects by hierarchy
  const rootProjects = useMemo(() => 
    activeProjects.filter(p => !p.parentId).sort((a, b) => a.position - b.position),
    [activeProjects]
  );

  const getSubprojects = (parentId: string) => 
    activeProjects.filter(p => p.parentId === parentId).sort((a, b) => a.position - b.position);

  const favoriteProjects = useMemo(() => 
    activeProjects.filter(p => p.isFavorite),
    [activeProjects]
  );

  const totalTasks = useMemo(() => 
    activeProjects.reduce((sum, p) => sum + (p._count?.activeTasks || 0), 0),
    [activeProjects]
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

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedProject(projectId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetProjectId: string) => {
    e.preventDefault();
    if (draggedProject && draggedProject !== targetProjectId && onReorderProjects) {
      // Simple reorder logic - in production, this would be more sophisticated
      const draggedIndex = activeProjects.findIndex(p => p.id === draggedProject);
      const targetIndex = activeProjects.findIndex(p => p.id === targetProjectId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newOrder = [...activeProjects.map(p => p.id)];
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedProject);
        onReorderProjects(newOrder);
      }
    }
    setDraggedProject(null);
  };

  const renderProject = (project: Category, level = 0) => {
    const subprojects = getSubprojects(project.id);
    const isExpanded = expandedProjects.has(project.id);
    const hasSubprojects = subprojects.length > 0;
    const isSelected = selectedProjectId === project.id;
    const activeTasks = project._count?.activeTasks || 0;
    const totalProjectTasks = project._count?.tasks || 0;
    const progress = totalProjectTasks > 0 ? Math.round((totalProjectTasks - activeTasks) / totalProjectTasks * 100) : 0;

    return (
      <div key={project.id} className="space-y-1">
        <div 
          className={cn(
            "group relative rounded-lg transition-all duration-200",
            "hover:bg-muted/50",
            isSelected && "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800",
            draggedProject === project.id && "opacity-50"
          )}
        >
          <div className="flex items-center gap-2 p-2">
            {/* Drag handle */}
            <div
              className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
              draggable
              onDragStart={(e) => handleDragStart(e, project.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, project.id)}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Expand/collapse for subprojects */}
            {hasSubprojects && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-transparent"
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
              </Button>
            )}

            {/* Project color and icon */}
            <div
              className={cn(
                "h-4 w-4 rounded-full flex-shrink-0 border-2 border-background",
                !project.color && "bg-gradient-to-br from-blue-500 to-purple-600"
              )}
              style={{ backgroundColor: project.color || undefined }}
            />

            {/* Project name and metadata */}
            <div 
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => onProjectSelect(project.id)}
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-medium truncate",
                  isSelected && "text-emerald-700 dark:text-emerald-400"
                )}>
                  {project.name}
                </span>
                
                {project.isFavorite && (
                  <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
                )}
              </div>

              {/* Progress indicator */}
              {totalProjectTasks > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-muted rounded-full h-1 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {progress}%
                  </span>
                </div>
              )}
            </div>

            {/* Task count badge */}
            {activeTasks > 0 && (
              <Badge 
                variant={isSelected ? "default" : "secondary"} 
                className="text-xs h-5 px-1.5 flex-shrink-0"
              >
                {activeTasks}
              </Badge>
            )}

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" sideOffset={5}>
                <DropdownMenuItem onClick={() => onEditProject(project)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleFavorite(project.id)}>
                  <Star className="h-4 w-4 mr-2" />
                  {project.isFavorite ? "Remove favorite" : "Add favorite"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onArchiveProject(project.id)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDeleteProject(project.id)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Subprojects */}
        {hasSubprojects && isExpanded && (
          <div className="ml-6 space-y-1 border-l-2 border-muted pl-2">
            {subprojects.map(subproject => renderProject(subproject, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4">
      {/* Favorites Section */}
      {favoriteProjects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Favorites
            </h3>
            <Badge variant="outline" className="text-xs">
              {favoriteProjects.length}
            </Badge>
          </div>
          <div className="space-y-1">
            {favoriteProjects.map(project => renderProject(project))}
          </div>
        </div>
      )}

      {/* All Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Projects
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {activeProjects.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs hover:bg-muted"
              onClick={onCreateProject}
            >
              <FolderPlus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
        
        <div className="space-y-1">
          {/* All Projects option */}
          <div 
            className={cn(
              "group relative rounded-lg transition-all duration-200",
              "hover:bg-muted/50 cursor-pointer p-2",
              !selectedProjectId && "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800"
            )}
            onClick={() => onProjectSelect(null)}
          >
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span className={cn(
                "text-sm font-medium",
                !selectedProjectId && "text-emerald-700 dark:text-emerald-400"
              )}>
                All Projects
              </span>
            </div>
            
            {totalTasks > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5">
                {totalTasks}
              </Badge>
            )}
          </div>

          {/* Project hierarchy */}
          {rootProjects.map(project => renderProject(project))}
        </div>
      </div>

      {/* Empty state */}
      {activeProjects.length === 0 && (
        <div className="text-center py-8">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-medium mb-1">No projects yet</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Create your first project to start organizing
          </p>
          <Button
            variant="outline"
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
