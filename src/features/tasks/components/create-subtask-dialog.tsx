"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

interface CreateSubtaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentTaskId: string;
  parentTaskTitle: string;
  onSubmit: (parentId: string, title: string) => Promise<void> | void;
}

export function CreateSubtaskDialog({
  open,
  onOpenChange,
  parentTaskId,
  parentTaskTitle,
  onSubmit,
}: CreateSubtaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (open) setTitle("");
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Введите название подзадачи");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(parentTaskId, title.trim());
      toast.success("Подзадача добавлена");
      onOpenChange(false);
    } catch {
      toast.error("Не удалось создать подзадачу");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Добавить подзадачу</DialogTitle>
          <DialogDescription>
            Для задачи: <strong>{parentTaskTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subtask-title">Название подзадачи</Label>
              <Input
                id="subtask-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Что нужно сделать?"
                maxLength={200}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
