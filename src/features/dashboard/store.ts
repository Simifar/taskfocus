import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DashboardView = "today" | "inbox" | "week" | "calendar" | "day";
export type SortBy = "energy" | "priority" | "dueDate" | "created";
export type SortOrder = "asc" | "desc";

interface DashboardState {
  currentView: DashboardView;
  selectedDateIso: string | null;
  currentEnergy: number | null;
  searchQuery: string;
  showCompleted: boolean;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

interface DashboardActions {
  setView: (view: DashboardView, selectedDate?: Date) => void;
  setEnergy: (level: number | null) => void;
  setSearch: (query: string) => void;
  setShowCompleted: (show: boolean) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSelectedDate: (date: Date | null) => void;
  resetFilters: () => void;
}

const defaults: DashboardState = {
  currentView: "today",
  selectedDateIso: null,
  currentEnergy: null,
  searchQuery: "",
  showCompleted: false,
  sortBy: "energy",
  sortOrder: "asc",
};

export const useDashboardStore = create<DashboardState & DashboardActions>()(
  persist(
    (set, get) => ({
      ...defaults,

      setView: (view, selectedDate) =>
        set({
          currentView: view,
          selectedDateIso: selectedDate ? selectedDate.toISOString() : null,
        }),

      setEnergy: (level) => set({ currentEnergy: level }),
      setSearch: (query) => set({ searchQuery: query }),
      setShowCompleted: (show) => set({ showCompleted: show }),

      setSortBy: (sortBy) => {
        const prev = get();
        set({
          sortBy,
          sortOrder: prev.sortBy === sortBy ? (prev.sortOrder === "asc" ? "desc" : "asc") : "asc",
        });
      },

      setSelectedDate: (date) =>
        set({ selectedDateIso: date ? date.toISOString() : null }),

      resetFilters: () =>
        set({
          currentEnergy: null,
          searchQuery: "",
          showCompleted: false,
          sortBy: "energy",
          sortOrder: "asc",
        }),
    }),
    {
      name: "taskfocus.dashboard",
      partialize: (state) => ({
        currentView: state.currentView,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        showCompleted: state.showCompleted,
      }),
    },
  ),
);

export function useHasActiveFilters(): boolean {
  return useDashboardStore(
    (s) =>
      s.currentEnergy !== null ||
      s.searchQuery.length > 0 ||
      s.showCompleted ||
      s.sortBy !== defaults.sortBy ||
      s.sortOrder !== defaults.sortOrder,
  );
}

export function useSelectedDate(): Date | null {
  const selectedDateIso = useDashboardStore((s) => s.selectedDateIso);
  return selectedDateIso ? new Date(selectedDateIso) : null;
}
