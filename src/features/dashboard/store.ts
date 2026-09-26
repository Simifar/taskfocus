import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DashboardView = "today" | "inbox" | "week" | "calendar" | "matrix" | "day" | "archive";

interface DashboardState {
  currentView: DashboardView;
  selectedDateIso: string | null;
  currentEnergy: number | null;
  showCompleted: boolean;
}

interface DashboardActions {
  setView: (view: DashboardView, selectedDate?: Date) => void;
  setEnergy: (level: number | null) => void;
  setShowCompleted: (show: boolean) => void;
}

const defaults: DashboardState = {
  currentView: "today",
  selectedDateIso: null,
  currentEnergy: null,
  showCompleted: false,
};

export function getRestoredDashboardView(view: DashboardView, selectedDateIso: string | null) {
  return view === "day" && (!selectedDateIso || Number.isNaN(Date.parse(selectedDateIso)))
    ? "today"
    : view;
}

export const useDashboardStore = create<DashboardState & DashboardActions>()(
  persist(
    (set) => ({
      ...defaults,

      setView: (view, selectedDate) =>
        set({
          currentView: view,
          selectedDateIso: selectedDate ? selectedDate.toISOString() : null,
        }),

      setEnergy: (level) => set({ currentEnergy: level }),
      setShowCompleted: (show) => set({ showCompleted: show }),

    }),
    {
      name: "taskfocus.dashboard",
      partialize: (state) => ({
        currentView: state.currentView,
        selectedDateIso: state.selectedDateIso,
        showCompleted: state.showCompleted,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<DashboardState>;
        const merged = { ...currentState, ...persisted };
        return {
          ...merged,
          currentView: getRestoredDashboardView(merged.currentView, merged.selectedDateIso),
        };
      },
    },
  ),
);

export function useSelectedDate(): Date | null {
  const selectedDateIso = useDashboardStore((s) => s.selectedDateIso);
  return selectedDateIso ? new Date(selectedDateIso) : null;
}
