"use client";

import { useState, useCallback } from "react";
import { Task } from "@/shared/types";
import { Card, CardContent } from "@/shared/ui/card";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Circle, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { TaskWithSubtasks } from "./task-with-subtasks";
import { CreateSubtaskDialog } from "./create-subtask-dialog";
import { TaskRow } from "./task-row";

// Wrapper component to make TaskWithSubtasks draggable
function SortableTaskWithSubtasks({
  task,
  subtasks,
  onToggleSubtask,
  onAddSubtask,
  onEditTask,
  onEditSubtask,
  onDeleteSubtask,
  onComplete,
  onArchive,
  onDelete,
  isDragging = false,
}: {
  task: Task;
  subtasks: Task[];
  onToggleSubtask: (subtask: Task) => void;
  onAddSubtask: (parentId: string, title: string) => Promise<void> | void;
  onEditTask: (task: Task) => void;
  onEditSubtask: (subtask: Task) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onComplete: (task: Task) => void;
  onArchive: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskWithSubtasks
        task={task}
        subtasks={subtasks}
        onToggleSubtask={onToggleSubtask}
        onAddSubtask={onAddSubtask}
        onEditTask={onEditTask}
        onEditSubtask={onEditSubtask}
        onDeleteSubtask={onDeleteSubtask}
        onComplete={onComplete}
        onArchive={onArchive}
        onDelete={onDelete}
        attributes={attributes}
        listeners={listeners}
        isDragging={isSortableDragging}
      />
    </div>
  );
}

interface SortableTaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onArchive: (taskId: string) => void;
  onComplete: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddSubtask?: (parentId: string, title: string) => Promise<void> | void;
  onOpenSubtaskDialog?: (task: Task) => void;
  isDragging?: boolean;
}

function SortableTaskItem({
  task,
  onEdit,
  onArchive,
  onComplete,
  onDelete,
  onAddSubtask,
  onOpenSubtaskDialog,
  isDragging = false,
}: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskRow
        task={task}
        dragHandle={
          <button
            type="button"
            className="mt-0.5 flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-accent active:cursor-grabbing touch-manipulation"
            aria-label={`Перетащить задачу «${task.title}»`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        }
        onComplete={onComplete}
        onEdit={onEdit}
        onArchive={onArchive}
        onDelete={onDelete}
        onAddSubtask={onAddSubtask ? onOpenSubtaskDialog : undefined}
        isDragging={isSortableDragging}
      />
    </div>
  );
}

interface SortableTasksListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onArchive: (taskId: string) => void;
  onComplete: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onReorder?: (tasks: Task[]) => void;
  // Подзадачи
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => Promise<void> | void;
  onEditTask?: (task: Task) => void;
  onEditSubtask?: (subtask: Task) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
}

export function SortableTasksList({
  tasks,
  onEdit,
  onArchive,
  onComplete,
  onDelete,
  onReorder,
  onToggleSubtask,
  onAddSubtask,
  onEditTask,
  onEditSubtask,
  onDeleteSubtask,
}: SortableTasksListProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false);
  const [parentTaskForSubtask, setParentTaskForSubtask] = useState<Task | null>(null);

  const handleOpenSubtaskDialog = useCallback((task: Task) => {
    setParentTaskForSubtask(task);
    setSubtaskDialogOpen(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedId(null);

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
        onReorder?.(reorderedTasks);
        toast.success("Задачи переупорядочены");
      }
    }
  };

  const taskIds = tasks.map((task) => task.id);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Circle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Нет задач
                  </p>
                </CardContent>
              </Card>
            ) : (
              tasks.map((task) => {
                // Если у задачи есть подзадачи, используем SortableTaskWithSubtasks
                if (task.subtasks && task.subtasks.length > 0) {
                  return (
                    <SortableTaskWithSubtasks
                      key={task.id}
                      task={task}
                      subtasks={task.subtasks}
                      onToggleSubtask={onToggleSubtask || (() => {})}
                      onAddSubtask={onAddSubtask || (() => {})}
                      onEditTask={onEditTask || onEdit}
                      onEditSubtask={onEditSubtask || (() => {})}
                      onDeleteSubtask={onDeleteSubtask || (() => {})}
                      onComplete={onComplete}
                      onArchive={onArchive}
                      onDelete={onDelete}
                      isDragging={draggedId === task.id}
                    />
                  );
                }

                // Иначе используем обычный SortableTaskItem
                return (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onArchive={onArchive}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    onAddSubtask={onAddSubtask}
                    onOpenSubtaskDialog={handleOpenSubtaskDialog}
                    isDragging={draggedId === task.id}
                  />
                );
              })
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Create Subtask Dialog */}
      {parentTaskForSubtask && (
        <CreateSubtaskDialog
          open={subtaskDialogOpen}
          onOpenChange={setSubtaskDialogOpen}
          parentTaskId={parentTaskForSubtask!.id}
          parentTaskTitle={parentTaskForSubtask!.title}
          onSubmit={(parentId, title) => onAddSubtask?.(parentId, title)}
        />
      )}
    </>
  );
}
