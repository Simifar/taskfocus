"use client";

import type { ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import type { Task } from "@/shared/types";
import { cn } from "@/shared/lib/utils";

export interface SortableTaskGroup {
  id: string;
  tasks: Task[];
  className?: string;
  contentClassName?: string;
  header?: ReactNode;
  empty?: ReactNode;
}

export interface TaskGroupMove {
  task: Task;
  fromGroupId: string;
  toGroupId: string;
}

interface SortableTasksBoardProps {
  groups: SortableTaskGroup[];
  className?: string;
  itemId?: (task: Task, groupId: string) => string;
  renderTask: (task: Task, dragHandle: ReactNode, groupId: string) => ReactNode;
  onChange?: (groups: SortableTaskGroup[], move?: TaskGroupMove) => void;
}

function sortableId(task: Task, groupId: string, itemId?: SortableTasksBoardProps["itemId"]) {
  return itemId?.(task, groupId) ?? `${groupId}::${task.id}`;
}

function SortableBoardItem({
  task,
  groupId,
  id,
  children,
}: {
  task: Task;
  groupId: string;
  id: string;
  children: (dragHandle: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { taskId: task.id, groupId },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("touch-manipulation", isDragging && "z-10 opacity-50")}
    >
      {children(
        <button
          type="button"
          className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring touch-manipulation"
          aria-label={`Перетащить задачу «${task.title}»`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>,
      )}
    </div>
  );
}

function SortableBoardColumn({
  group,
  itemId,
  renderTask,
}: {
  group: SortableTaskGroup;
  itemId?: SortableTasksBoardProps["itemId"];
  renderTask: SortableTasksBoardProps["renderTask"];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column::${group.id}`, data: { groupId: group.id } });
  const itemIds = group.tasks.map((task) => sortableId(task, group.id, itemId));

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "min-w-0 transition-colors",
        isOver && "ring-2 ring-inset ring-brand/35",
        group.className,
      )}
    >
      {group.header}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className={cn("min-h-16", group.contentClassName)}>
          {group.tasks.length > 0
            ? group.tasks.map((task) => (
                <SortableBoardItem
                  key={sortableId(task, group.id, itemId)}
                  id={sortableId(task, group.id, itemId)}
                  task={task}
                  groupId={group.id}
                >
                  {(handle) => renderTask(task, handle, group.id)}
                </SortableBoardItem>
              ))
            : group.empty}
        </div>
      </SortableContext>
    </section>
  );
}

export function SortableTasksBoard({
  groups,
  className,
  itemId,
  renderTask,
  onChange,
}: SortableTasksBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const sourceGroupId = String(active.data.current?.groupId ?? "");
    const targetGroupId = String(over.data.current?.groupId ?? "");
    const taskId = String(active.data.current?.taskId ?? "");
    const sourceGroup = groups.find((group) => group.id === sourceGroupId);
    const targetGroup = groups.find((group) => group.id === targetGroupId);
    const sourceIndex = sourceGroup?.tasks.findIndex((task) => task.id === taskId) ?? -1;

    if (!sourceGroup || !targetGroup || sourceIndex < 0) return;

    const task = sourceGroup.tasks[sourceIndex];
    const targetItemId = String(over.id);
    const targetIndex = targetGroup.tasks.findIndex(
      (candidate) => sortableId(candidate, targetGroup.id, itemId) === targetItemId,
    );

    if (sourceGroupId === targetGroupId) {
      if (targetIndex < 0 || sourceIndex === targetIndex) return;
      const nextGroups = groups.map((group) =>
        group.id === sourceGroupId
          ? { ...group, tasks: arrayMove(group.tasks, sourceIndex, targetIndex) }
          : group,
      );
      onChange?.(nextGroups);
      return;
    }

    const remainingSource = sourceGroup.tasks.filter((_, index) => index !== sourceIndex);
    const existingTargetIndex = targetGroup.tasks.findIndex((candidate) => candidate.id === task.id);
    const destination = [...targetGroup.tasks];
    if (existingTargetIndex >= 0) destination.splice(existingTargetIndex, 1);
    const insertAt = targetIndex < 0 ? destination.length : Math.min(targetIndex, destination.length);
    destination.splice(insertAt, 0, task);

    const nextGroups = groups.map((group) => {
      if (group.id === sourceGroupId) return { ...group, tasks: remainingSource };
      if (group.id === targetGroupId) return { ...group, tasks: destination };
      return group;
    });
    onChange?.(nextGroups, { task, fromGroupId: sourceGroupId, toGroupId: targetGroupId });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className={className}>
        {groups.map((group) => (
          <SortableBoardColumn
            key={group.id}
            group={group}
            itemId={itemId}
            renderTask={renderTask}
          />
        ))}
      </div>
    </DndContext>
  );
}
