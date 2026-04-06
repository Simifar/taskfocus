import { useState, useCallback } from "react";

export type DashboardView = "today" | "inbox" | "week" | "calendar";
export type SortBy = "energy" | "priority" | "dueDate" | "created";

export interface DashboardState {
  // Navigation
  currentView: DashboardView;
  currentCategory?: string;
  
  // Filters
  currentEnergy: number | null;
  searchQuery: string;
  showCompleted: boolean;
  
  // Sorting
  sortBy: SortBy;
  sortOrder: "asc" | "desc";
}

export function useDashboardState() {
  const [state, setState] = useState<DashboardState>({
    currentView: "today",
    currentCategory: undefined,
    currentEnergy: null,
    searchQuery: "",
    showCompleted: false,
    sortBy: "energy",
    sortOrder: "asc",
  });

  // View navigation
  const setView = useCallback(
    (view: DashboardView, category?: string) => {
      setState((prev) => ({
        ...prev,
        currentView: view,
        currentCategory: category,
      }));
    },
    []
  );

  // Energy filter
  const setEnergy = useCallback((level: number | null) => {
    setState((prev) => ({
      ...prev,
      currentEnergy: level,
    }));
  }, []);

  // Search
  const setSearch = useCallback((query: string) => {
    setState((prev) => ({
      ...prev,
      searchQuery: query,
    }));
  }, []);

  // Toggle completed visibility
  const setShowCompleted = useCallback((show: boolean) => {
    setState((prev) => ({
      ...prev,
      showCompleted: show,
    }));
  }, []);

  // Sorting
  const setSortBy = useCallback((sortBy: SortBy) => {
    setState((prev) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy ? (prev.sortOrder === "asc" ? "desc" : "asc") : "asc",
    }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentEnergy: null,
      searchQuery: "",
      showCompleted: false,
      sortBy: "energy",
      sortOrder: "asc",
    }));
  }, []);

  return {
    state,
    actions: {
      setView,
      setEnergy,
      setSearch,
      setShowCompleted,
      setSortBy,
      resetFilters,
    },
    // Shortcuts
    isView: (view: DashboardView) => state.currentView === view,
    hasActiveFilters: () =>
      state.currentEnergy !== null ||
      state.searchQuery.length > 0 ||
      state.showCompleted === false,
  };
}
