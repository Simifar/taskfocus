"use client";

import { useState, useCallback } from "react";
import { Task } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
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
import {
  CheckCircle2,
  Circle,
  GripVertical,
  Trash2,
  Edit2,
  Archive,
  Battery,
  BatteryMedium,
  BatteryLow,
  BatteryFull,
  Plus,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { TaskWithSubtasks } from "./task-with-subtasks";
import { CreateSubtaskDialog } from "./create-subtask-dialog";
import { EISENHOWER_META, getEisenhowerQuadrant } from "@/features/tasks/lib/eisenhower";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

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

  const getEnergyIcon = (level: number) => {
    if (level <= 1) return <BatteryLow className="h-4 w-4 text-green-500" />;
    if (level <= 2) return <BatteryMedium className="h-4 w-4 text-lime-500" />;
    if (level <= 3) return <Battery className="h-4 w-4 text-yellow-500" />;
    if (level <= 4) return <BatteryFull className="h-4 w-4 text-orange-500" />;
    return <BatteryFull className="h-4 w-4 text-red-500" />;
  };

  const getEnergyColor = (level: number) => {
    if (level <= 2) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (level <= 3) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };

  const quadrantMeta = EISENHOWER_META[getEisenhowerQuadrant(task)];

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={cn(
        "transition-all hover:shadow-md border-l-4 border-l-border",
        quadrantMeta.border,
        task.status === "completed" && "opacity-60 bg-muted/40",
        isSortableDragging && "shadow-lg ring-2 ring-brand/50"
      )}>
        <CardContent className="p-4">
          {/* Main Row */}
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <button
              className="cursor-grab active:cursor-grabbing flex-shrink-0 mt-1 h-9 w-9 flex items-center justify-center rounded-md hover:bg-accent touch-manipulation"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Complete Button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "flex-shrink-0 h-9 w-9",
                task.status === "completed" ? "text-brand hover:text-brand/80" : "text-muted-foreground hover:text-brand"
              )}
              onClick={() => onComplete(task)}
            >
              {task.status === "completed" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </Button>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "text-body-large font-semibold leading-tight",
                task.status === "completed" && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                  {task.description}
                </p>
              )}
              {/* Badges Row */}
              <div className="flex flex-wrap gap-2.5 mt-3">
                <Badge variant="secondary" className={cn("gap-1", getEnergyColor(task.energyLevel))}>
                  {getEnergyIcon(task.energyLevel)}
                  <span className="text-xs font-semibold">{task.energyLevel}</span>
                </Badge>
                <Badge variant="outline" className={cn("text-xs font-semibold", quadrantMeta.badge)}>
                  {quadrantMeta.action}
                </Badge>
                {task.subtasks && task.subtasks.length > 0 && (
                  <Badge variant="secondary" className="bg-brand/15 text-brand text-xs font-semibold gap-1">
                    📋 {task.subtasks.filter(s => s.status === "completed").length}/{task.subtasks.length}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {task.status === "active" && (
                    <>
                      {onAddSubtask && (
                        <DropdownMenuItem onClick={() => onOpenSubtaskDialog?.(task)}>
                          <Plus className="h-4 w-4" />
                          Добавить подзадачу
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEdit(task)}>
                        <Edit2 className="h-4 w-4" />
                        Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onArchive(task.id)}>
                        <Archive className="h-4 w-4" />
                        В архив
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(task.id)}>
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
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
