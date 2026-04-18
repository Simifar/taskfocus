import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DashboardView = "today" | "inbox" | "week" | "calendar" | "day";
export type SortBy = "energy" | "priority" | "dueDate" | "created";
export type SortOrder = "asc" | "desc";

interface DashboardState {
  currentView: DashboardView;
  currentCategoryId: string | null;
  selectedDateIso: string | null;
  currentEnergy: number | null;
  searchQuery: string;
  showCompleted: boolean;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

interface DashboardActions {
  setView: (view: DashboardView, categoryId?: string | null, selectedDate?: Date) => void;
  setCategory: (categoryId: string | null) => void;
  setEnergy: (level: number | null) => void;
  setSearch: (query: string) => void;
  setShowCompleted: (show: boolean) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSelectedDate: (date: Date | null) => void;
  resetFilters: () => void;
}

const defaults: DashboardState = {
  currentView: "today",
  currentCategoryId: null,
  selectedDateIso: null,
  currentEnergy: null,
  searchQuery: "",
  showCompleted: false,
  sortBy: "energy",
  sortOrder: "asc",
};

export const useDashboardStore = create<DashboardState & DashboardActions>()(
  // persist(
  (set, get) => ({
      ...defaults,

      setView: (view, categoryId, selectedDate) => {
        console.log('Store setView called with:', { view, categoryId, selectedDate });
        return set({
          currentView: view,
          currentCategoryId: categoryId ?? null,
          selectedDateIso: selectedDate ? selectedDate.toISOString() : null,
        });
      },

      setCategory: (categoryId) => set({ currentCategoryId: categoryId }),
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
    })
  // {
  //   name: "taskfocus.dashboard",
  //   partialize: (state) => ({
  //     currentView: state.currentView,
  //     currentCategoryId: state.currentCategoryId,
  //     sortBy: state.sortBy,
  //     sortOrder: state.sortOrder,
  //     showCompleted: state.showCompleted,
  //   }),
  // },
  // ),
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
