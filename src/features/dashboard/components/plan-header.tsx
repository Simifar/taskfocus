import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/shared/ui/button";

interface PlanHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  prevLabel: string;
  nextLabel: string;
  isCurrent: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

/** Shared header for period views: title on the left, period navigation on the right. */
export function PlanHeader({
  title,
  subtitle,
  prevLabel,
  nextLabel,
  isCurrent,
  onPrev,
  onNext,
  onToday,
}: PlanHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h1 className="workspace-title first-letter:uppercase">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1 rounded-2xl border bg-card p-1.5 shadow-[var(--shadow-panel)]">
        <Button variant="ghost" size="icon" className="size-11 sm:size-9" aria-label={prevLabel} onClick={onPrev}>
          <ChevronLeft />
        </Button>
        <Button
          variant="ghost"
          className="min-h-11 px-3 sm:min-h-9"
          onClick={onToday}
          disabled={isCurrent}
        >
          Сегодня
        </Button>
        <Button variant="ghost" size="icon" className="size-11 sm:size-9" aria-label={nextLabel} onClick={onNext}>
          <ChevronRight />
        </Button>
      </div>
    </header>
  );
}
