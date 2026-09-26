"use client";

import { useState } from "react";
import type { User, StatsResponse } from "@/shared/types";
import { useDashboardStore, type DashboardView } from "@/features/dashboard/store";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import {
  Archive,
  Brain,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  Grid2X2,
  Inbox,
  LogOut,
  Search,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/utils";

interface DashboardSidebarProps {
  user: User | null;
  stats: StatsResponse | null;
  onSearch: () => void;
  onLogout: () => void;
}

export function DashboardSidebar({
  user,
  stats,
  onSearch,
  onLogout,
}: DashboardSidebarProps) {
  const router = useRouter();
  const currentView = useDashboardStore((s) => s.currentView);
  const setView = useDashboardStore((s) => s.setView);
  const [moreOpen, setMoreOpen] = useState<boolean | null>(null);

  const isAdvancedView = ["calendar", "matrix", "day", "archive"].includes(currentView);

  const isMoreOpen = moreOpen ?? isAdvancedView;

  const handleNavClick = (view: DashboardView) => {
    setView(view);
  };

  const goToProfile = () => {
    router.push("/profile");
  };

  return (
    <aside
      id="dashboard-navigation"
      aria-label="Основная навигация"
      className="hidden w-64 shrink-0 flex-col overscroll-contain border-r border-border bg-sidebar md:flex"
    >
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition min-w-0 text-left rounded-md"
            onClick={() => handleNavClick("today")}
            aria-label="К задачам на сегодня"
          >
            <div className="p-2 bg-brand rounded-xl shrink-0">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-subtitle truncate">TaskFocus</h1>
              <p className="text-caption truncate">
                {user?.name || user?.username || "Пользователь"}
              </p>
            </div>
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Разделы TaskFocus">
        <Button
          variant="outline"
          className="mb-4 h-10 w-full justify-start gap-2 bg-background/70 text-sm text-muted-foreground"
          onClick={onSearch}
        >
          <Search className="size-4" aria-hidden="true" />
          <span className="flex-1 text-left">Найти задачу</span>
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">Ctrl K</kbd>
        </Button>
        <div className="space-y-2">
          <Button
            variant={currentView === "today" ? "default" : "ghost"}
            className={cn(
              "w-full justify-between",
              currentView === "today" && "bg-brand hover:bg-brand/90 text-brand-foreground",
            )}
            onClick={() => handleNavClick("today")}
            aria-current={currentView === "today" ? "page" : undefined}
          >
            <span className="flex items-center gap-2"><CalendarCheck className="h-4 w-4" />Сегодня</span>
            {stats?.todayTasks ? <span className="text-xs bg-white/20 px-2 py-1 rounded">{stats.todayTasks}</span> : null}
          </Button>
          <Button
            variant={currentView === "inbox" ? "default" : "ghost"}
            className={cn(
              "w-full justify-between",
              currentView === "inbox" && "bg-brand hover:bg-brand/90 text-brand-foreground",
            )}
            onClick={() => handleNavClick("inbox")}
            aria-current={currentView === "inbox" ? "page" : undefined}
          >
            <span className="flex items-center gap-2"><Inbox className="h-4 w-4" />Входящие</span>
            {stats?.inboxTasks ? <span className="text-xs bg-white/20 px-2 py-1 rounded">{stats.inboxTasks}</span> : null}
          </Button>
          <Button
            variant={currentView === "week" ? "default" : "ghost"}
            className={cn(
              "w-full justify-between",
              currentView === "week" && "bg-brand hover:bg-brand/90 text-brand-foreground",
            )}
            onClick={() => handleNavClick("week")}
            aria-current={currentView === "week" ? "page" : undefined}
          >
            <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />План</span>
            {stats?.weekTasks ? <span className="text-xs bg-white/20 px-2 py-1 rounded">{stats.weekTasks}</span> : null}
          </Button>
          <Button
            variant={isAdvancedView || moreOpen ? "secondary" : "ghost"}
            className="w-full justify-between"
            onClick={() => setMoreOpen(!isMoreOpen)}
            aria-expanded={isMoreOpen}
            aria-controls="advanced-navigation"
          >
            <span className="flex items-center gap-2"><Settings className="h-4 w-4" />Ещё</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isMoreOpen && "rotate-180")} />
          </Button>
        </div>

        {isMoreOpen && (
          <div id="advanced-navigation" className="mt-2 space-y-1 border-l border-border pl-3">
            <Button
              variant={currentView === "calendar" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 text-sm"
              onClick={() => handleNavClick("calendar")}
              aria-current={currentView === "calendar" ? "page" : undefined}
            >
              <CalendarRange className="h-4 w-4" />Календарь
            </Button>
            <Button
              variant={currentView === "matrix" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 text-sm"
              onClick={() => handleNavClick("matrix")}
              aria-current={currentView === "matrix" ? "page" : undefined}
            >
              <Grid2X2 className="h-4 w-4" />Матрица
            </Button>
            <Button
              variant={currentView === "archive" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 text-sm"
              onClick={() => handleNavClick("archive")}
              aria-current={currentView === "archive" ? "page" : undefined}
            >
              <Archive className="h-4 w-4" />Архив
              {stats?.archivedTasks ? <span className="ml-auto text-xs text-muted-foreground">{stats.archivedTasks}</span> : null}
            </Button>
          </div>
        )}

        <Separator className="my-5" />
        <Button
          variant="ghost"
          className="w-full justify-start text-sm gap-2"
          onClick={goToProfile}
        >
          <Settings className="h-4 w-4" />
          <span>Профиль</span>
        </Button>
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start text-sm gap-2"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Выйти</span>
        </Button>
      </div>
    </aside>
  );
}
