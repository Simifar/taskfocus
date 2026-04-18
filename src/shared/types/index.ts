export type TaskStatus = "active" | "completed" | "archived";
export type Priority = "low" | "medium" | "high";

export interface User {
  id: string;
  email: string;
  username: string;
  name?: string | null;
  avatar?: string | null;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  icon: string | null;
  description: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  parentId: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
  parent?: Category | null;
  _count?: {
    tasks: number;
    activeTasks: number;
    completedTasks: number;
  };
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  energyLevel: number;
  categoryId?: string | null;
  category?: Category | null;
  position: number;
  dueDateStart?: string | null;
  dueDateEnd?: string | null;
  parentTaskId?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  subtasks: Task[];
}

export interface ApiError {
  code: string;
  message: string;
}

export type ApiResponse<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: ApiError };

export interface TasksListResponse {
  items: Task[];
  totalCount: number;
  activeCount: number;
}

export interface StatsResponse {
  activeTasks: number;
  completedTasks: number;
  archivedTasks: number;
  completedThisWeek: number;
  completedToday: number;
  totalTasks: number;
}

export interface ProjectStatsResponse {
  totalProjects: number;
  activeProjects: number;
  archivedProjects: number;
  favoriteProjects: number;
  projectsWithTasks: number;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tasks: Array<{
    title: string;
    description?: string;
    priority?: Priority;
    energyLevel?: number;
  }>;
}
