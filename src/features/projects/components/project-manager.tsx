"use client";

import { useState } from "react";
import type { Category } from "@/shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Badge } from "@/shared/ui/badge";
import { Progress } from "@/shared/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/shared/ui/dialog";
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
  Edit, 
  Trash2,
  FolderOpen,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

interface ProjectManagerProps {
  projects: Category[];
  onProjectSelect: (projectId: string | null) => void;
  selectedProjectId: string | null;
  onCreateProject: (data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    parentId?: string;
  }) => Promise<Category>;
  onUpdateProject: (id: string, data: Partial<Category>) => Promise<Category>;
  onDeleteProject: (id: string) => Promise<void>;
  onToggleFavorite: (id: string) => Promise<Category>;
  onArchiveProject: (id: string) => Promise<Category>;
}

export function ProjectManager({
  projects,
  onProjectSelect,
  selectedProjectId,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onToggleFavorite,
  onArchiveProject,
}: ProjectManagerProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Category | null>(null);
  const [newProjectData, setNewProjectData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    icon: "folder",
    parentId: "",
  });

  // Group projects by hierarchy
  const rootProjects = projects.filter(p => !p.parentId);
  const getSubprojects = (parentId: string) => 
    projects.filter(p => p.parentId === parentId);

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

  const handleCreateProject = async () => {
    if (!newProjectData.name.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    try {
      await onCreateProject({
        name: newProjectData.name.trim(),
        description: newProjectData.description.trim() || undefined,
        color: newProjectData.color,
        icon: newProjectData.icon,
        parentId: newProjectData.parentId || undefined,
      });
      
      setNewProjectData({
        name: "",
        description: "",
        color: "#3b82f6",
        icon: "folder",
        parentId: "",
      });
      setCreateDialogOpen(false);
      toast.success("Project created successfully");
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !newProjectData.name.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    try {
      await onUpdateProject(editingProject.id, {
        name: newProjectData.name.trim(),
        description: newProjectData.description.trim() || undefined,
        color: newProjectData.color,
        icon: newProjectData.icon,
      });
      
      setEditDialogOpen(false);
      setEditingProject(null);
      toast.success("Project updated successfully");
    } catch (error) {
      toast.error("Failed to update project");
    }
  };

  const openEditDialog = (project: Category) => {
    setEditingProject(project);
    setNewProjectData({
      name: project.name,
      description: project.description || "",
      color: project.color || "#3b82f6",
      icon: project.icon || "folder",
      parentId: project.parentId || "",
    });
    setEditDialogOpen(true);
  };

  const calculateProgress = (project: Category) => {
    if (!project._count || project._count.tasks === 0) return 0;
    return Math.round((project._count.completedTasks / project._count.tasks) * 100);
  };

  const renderProject = (project: Category, level = 0) => {
    const subprojects = getSubprojects(project.id);
    const isExpanded = expandedProjects.has(project.id);
    const hasSubprojects = subprojects.length > 0;
    const progress = calculateProgress(project);
    const isSelected = selectedProjectId === project.id;

    return (
      <div key={project.id} className={cn("space-y-1", level > 0 && "ml-4")}>
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            isSelected && "ring-2 ring-emerald-500",
            project.isArchived && "opacity-60"
          )}
          onClick={() => onProjectSelect(project.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {hasSubprojects && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(project.id);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
                
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: project.color || "#3b82f6" }}
                >
                  {project.icon === "folder" ? (
                    <FolderOpen className="h-4 w-4" />
                  ) : (
                    project.icon?.slice(0, 2).toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{project.name}</h3>
                    {project.isFavorite && (
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    )}
                    {project.isArchived && (
                      <Badge variant="secondary" className="text-xs">
                        Archived
                      </Badge>
                    )}
                  </div>
                  
                  {project.description && (
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{project._count?.tasks || 0} tasks</span>
                    <span>{project._count?.activeTasks || 0} active</span>
                    {project._count && project._count.tasks > 0 && (
                      <div className="flex items-center gap-2 flex-1">
                        <Progress value={progress} className="h-1 flex-1" />
                        <span>{progress}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditDialog(project)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onToggleFavorite(project.id)}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    {project.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onArchiveProject(project.id)}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    {project.isArchived ? "Unarchive" : "Archive"}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDeleteProject(project.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Projects</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newProjectData.name}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newProjectData.description}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <Input
                    type="color"
                    value={newProjectData.color}
                    onChange={(e) => setNewProjectData(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Parent Project</label>
                  <select
                    value={newProjectData.parentId}
                    onChange={(e) => setNewProjectData(prev => ({ ...prev, parentId: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">None (Root Project)</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject}>
                  Create Project
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {rootProjects.length > 0 ? (
          rootProjects.map(project => renderProject(project))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first project to start organizing your tasks
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newProjectData.name}
                onChange={(e) => setNewProjectData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newProjectData.description}
                onChange={(e) => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Color</label>
              <Input
                type="color"
                value={newProjectData.color}
                onChange={(e) => setNewProjectData(prev => ({ ...prev, color: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProject}>
                Update Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
