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

  // Подзадачи
  addSubtask: (parentId: string, subtask: Task) => void;
  updateSubtask: (id: string, subtask: Partial<Task>) => void;
  removeSubtask: (id: string) => void;

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

  // Подзадачи
  addSubtask: (parentId, subtask) =>
    set((state) => {
      // Добавляем подзадачу в общий список
      const newTasks = [subtask, ...state.tasks];
      
      // Обновляем родительскую задачу, добавляя подзадачу в ее subtasks
      const updatedTasks = newTasks.map((task) => {
        if (task.id === parentId) {
          return {
            ...task,
            subtasks: [...(task.subtasks || []), subtask]
          };
        }
        return task;
      });
      
      return {
        tasks: updatedTasks,
        activeTasks: updatedTasks.filter((t) => t.status === "active"),
        completedTasks: updatedTasks.filter((t) => t.status === "completed"),
        archivedTasks: updatedTasks.filter((t) => t.status === "archived"),
      };
    }),
  updateSubtask: (id, updatedSubtask) =>
    set((state) => {
      // Обновляем подзадачу в общем списке
      const newTasks = state.tasks.map((t) =>
        t.id === id ? { ...t, ...updatedSubtask } : t
      );
      
      // Обновляем подзадачу в массиве subtasks родительской задачи
      const finalTasks = newTasks.map((task) => {
        if (task.subtasks && task.subtasks.some(st => st.id === id)) {
          return {
            ...task,
            subtasks: task.subtasks.map(st => 
              st.id === id ? { ...st, ...updatedSubtask } : st
            )
          };
        }
        return task;
      });
      
      return {
        tasks: finalTasks,
        activeTasks: finalTasks.filter((t) => t.status === "active"),
        completedTasks: finalTasks.filter((t) => t.status === "completed"),
        archivedTasks: finalTasks.filter((t) => t.status === "archived"),
      };
    }),
  removeSubtask: (id) =>
    set((state) => {
      // Удаляем подзадачу из общего списка
      const newTasks = state.tasks.filter((t) => t.id !== id);
      
      // Удаляем подзадачу из массивов subtasks родительских задач
      const finalTasks = newTasks.map((task) => {
        if (task.subtasks) {
          return {
            ...task,
            subtasks: task.subtasks.filter(st => st.id !== id)
          };
        }
        return task;
      });
      
      return {
        tasks: finalTasks,
        activeTasks: finalTasks.filter((t) => t.status === "active"),
        completedTasks: finalTasks.filter((t) => t.status === "completed"),
        archivedTasks: finalTasks.filter((t) => t.status === "archived"),
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
