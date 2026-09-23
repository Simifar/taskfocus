import type { CreateTaskInput } from "@/features/tasks/api";

export function createInboxTaskInput(title: string): CreateTaskInput | null {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) return null;

  return {
    title: normalizedTitle,
    description: null,
    important: false,
    urgent: false,
    energyLevel: 3,
    dueDateStart: null,
    dueDateEnd: null,
  };
}
