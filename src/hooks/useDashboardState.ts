import { useState, useEffect, useCallback } from "react";

export type DashboardView = "today" | "inbox" | "week" | "calendar" | "day";
export type SortBy = "energy" | "priority" | "dueDate" | "created";

export interface DashboardState {
  // Navigation
  currentView: DashboardView;
  currentCategory?: string;
  categories: string[];
  selectedDate?: Date;
  
  // Filters
  currentEnergy: number | null;
  searchQuery: string;
  showCompleted: boolean;
  
  // Sorting
  sortBy: SortBy;
  sortOrder: "asc" | "desc";
}

const DEFAULT_CATEGORIES = ["Personal", "Work", "Learning"];

export function useDashboardState() {
  const [state, setState] = useState<DashboardState>({
    currentView: "today",
    currentCategory: undefined,
    categories: DEFAULT_CATEGORIES,
    selectedDate: undefined,
    currentEnergy: null,
    searchQuery: "",
    showCompleted: false,
    sortBy: "energy",
    sortOrder: "asc",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedCategories = window.localStorage.getItem("taskfocus.categories");
    const savedCategory = window.localStorage.getItem("taskfocus.currentCategory");

    setState((prev) => ({
      ...prev,
      categories: savedCategories ? JSON.parse(savedCategories) : prev.categories,
      currentCategory: savedCategory || prev.currentCategory,
    }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("taskfocus.categories", JSON.stringify(state.categories));
    window.localStorage.setItem("taskfocus.currentCategory", state.currentCategory ?? "");
  }, [state.categories, state.currentCategory]);

  // View navigation
  const setView = useCallback(
    (view: DashboardView, category?: string, selectedDate?: Date) => {
      setState((prev) => ({
        ...prev,
        currentView: view,
        currentCategory: category,
        selectedDate,
      }));
    },
    []
  );

  const setCategory = useCallback((category?: string) => {
    setState((prev) => ({
      ...prev,
      currentCategory: category,
    }));
  }, []);

  const addCategory = useCallback((category: string) => {
    setState((prev) => {
      if (prev.categories.includes(category)) {
        return {
          ...prev,
          currentCategory: category,
        };
      }

      return {
        ...prev,
        categories: [...prev.categories, category],
        currentCategory: category,
      };
    });
  }, []);

  const removeCategory = useCallback((category: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((item) => item !== category),
      currentCategory: prev.currentCategory === category ? undefined : prev.currentCategory,
    }));
  }, []);

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

  // Select specific date for day view
  const setSelectedDate = useCallback((date: Date | undefined) => {
    setState((prev) => ({
      ...prev,
      selectedDate: date,
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
      setCategory,
      addCategory,
      removeCategory,
      setEnergy,
      setSearch,
      setShowCompleted,
      setSortBy,
      setSelectedDate,
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
