"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { LucideIcon } from "lucide-react";
import {
  Archive,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  Grid2X2,
  Inbox,
  LogOut,
  PanelsTopLeft,
  Plus,
  Settings2,
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
  onSettings: () => void;
  onLogout: () => void;
}

interface SectionItem {
  view: DashboardView;
  label: string;
  icon: LucideIcon;
  count?: keyof StatsResponse;
}

const primaryItems: SectionItem[] = [
  { view: "today", label: "Сегодня", icon: CalendarCheck, count: "todayTasks" },
  { view: "inbox", label: "Входящие", icon: Inbox, count: "inboxTasks" },
  { view: "week", label: "Неделя", icon: CalendarDays, count: "weekTasks" },
];

const sectionGroups: { label: string; items: SectionItem[] }[] = [
  {
    label: "Задачи",
    items: [
      { view: "today", label: "Сегодня", icon: CalendarCheck, count: "todayTasks" },
      { view: "inbox", label: "Входящие", icon: Inbox, count: "inboxTasks" },
    ],
  },
  {
    label: "Планирование",
    items: [
      { view: "week", label: "Неделя", icon: CalendarDays, count: "weekTasks" },
      { view: "calendar", label: "Календарь", icon: CalendarRange },
      { view: "matrix", label: "Матрица Эйзенхауэра", icon: Grid2X2 },
    ],
  },
  {
    label: "Завершённое",
    items: [{ view: "archive", label: "Архив", icon: Archive, count: "archivedTasks" }],
  },
];

export function MobileNavigation({
  currentView,
  dayReturnView,
  stats,
  onNavigate,
  onAddTask,
  onProfile,
  onSettings,
  onLogout,
}: MobileNavigationProps) {
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const activeSection = getMobileNavSection(currentView, dayReturnView);

  const selectView = (view: DashboardView) => {
    setSectionsOpen(false);
    onNavigate(view);
  };

  const selectAccountPage = (navigate: () => void) => {
    setSectionsOpen(false);
    navigate();
  };

  const renderItem = ({ view, label, icon: Icon, count }: SectionItem) => {
    const countValue = count ? stats?.[count] : undefined;
    const isActive = currentView === view || (currentView === "day" && dayReturnView === view);

    return (
      <button
        key={view}
        type="button"
        onClick={() => selectView(view)}
        aria-current={currentView === view ? "page" : undefined}
        className={cn(
          "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-brand",
          isActive && "bg-brand/10 text-brand",
        )}
      >
        <Icon className="size-5 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {typeof countValue === "number" && countValue > 0 ? (
          <span className="rounded-md bg-background px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
            {countValue}
          </span>
        ) : null}
        {currentView === view ? (
          <span className="sr-only">Текущий раздел</span>
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
        )}
      </button>
    );
  };

  return (
    <Dialog.Root open={sectionsOpen} onOpenChange={setSectionsOpen}>
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
              aria-expanded={sectionsOpen}
              className={cn(
                "flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand",
                activeSection === "sections" ? "text-brand" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <PanelsTopLeft className="size-5" aria-hidden="true" />
              <span>Разделы</span>
            </button>
          </Dialog.Trigger>
        </div>
      </nav>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-background px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
          <div className="mx-auto max-w-lg">
            <Dialog.Title className="text-lg font-semibold">Все разделы</Dialog.Title>
            <Dialog.Description className="mb-5 mt-1 text-sm text-muted-foreground">
              Задачи, планирование и настройки аккаунта — в одном месте.
            </Dialog.Description>

            <div className="space-y-5">
              {sectionGroups.map((group) => (
                <section key={group.label} aria-label={group.label}>
                  <h2 className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {group.label}
                  </h2>
                  <div className="space-y-0.5">{group.items.map(renderItem)}</div>
                </section>
              ))}

              <section aria-label="Аккаунт">
                <h2 className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Аккаунт
                </h2>
                <button
                  type="button"
                  onClick={() => selectAccountPage(onProfile)}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <UserRound className="size-5 shrink-0" aria-hidden="true" />
                  <span className="flex-1">Профиль</span>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => selectAccountPage(onSettings)}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <Settings2 className="size-5 shrink-0" aria-hidden="true" />
                  <span className="flex-1">Настройки</span>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </button>
              </section>
            </div>

            <div className="my-4 border-t border-border" />
            <button
              type="button"
              onClick={() => selectAccountPage(onLogout)}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand"
            >
              <LogOut className="size-5" aria-hidden="true" />
              <span>Выйти из аккаунта</span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
