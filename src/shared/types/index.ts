export type TaskStatus = "active" | "completed" | "archived";
export type EisenhowerQuadrant = "do" | "schedule" | "delegate" | "eliminate";

export interface User {
  id: string;
  email: string;
  username: string;
  name?: string | null;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  important: boolean;
  urgent: boolean;
  energyLevel: number;
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
  inboxTasks: number;
  todayTasks: number;
  weekTasks: number;
  completedThisWeek: number;
  completedToday: number;
  totalTasks: number;
}
