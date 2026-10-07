"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
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
  /** Compact preview that follows the pointer while dragging. */
  renderOverlay?: (task: Task) => ReactNode;
  /** Returns a reason when the task cannot be dropped into the group; shown on the column. */
  getDropBlocker?: (task: Task, groupId: string) => string | null;
  /** Human name of a column for screen-reader announcements. */
  groupLabel?: (groupId: string) => string;
  onChange?: (groups: SortableTaskGroup[], move?: TaskGroupMove) => void;
}

type DropState = "idle" | "ok" | "blocked";

function sortableId(task: Task, groupId: string, itemId?: SortableTasksBoardProps["itemId"]) {
  return itemId?.(task, groupId) ?? `${groupId}::${task.id}`;
}

// Pointer drags target what is under the cursor (an item, else its column).
const pointerCollision: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  if (within.length > 0) {
    const item = within.find((entry) => !String(entry.id).startsWith("column::"));
    return item ? [item] : within;
  }
  return closestCenter(args);
};

export function BoardDragHandle(props: React.ComponentProps<"button"> & { label: string }) {
  const { label, className, ...rest } = props;
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/70 hover:text-foreground active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-ring",
        className,
      )}
      {...rest}
    >
      <GripVertical className="size-4" aria-hidden="true" />
    </button>
  );
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
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && "opacity-30")}
    >
      {children(
        <BoardDragHandle label={`Перетащить задачу «${task.title}»`} {...attributes} {...listeners} />,
      )}
    </div>
  );
}

function SortableBoardColumn({
  group,
  itemId,
  renderTask,
  dropState,
  dropMessage,
}: {
  group: SortableTaskGroup;
  itemId?: SortableTasksBoardProps["itemId"];
  renderTask: SortableTasksBoardProps["renderTask"];
  dropState: DropState;
  dropMessage: string | null;
}) {
  const { setNodeRef } = useDroppable({ id: `column::${group.id}`, data: { groupId: group.id } });
  const itemIds = group.tasks.map((task) => sortableId(task, group.id, itemId));

  return (
    <section
      ref={setNodeRef}
      data-drop={dropState}
      className={cn(
        "relative min-w-0 transition-[box-shadow,background-color] duration-150",
        group.className,
        dropState === "ok" && "bg-brand-soft/50 ring-2 ring-inset ring-brand/60",
        dropState === "blocked" && "ring-2 ring-inset ring-destructive/60",
      )}
    >
      {group.header}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className={cn("min-h-12", group.contentClassName)}>
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
      {dropMessage && (
        <p
          role="status"
          className={cn(
            "pointer-events-none absolute inset-x-2 bottom-2 z-20 rounded-md px-2 py-1 text-center text-xs font-medium shadow-sm",
            dropState === "blocked" ? "bg-destructive text-white" : "bg-brand text-brand-foreground",
          )}
        >
          {dropMessage}
        </p>
      )}
    </section>
  );
}

export function SortableTasksBoard({
  groups,
  className,
  itemId,
  renderTask,
  renderOverlay,
  getDropBlocker,
  groupLabel = (groupId) => groupId,
  onChange,
}: SortableTasksBoardProps) {
  const [active, setActive] = useState<{ task: Task; groupId: string } | null>(null);
  const [overGroupId, setOverGroupId] = useState<string | null>(null);
  // Keyboard drags have no live pointer position, so they use the dragged rect instead.
  const keyboardDrag = useRef(false);
  const collisionDetection: CollisionDetection = (args) =>
    keyboardDrag.current ? closestCenter(args) : pointerCollision(args);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const titleOf = (data?: Record<string, unknown>) => {
    const taskId = String(data?.taskId ?? "");
    for (const group of groups) {
      const task = group.tasks.find((candidate) => candidate.id === taskId);
      if (task) return task.title;
    }
    return "задача";
  };

  const reset = () => {
    setActive(null);
    setOverGroupId(null);
  };

  const handleDragStart = ({ active: dragged, activatorEvent }: DragStartEvent) => {
    keyboardDrag.current = activatorEvent instanceof KeyboardEvent;
    const groupId = String(dragged.data.current?.groupId ?? "");
    const taskId = String(dragged.data.current?.taskId ?? "");
    const task = groups.find((group) => group.id === groupId)?.tasks.find((t) => t.id === taskId);
    if (task) setActive({ task, groupId });
  };

  const handleDragOver = ({ over }: DragOverEvent) => {
    setOverGroupId(over ? String(over.data.current?.groupId ?? "") || null : null);
  };

  const handleDragEnd = ({ active: dragged, over }: DragEndEvent) => {
    reset();
    if (!over || dragged.id === over.id) return;

    const sourceGroupId = String(dragged.data.current?.groupId ?? "");
    const targetGroupId = String(over.data.current?.groupId ?? "");
    const taskId = String(dragged.data.current?.taskId ?? "");
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

  const dropFor = (groupId: string): { state: DropState; message: string | null } => {
    if (!active || overGroupId !== groupId || groupId === active.groupId) return { state: "idle", message: null };
    const blocker = getDropBlocker?.(active.task, groupId) ?? null;
    return blocker ? { state: "blocked", message: blocker } : { state: "ok", message: null };
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={reset}
      accessibility={{
        screenReaderInstructions: {
          draggable: "Нажмите пробел, чтобы взять задачу, стрелками выберите место, пробелом отпустите, Escape — отмена.",
        },
        announcements: {
          onDragStart: ({ active: dragged }) => `Задача «${titleOf(dragged.data.current)}» взята.`,
          onDragOver: ({ active: dragged, over }) =>
            over ? `«${titleOf(dragged.data.current)}» над колонкой «${groupLabel(String(over.data.current?.groupId ?? ""))}».` : undefined,
          onDragEnd: ({ active: dragged, over }) =>
            over ? `«${titleOf(dragged.data.current)}» перенесена: «${groupLabel(String(over.data.current?.groupId ?? ""))}».` : "Перенос отменён.",
          onDragCancel: () => "Перенос отменён.",
        },
      }}
    >
      <div className={className}>
        {groups.map((group) => {
          const drop = dropFor(group.id);
          return (
            <SortableBoardColumn
              key={group.id}
              group={group}
              itemId={itemId}
              renderTask={renderTask}
              dropState={drop.state}
              dropMessage={drop.message}
            />
          );
        })}
      </div>
      <DragOverlay dropAnimation={{ duration: 160, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {active ? (
          <div className="w-64 max-w-[80vw] rotate-[0.8deg] cursor-grabbing">
            {renderOverlay ? renderOverlay(active.task) : renderTask(active.task, null, active.groupId)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
