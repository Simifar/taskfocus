// Типы для TaskFocus

export type TaskStatus = "active" | "completed" | "archived";
export type Priority = "low" | "medium" | "high";

export interface User {
  id: string;
  email: string;
  username: string;
  name?: string | null;
  avatar?: string | null;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  energyLevel: number; // 1-5
  dueDateStart?: string | null;
  dueDateEnd?: string | null;
  parentTaskId?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  subtasks: Task[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
}

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
