import type { DashboardView } from "../store";

export type MobileNavSection = "today" | "inbox" | "week" | "more";

export function getMobileNavSection(
  currentView: DashboardView,
  dayReturnView: "today" | "week" | "calendar",
): MobileNavSection {
  if (currentView === "day") {
    return dayReturnView === "calendar" ? "more" : dayReturnView;
  }
  if (currentView === "today" || currentView === "inbox" || currentView === "week") {
    return currentView;
  }
  return "more";
}
