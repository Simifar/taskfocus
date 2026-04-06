"use client";

import { useState, useCallback } from "react";
import { Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SortableTaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onArchive: (taskId: string) => void;
  onComplete: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isDragging?: boolean;
}

function SortableTaskItem({
  task,
  onEdit,
  onArchive,
  onComplete,
  onDelete,
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "";
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={cn("transition-all", isSortableDragging && "shadow-lg ring-2 ring-blue-400")}>
        <CardContent className="p-4 flex items-center gap-3">
          {/* Drag Handle */}
          <Button
            variant="ghost"
            size="icon"
            className="cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* Complete Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(task.status === "completed" && "text-emerald-600")}
            onClick={() => onComplete(task)}
          >
            {task.status === "completed" ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <Circle className="h-6 w-6" />
            )}
          </Button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "font-medium",
                task.status === "completed" && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {task.description}
              </p>
            )}
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className={getEnergyColor(task.energyLevel)}>
                {getEnergyIcon(task.energyLevel)}
                <span className="ml-1">{task.energyLevel}</span>
              </Badge>
              <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                {task.priority === "high"
                  ? "Высокий"
                  : task.priority === "medium"
                  ? "Средний"
                  : "Низкий"}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {task.status === "active" && (
              <>
                <Button variant="ghost" size="icon" onClick={() => onEdit(task)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onArchive(task.id)}
                  title="В архив"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(task.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
}

export function SortableTasksList({
  tasks,
  onEdit,
  onArchive,
  onComplete,
  onDelete,
  onReorder,
}: SortableTasksListProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
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
            tasks.map((task) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                onEdit={onEdit}
                onArchive={onArchive}
                onComplete={onComplete}
                onDelete={onDelete}
                isDragging={draggedId === task.id}
              />
            ))
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}
