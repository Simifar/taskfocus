import { create } from "zustand";
import { User, Task, StatsResponse } from "@/types";

interface AppState {
  // Пользователь
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;

  // Задачи
  tasks: Task[];
  activeTasks: Task[];
  completedTasks: Task[];
  archivedTasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  removeTask: (id: string) => void;

  // Фильтры
  statusFilter: "all" | "active" | "completed" | "archived";
  searchQuery: string;
  setStatusFilter: (status: "all" | "active" | "completed" | "archived") => void;
  setSearchQuery: (query: string) => void;

  // Статистика
  stats: StatsResponse | null;
  setStats: (stats: StatsResponse) => void;

  // Текущий уровень энергии пользователя (null = без фильтра)
  currentEnergy: number | null;
  setCurrentEnergy: (level: number | null) => void;

  // Загрузка
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Пользователь
  user: null,
  isAuthenticated: false,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      tasks: [],
      activeTasks: [],
      completedTasks: [],
      archivedTasks: [],
      stats: null,
    }),

  // Задачи
  tasks: [],
  activeTasks: [],
  completedTasks: [],
  archivedTasks: [],
  setTasks: (tasks) =>
    set({
      tasks,
      activeTasks: tasks.filter((t) => t.status === "active"),
      completedTasks: tasks.filter((t) => t.status === "completed"),
      archivedTasks: tasks.filter((t) => t.status === "archived"),
    }),
  addTask: (task) =>
    set((state) => {
      const newTasks = [task, ...state.tasks];
      return {
        tasks: newTasks,
        activeTasks: newTasks.filter((t) => t.status === "active"),
        completedTasks: newTasks.filter((t) => t.status === "completed"),
        archivedTasks: newTasks.filter((t) => t.status === "archived"),
      };
    }),
  updateTask: (id, updatedTask) =>
    set((state) => {
      const newTasks = state.tasks.map((t) =>
        t.id === id ? { ...t, ...updatedTask } : t
      );
      return {
        tasks: newTasks,
        activeTasks: newTasks.filter((t) => t.status === "active"),
        completedTasks: newTasks.filter((t) => t.status === "completed"),
        archivedTasks: newTasks.filter((t) => t.status === "archived"),
      };
    }),
  removeTask: (id) =>
    set((state) => {
      const newTasks = state.tasks.filter((t) => t.id !== id);
      return {
        tasks: newTasks,
        activeTasks: newTasks.filter((t) => t.status === "active"),
        completedTasks: newTasks.filter((t) => t.status === "completed"),
        archivedTasks: newTasks.filter((t) => t.status === "archived"),
      };
    }),

  // Фильтры
  statusFilter: "all",
  searchQuery: "",
  setStatusFilter: (status) => set({ statusFilter: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Статистика
  stats: null,
  setStats: (stats) => set({ stats }),

  // Текущая энергия
  currentEnergy: 3,
  setCurrentEnergy: (level) => set({ currentEnergy: level }),

  // Загрузка
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
