import type { EisenhowerQuadrant, Task } from "@/shared/types";

export const EISENHOWER_ORDER: EisenhowerQuadrant[] = [
  "do",
  "schedule",
  "delegate",
  "eliminate",
];

export const EISENHOWER_META: Record<
  EisenhowerQuadrant,
  {
    title: string;
    shortTitle: string;
    action: string;
    description: string;
    badge: string;
    border: string;
    panel: string;
    dot: string;
  }
> = {
  do: {
    title: "Важно и срочно",
    shortTitle: "Сделать",
    action: "Сделать сейчас",
    description: "Критичные задачи, которые нельзя откладывать.",
    badge: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800",
    border: "border-l-rose-500",
    panel: "border-rose-200 bg-rose-50/60 dark:border-rose-900/60 dark:bg-rose-950/20",
    dot: "bg-rose-500",
  },
  schedule: {
    title: "Важно, не срочно",
    shortTitle: "Запланировать",
    action: "Запланировать",
    description: "Стратегические задачи, которые двигают цели вперед.",
    badge: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-800",
    border: "border-l-sky-500",
    panel: "border-sky-200 bg-sky-50/60 dark:border-sky-900/60 dark:bg-sky-950/20",
    dot: "bg-sky-500",
  },
  delegate: {
    title: "Срочно, не важно",
    shortTitle: "Сократить",
    action: "Делегировать / сократить",
    description: "Внешние запросы и мелкие срочные дела, которые отвлекают.",
    badge: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800",
    border: "border-l-amber-500",
    panel: "border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20",
    dot: "bg-amber-500",
  },
  eliminate: {
    title: "Не важно и не срочно",
    shortTitle: "Убрать",
    action: "Убрать из фокуса",
    description: "Низкоценные задачи, которые стоит удалить или оставить на потом.",
    badge: "bg-muted text-muted-foreground border-border",
    border: "border-l-muted-foreground/40",
    panel: "border-border bg-muted/30",
    dot: "bg-muted-foreground",
  },
};

export function getEisenhowerQuadrant(input: Pick<Task, "important" | "urgent">): EisenhowerQuadrant {
  if (input.important && input.urgent) return "do";
  if (input.important && !input.urgent) return "schedule";
  if (!input.important && input.urgent) return "delegate";
  return "eliminate";
}

export function compareByEisenhower(a: Pick<Task, "important" | "urgent">, b: Pick<Task, "important" | "urgent">) {
  return (
    EISENHOWER_ORDER.indexOf(getEisenhowerQuadrant(a)) -
    EISENHOWER_ORDER.indexOf(getEisenhowerQuadrant(b))
  );
}
