"use client";

import { Task, StatsResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SortableTasksList } from "@/components/tasks/sortable-tasks-list";
import { EnergyStatus } from "../shared/energy-status";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Zap,
  TrendingUp,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface TodayViewProps {
  tasks: Task[];
  stats: StatsResponse | null;
  currentEnergy: number | null;
  onEnergyChange: (level: number | null) => void;
  onEdit: (task: Task) => void;
  onArchive: (taskId: string) => void;
  onComplete: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddTask: () => void;
  // Subtasks
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => void;
  onEditSubtask?: (subtask: Task) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
  isLoading?: boolean;
}

const MOTIVATIONAL_QUOTES = [
  "Every small step counts! 🎯",
  "You've got this! 💪",
  "One task at a time 🎯",
  "Progress over perfection 📈",
  "You're doing great! ✨",
  "Break it into smaller pieces 🧩",
  "Focus on what matters 🎯",
  "You're closer than you think 🚀",
];

function getToday() {
  const today = new Date();
  return format(today, "EEEE, MMMM d", { locale: ru });
}

function getMotivationalQuote() {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

export function TodayView({
  tasks,
  stats,
  currentEnergy,
  onEnergyChange,
  onEdit,
  onArchive,
  onComplete,
  onDelete,
  onAddTask,
  onToggleSubtask,
  onAddSubtask,
  onEditSubtask,
  onDeleteSubtask,
  isLoading = false,
}: TodayViewProps) {
  // Filter tasks for today
  const todayTasks = tasks.filter((task) => {
    if (task.status !== "active") return false;
    if (!task.dueDateStart && !task.dueDateEnd) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = task.dueDateStart ? new Date(task.dueDateStart) : null;
    const end = task.dueDateEnd ? new Date(task.dueDateEnd) : null;

    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(0, 0, 0, 0);

    if (start && end) {
      return start <= today && today <= end;
    }
    if (start) {
      return start.getTime() === today.getTime();
    }
    return false;
  });

  // Apply energy filter
  const filteredTasks = currentEnergy
    ? todayTasks.filter((t) => t.energyLevel <= currentEnergy)
    : todayTasks;

  // Separate completed and active
  const activeTasks = filteredTasks.filter((t) => t.status === "active");
  const completedTasks = todayTasks.filter((t) => t.status === "completed");

  const maxActive = 5;
  const canAddMore = activeTasks.length < maxActive;
  const progressPercent = todayTasks.length > 0 
    ? (completedTasks.length / todayTasks.length) * 100 
    : 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-6 w-6 text-emerald-600" />
            <h1 className="text-3xl font-bold">Today</h1>
          </div>
          <p className="text-muted-foreground text-lg capitalize">{getToday()}</p>
        </div>

        {/* Energy Status */}
        <EnergyStatus
          currentEnergy={currentEnergy}
          onEnergyChange={onEnergyChange}
          isLoading={isLoading}
        />

        {/* Active Tasks Section */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Zap className="h-5 w-5 text-yellow-500" />
                Focus On Today
              </CardTitle>
              <Badge variant="outline">{activeTasks.length}/{maxActive}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {activeTasks.length < maxActive
                ? `${maxActive - activeTasks.length} more slots available`
                : `You're at capacity! Finish one to add more`}
            </p>
          </CardHeader>
          <CardContent>
            {activeTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No tasks for today yet</p>
                <Button onClick={onAddTask} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <SortableTasksList
                  tasks={activeTasks}
                  onEdit={onEdit}
                  onArchive={onArchive}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onToggleSubtask={onToggleSubtask}
                  onAddSubtask={onAddSubtask}
                  onEditSubtask={onEditSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Tasks Section */}
        {completedTasks.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Completed Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20"
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm line-through text-muted-foreground flex-1">
                      {task.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(task.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress & Motivation */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Progress Today</span>
                </div>
                <span className="text-sm font-semibold">
                  {completedTasks.length}/{todayTasks.length}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-center text-sm italic text-muted-foreground">
                {getMotivationalQuote()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
