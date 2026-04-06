"use client";

import { useState } from "react";
import { Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, ChevronDown, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TaskWithSubtasksProps {
  task: Task;
  subtasks: Task[];
  onToggleSubtask: (subtask: Task) => void;
  onAddSubtask: (parentId: string, title: string) => void;
  onEditTask: (task: Task) => void;
  onEditSubtask: (subtask: Task) => void;
  onDeleteSubtask: (subtaskId: string) => void;
}

export function TaskWithSubtasks({
  task,
  subtasks,
  onToggleSubtask,
  onAddSubtask,
  onEditTask,
  onEditSubtask,
  onDeleteSubtask,
}: TaskWithSubtasksProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  const completedSubtasks = subtasks.filter(st => st.status === "completed").length;
  const totalSubtasks = subtasks.length;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      onAddSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle("");
      setIsAddingSubtask(false);
      toast.success("Подзадача добавлена!");
    } catch (error) {
      toast.error("Ошибка при добавлении подзадачи");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddSubtask();
    } else if (e.key === "Escape") {
      setIsAddingSubtask(false);
      setNewSubtaskTitle("");
    }
  };

  return (
    <Card className="mb-2">
      <CardContent className="p-4">
        {/* Main Task */}
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 h-6 w-6"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{task.title}</h4>
              {totalSubtasks > 0 && (
                <Badge variant="outline" className="text-xs">
                  {completedSubtasks}/{totalSubtasks}
                </Badge>
              )}
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingSubtask(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditTask(task)}
            >
              ✏️
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {totalSubtasks > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Прогресс подзадач</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Subtasks */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-2">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-3 p-2 rounded bg-gray-50 dark:bg-gray-800/50"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleSubtask(subtask)}
                  className="p-1 h-6 w-6"
                >
                  {subtask.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </Button>

                <span
                  className={cn(
                    "flex-1 text-sm",
                    subtask.status === "completed" && "line-through text-muted-foreground"
                  )}
                >
                  {subtask.title}
                </span>

                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    E{subtask.energyLevel}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditSubtask(subtask)}
                    className="p-1 h-6 w-6"
                  >
                    ✏️
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteSubtask(subtask.id)}
                    className="p-1 h-6 w-6 text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            ))}

            {/* Add Subtask Input */}
            {isAddingSubtask && (
              <div className="flex gap-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Название подзадачи..."
                  className="flex-1 text-sm"
                  autoFocus
                />
                <Button size="sm" onClick={handleAddSubtask}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsAddingSubtask(false);
                    setNewSubtaskTitle("");
                  }}
                >
                  ✕
                </Button>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
