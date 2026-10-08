import type { DashboardView } from "@/features/dashboard/store";
import { cn } from "@/shared/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

/** Content-area placeholder shown while a section's first page of tasks loads. */
export function ViewSkeleton({ view }: { view: DashboardView }) {
  const board = view === "week" || view === "calendar" || view === "matrix";

  return (
    <div className="mx-auto w-full max-w-5xl" role="status" aria-label="Загрузка задач">
      <Bar className="h-4 w-28" />
      <Bar className="mt-3 h-8 w-56" />
      {board ? (
        <div className={cn("mt-8 grid gap-3", view === "matrix" ? "md:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3")}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="workspace-panel space-y-2 p-3">
              <Bar className="h-4 w-24" />
              <Bar className="h-12 w-full" />
              <Bar className="h-12 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3.5">
              <Bar className="size-5 rounded-full" />
              <Bar className={cn("h-4", i % 2 ? "w-1/2" : "w-2/3")} />
            </div>
          ))}
        </div>
      )}
      <span className="sr-only">Загружаем задачи…</span>
    </div>
  );
}
