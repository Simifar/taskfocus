"use client";

import { useState, useMemo } from "react";
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
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Grid3X3,
  List,
  Calendar,
  Users,
  Tag
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

interface EnhancedProjectManagerProps {
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

type ViewMode = "grid" | "list";
type SortMode = "name" | "created" | "tasks" | "progress";

export function EnhancedProjectManager({
  projects,
  onProjectSelect,
  selectedProjectId,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onToggleFavorite,
  onArchiveProject,
}: EnhancedProjectManagerProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [showArchived, setShowArchived] = useState(false);
  
  const [newProjectData, setNewProjectData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    icon: "folder",
    parentId: "",
  });

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter(p => showArchived || !p.isArchived);
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort projects
    filtered.sort((a, b) => {
      switch (sortMode) {
        case "name":
          return a.name.localeCompare(b.name);
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "tasks":
          return (b._count?.tasks || 0) - (a._count?.tasks || 0);
        case "progress":
          const aProgress = a._count?.tasks ? (a._count.completedTasks / a._count.tasks) : 0;
          const bProgress = b._count?.tasks ? (b._count.completedTasks / b._count.tasks) : 0;
          return bProgress - aProgress;
        default:
          return 0;
      }
    });

    return filtered;
  }, [projects, searchQuery, sortMode, showArchived]);

  // Group projects by hierarchy
  const rootProjects = useMemo(() => 
    filteredProjects.filter(p => !p.parentId),
    [filteredProjects]
  );

  const getSubprojects = (parentId: string) => 
    filteredProjects.filter(p => p.parentId === parentId);

  const favoriteProjects = useMemo(() => 
    filteredProjects.filter(p => p.isFavorite && !p.isArchived),
    [filteredProjects]
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

  const getProjectIcon = (project: Category) => {
    if (project.icon === "folder") {
      return <FolderOpen className="h-5 w-5" />;
    }
    return <div className="text-sm font-bold">{project.icon?.slice(0, 2).toUpperCase()}</div>;
  };

  const renderProjectCard = (project: Category, level = 0) => {
    const subprojects = getSubprojects(project.id);
    const isExpanded = expandedProjects.has(project.id);
    const hasSubprojects = subprojects.length > 0;
    const progress = calculateProgress(project);
    const isSelected = selectedProjectId === project.id;
    const activeTasks = project._count?.activeTasks || 0;
    const totalTasks = project._count?.tasks || 0;

    if (viewMode === "grid") {
      return (
        <Card 
          key={project.id}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
            isSelected && "ring-2 ring-emerald-500 shadow-lg",
            project.isArchived && "opacity-60",
            level > 0 && "ml-4"
          )}
          onClick={() => onProjectSelect(project.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: project.color || "#3b82f6" }}
              >
                {getProjectIcon(project)}
              </div>
              
              <div className="flex items-center gap-1">
                {project.isFavorite && (
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                )}
                {project.isArchived && (
                  <Badge variant="secondary" className="text-xs">
                    Archived
                  </Badge>
                )}
              </div>
            </div>

            <h3 className="font-semibold text-sm mb-2 truncate">{project.name}</h3>
            
            {project.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                {project.description}
              </p>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{totalTasks} tasks</span>
                <span>{activeTasks} active</span>
              </div>

              {totalTasks > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>

            {hasSubprojects && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(project.id);
                }}
              >
                {isExpanded ? (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    {subprojects.length} subprojects
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-3 w-3 mr-1" />
                    {subprojects.length} subprojects
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    // List view
    return (
      <Card 
        key={project.id}
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md",
          isSelected && "ring-2 ring-emerald-500",
          project.isArchived && "opacity-60",
          level > 0 && "ml-4"
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
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: project.color || "#3b82f6" }}
              >
                {getProjectIcon(project)}
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
                  <span>{totalTasks} tasks</span>
                  <span>{activeTasks} active</span>
                  {totalTasks > 0 && (
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
                <DropdownMenuItem onClick={() => onToggleFavorite(project.id)}>
                  <Star className="h-4 w-4 mr-2" />
                  {project.isFavorite ? "Remove from favorites" : "Add to favorites"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onArchiveProject(project.id)}>
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
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground text-sm">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {sortMode === "name" ? "Name" : 
                 sortMode === "created" ? "Created" :
                 sortMode === "tasks" ? "Tasks" : "Progress"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortMode("name")}>
                Sort by Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMode("created")}>
                Sort by Created
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMode("tasks")}>
                Sort by Tasks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMode("progress")}>
                Sort by Progress
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? (
              <List className="h-4 w-4" />
            ) : (
              <Grid3X3 className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archived
          </Button>
        </div>
      </div>

      {/* Favorites Section */}
      {favoriteProjects.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <h3 className="text-lg font-semibold">Favorite Projects</h3>
            <Badge variant="outline">{favoriteProjects.length}</Badge>
          </div>
          <div className={cn(
            "gap-4",
            viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "space-y-2"
          )}>
            {favoriteProjects.map(project => renderProjectCard(project))}
          </div>
        </div>
      )}

      {/* All Projects */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen className="h-4 w-4" />
          <h3 className="text-lg font-semibold">All Projects</h3>
          <Badge variant="outline">{rootProjects.length}</Badge>
        </div>
        
        {rootProjects.length > 0 ? (
          <div className={cn(
            "gap-4",
            viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "space-y-2"
          )}>
            {rootProjects.map(project => renderProjectCard(project))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search" : "Create your first project to start organizing"}
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
