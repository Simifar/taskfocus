"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Archive,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  Grid2X2,
  Inbox,
  LogOut,
  MoreHorizontal,
  Plus,
  UserRound,
} from "lucide-react";

import type { DashboardView } from "@/features/dashboard/store";
import { getMobileNavSection } from "@/features/dashboard/lib/mobile-navigation";
import type { StatsResponse } from "@/shared/types";
import { cn } from "@/shared/lib/utils";

interface MobileNavigationProps {
  currentView: DashboardView;
  dayReturnView: "today" | "week" | "calendar";
  stats: StatsResponse | null;
  onNavigate: (view: DashboardView) => void;
  onAddTask: () => void;
  onProfile: () => void;
  onLogout: () => void;
}

const primaryItems = [
  { view: "today", label: "Сегодня", icon: CalendarCheck },
  { view: "inbox", label: "Входящие", icon: Inbox },
  { view: "week", label: "План", icon: CalendarDays },
] as const;

export function MobileNavigation({
  currentView,
  dayReturnView,
  stats,
  onNavigate,
  onAddTask,
  onProfile,
  onLogout,
}: MobileNavigationProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const activeSection = getMobileNavSection(currentView, dayReturnView);

  const selectView = (view: DashboardView) => {
    setMoreOpen(false);
    onNavigate(view);
  };

  const selectProfile = () => {
    setMoreOpen(false);
    onProfile();
  };

  const selectLogout = () => {
    setMoreOpen(false);
    onLogout();
  };

  return (
    <Dialog.Root open={moreOpen} onOpenChange={setMoreOpen}>
      <nav
        aria-label="Основная мобильная навигация"
        className="z-30 shrink-0 border-t border-border/80 bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_-20px_rgba(0,0,0,0.3)] backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-5 items-stretch">
          {primaryItems.slice(0, 2).map(({ view, label, icon: Icon }) => (
            <button
              key={view}
              type="button"
              onClick={() => selectView(view)}
              aria-current={activeSection === view ? "page" : undefined}
              className={cn(
                "flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand",
                activeSection === view ? "text-brand" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={onAddTask}
            aria-label="Добавить задачу"
            className="flex min-h-16 items-center justify-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-md shadow-brand/20 transition-transform active:scale-95">
              <Plus className="size-6" aria-hidden="true" />
            </span>
          </button>

          {primaryItems.slice(2).map(({ view, label, icon: Icon }) => (
            <button
              key={view}
              type="button"
              onClick={() => selectView(view)}
              aria-current={activeSection === view ? "page" : undefined}
              className={cn(
                "flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand",
                activeSection === view ? "text-brand" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </button>
          ))}

          <Dialog.Trigger asChild>
            <button
              type="button"
              aria-current={activeSection === "more" ? "page" : undefined}
              className={cn(
                "flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand",
                activeSection === "more" ? "text-brand" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <MoreHorizontal className="size-5" aria-hidden="true" />
              <span>Ещё</span>
            </button>
          </Dialog.Trigger>
        </div>
      </nav>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-background px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
          <div className="mx-auto max-w-lg">
            <Dialog.Title className="mb-1 text-lg font-semibold">Разделы</Dialog.Title>
            <Dialog.Description className="mb-4 text-sm text-muted-foreground">
              Дополнительные способы просмотра задач и настройки.
            </Dialog.Description>

            <div className="space-y-1">
              {([
                { view: "calendar", label: "Календарь", icon: CalendarRange },
                { view: "matrix", label: "Матрица", icon: Grid2X2 },
                { view: "archive", label: "Архив", icon: Archive },
              ] as const).map(({ view, label, icon: Icon }) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => selectView(view)}
                  aria-current={currentView === view ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-brand",
                    currentView === view && "bg-brand/10 text-brand",
                  )}
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  {view === "archive" && stats?.archivedTasks ? (
                    <span className="text-xs text-muted-foreground">{stats.archivedTasks}</span>
                  ) : null}
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </button>
              ))}
            </div>

            <div className="my-3 border-t border-border" />
            <button type="button" onClick={selectProfile} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-brand">
              <UserRound className="size-5" aria-hidden="true" />
              <span className="flex-1">Профиль</span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </button>
            <button type="button" onClick={selectLogout} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-brand">
              <LogOut className="size-5" aria-hidden="true" />
              <span>Выйти</span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
