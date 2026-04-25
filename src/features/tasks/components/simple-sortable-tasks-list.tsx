"use client";

import type { ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Task } from "@/shared/types";
import { cn } from "@/shared/lib/utils";

interface SimpleSortableTasksListProps {
  tasks: Task[];
  className?: string;
  onReorder?: (tasks: Task[]) => void;
  children: (task: Task) => ReactNode;
}

function SortableTaskShell({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
      }}
      className={cn("touch-manipulation", isDragging && "z-10")}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export function SimpleSortableTasksList({
  tasks,
  className,
  onReorder,
  children,
}: SimpleSortableTasksListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((task) => task.id === active.id);
    const newIndex = tasks.findIndex((task) => task.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    onReorder?.(arrayMove(tasks, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {tasks.map((task) => (
            <SortableTaskShell key={task.id} id={task.id}>
              {children(task)}
            </SortableTaskShell>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
