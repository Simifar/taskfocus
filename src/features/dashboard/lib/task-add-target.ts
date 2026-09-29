import type { DashboardView } from "@/features/dashboard/store";

export type TaskAddTarget = "today" | "inbox";

/**
 * Click handlers receive a browser event at runtime even when a callback is
 * typed as `() => void`. Ignore those events and keep the current view's intent.
 */
export function getTaskAddTarget(
  requestedTarget: unknown,
  currentView: DashboardView,
  todayAtCapacity: boolean,
): TaskAddTarget {
  if (requestedTarget === "today" || requestedTarget === "inbox") {
    return requestedTarget;
  }

  if (currentView === "inbox" || (currentView === "today" && todayAtCapacity)) {
    return "inbox";
  }

  return "today";
}
