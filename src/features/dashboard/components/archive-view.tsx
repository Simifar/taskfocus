"use client";

import { useState } from "react";
import { Archive, Loader2, RotateCcw, Trash2 } from "lucide-react";

import type { StatsResponse, Task } from "@/shared/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/shared/ui/alert-dialog";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

interface ArchiveViewProps {
  tasks: Task[];
  isLoading?: boolean;
  stats: StatsResponse | null;
  onRestore: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function ArchiveView({
  tasks: archivedTasks,
  isLoading = false,
  stats,
  onRestore,
  onDelete,
}: ArchiveViewProps) {
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const rootTasks = archivedTasks.filter((task) => !task.parentTaskId);

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    onDelete(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-muted p-2">
          <Archive className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Архив</h1>
          <p className="text-sm text-muted-foreground">
            {stats?.archivedTasks ?? rootTasks.length} задач в архиве
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Загрузка архива" />
        </div>
      ) : rootTasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Archive className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">Архив пуст</p>
            <p className="mt-1 text-sm text-muted-foreground">Заархивированные задачи появятся здесь.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rootTasks.map((task) => (
            <Card key={task.id} className="border-border/80">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-tight text-muted-foreground line-through">{task.title}</p>
                  {task.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
                  )}
                  <Badge variant="outline" className="mt-3 text-xs">Архивная задача</Badge>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-brand hover:bg-brand/10 hover:text-brand/80"
                    title="Восстановить"
                    aria-label={`Восстановить задачу «${task.title}»`}
                    onClick={() => onRestore(task.id)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    title="Удалить навсегда"
                    aria-label={`Удалить задачу «${task.title}» навсегда`}
                    onClick={() => setPendingDelete(task)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить задачу навсегда?</AlertDialogTitle>
            <AlertDialogDescription>
              Задача «{pendingDelete?.title}» и её подзадачи будут удалены без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отменить</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить навсегда
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
