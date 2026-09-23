"use client";

import { useEffect, useRef, useState } from "react";
import type { Task, User, StatsResponse } from "@/shared/types";
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
  Settings,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/utils";

interface DashboardSidebarProps {
  user: User | null;
  stats: StatsResponse | null;
  tasks: Task[];
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const focusableSelector =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

export function DashboardSidebar({
  user,
  stats,
  tasks,
  onLogout,
  isOpen = false,
  onClose,
}: DashboardSidebarProps) {
  const router = useRouter();
  const navigationRef = useRef<HTMLElement>(null);
  const currentView = useDashboardStore((s) => s.currentView);
  const setView = useDashboardStore((s) => s.setView);
  const [moreOpen, setMoreOpen] = useState<boolean | null>(null);

  void tasks;

  const isAdvancedView = ["calendar", "matrix", "day", "archive"].includes(currentView);

  const isMoreOpen = moreOpen ?? isAdvancedView;

  useEffect(() => {
    if (!isOpen) return;

    const panel = navigationRef.current;
    if (!panel) return;

    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
    focusables()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleNavClick = (view: DashboardView) => {
    setView(view);
    onClose?.();
  };

  const goToProfile = () => {
    router.push("/profile");
    onClose?.();
  };

  return (
    <aside
      id="dashboard-navigation"
      ref={navigationRef}
      aria-label="Основная навигация"
      className={cn(
        "w-64 shrink-0 bg-sidebar border-r border-border flex flex-col overscroll-contain",
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
        "md:relative md:z-auto md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition min-w-0 text-left rounded-md"
            onClick={goToProfile}
            aria-label="Открыть профиль"
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
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-10 w-10 shrink-0"
            onClick={onClose}
            aria-label="Закрыть навигацию"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Разделы TaskFocus">
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
