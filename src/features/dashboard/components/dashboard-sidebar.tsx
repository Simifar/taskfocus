"use client";

import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Archive,
  Brain,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Grid2X2,
  Inbox,
  LogOut,
  Search,
  Settings2,
} from "lucide-react";

import { useDashboardStore, type DashboardView } from "@/features/dashboard/store";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import type { StatsResponse, User } from "@/shared/types";

interface DashboardSidebarProps {
  user: User | null;
  stats: StatsResponse | null;
  currentView: DashboardView;
  dayReturnView: "today" | "week" | "calendar";
  onSearch: () => void;
  onLogout: () => void;
}

interface NavigationItem {
  view: DashboardView;
  label: string;
  icon: LucideIcon;
  count?: keyof StatsResponse;
}

const navigationGroups: { label: string; items: NavigationItem[] }[] = [
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

function initials(name?: string | null, username?: string | null) {
  const source = name?.trim() || username?.trim() || "TF";
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("ru-RU"))
    .join("");
}

export function DashboardSidebar({
  user,
  stats,
  currentView,
  dayReturnView,
  onSearch,
  onLogout,
}: DashboardSidebarProps) {
  const router = useRouter();
  const setView = useDashboardStore((state) => state.setView);
  const activeView = currentView === "day" ? dayReturnView : currentView;

  return (
    <aside
      id="dashboard-navigation"
      aria-label="Основная навигация"
      className="hidden w-[272px] shrink-0 flex-col border-r border-border bg-sidebar md:flex"
    >
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <Brain className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">TaskFocus</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {user?.name || user?.username || "Личное пространство"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Разделы TaskFocus">
        <Button
          variant="outline"
          className="h-10 w-full justify-start gap-2 border-border bg-background/70 text-sm text-muted-foreground shadow-none"
          onClick={onSearch}
        >
          <Search className="size-4" aria-hidden="true" />
          <span className="flex-1 text-left">Найти задачу</span>
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">Ctrl K</kbd>
        </Button>

        {navigationGroups.map((group) => (
          <section key={group.label} aria-label={group.label}>
            <h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {group.label}
            </h2>
            <div className="space-y-1">
              {group.items.map(({ view, label, icon: Icon, count }) => {
                const isActive = activeView === view;
                const countValue = count ? stats?.[count] : undefined;

                return (
                  <Button
                    key={view}
                    variant="ghost"
                    className={cn(
                      "h-10 w-full justify-start gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                    )}
                    onClick={() => setView(view)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className={cn("size-4 shrink-0", isActive && "text-brand")} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-left">{label}</span>
                    {typeof countValue === "number" && countValue > 0 ? (
                      <span className="min-w-5 rounded-md bg-background/70 px-1.5 py-0.5 text-center text-[11px] tabular-nums text-muted-foreground">
                        {countValue}
                      </span>
                    ) : null}
                  </Button>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="space-y-2 border-t border-border p-3">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Аккаунт
        </p>
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="h-9 w-full justify-start gap-3 px-2.5 text-sm"
            onClick={() => router.push("/profile")}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-semibold text-brand">
              {initials(user?.name, user?.username)}
            </span>
            <span className="min-w-0 truncate">Профиль</span>
          </Button>
          <Button
            variant="ghost"
            className="h-9 w-full justify-start gap-3 px-3 text-sm"
            onClick={() => router.push("/settings")}
          >
            <Settings2 className="size-4" aria-hidden="true" />
            <span>Настройки</span>
          </Button>
        </div>
        <Button variant="ghost" className="h-9 w-full justify-start gap-3 px-3 text-sm text-muted-foreground" onClick={onLogout}>
          <LogOut className="size-4" aria-hidden="true" />
          <span>Выйти</span>
        </Button>
      </div>
    </aside>
  );
}
