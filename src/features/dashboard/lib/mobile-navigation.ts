import type { DashboardView } from "../store";

export type MobileNavSection = "today" | "inbox" | "week" | "sections";

export function getMobileNavSection(
  currentView: DashboardView,
  dayReturnView: "today" | "week" | "calendar",
): MobileNavSection {
  if (currentView === "day") {
    return dayReturnView === "calendar" ? "sections" : dayReturnView;
  }
  if (currentView === "today" || currentView === "inbox" || currentView === "week") {
    return currentView;
  }
  return "sections";
}
