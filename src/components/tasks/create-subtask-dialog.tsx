"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateSubtaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentTaskId: string;
  parentTaskTitle: string;
  onSubmit: (parentId: string, title: string) => void;
}

export function CreateSubtaskDialog({
  open,
  onOpenChange,
  parentTaskId,
  parentTaskTitle,
  onSubmit
}: CreateSubtaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Введите название подзадачи");
      return;
    }

    setIsLoading(true);
    try {
      onSubmit(parentTaskId, title.trim());
      onOpenChange(false);
    } catch (error) {
      toast.error("Ошибка при создании подзадачи");
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
            Создание подзадачи для: <strong>{parentTaskTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Название подзадачи</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Что нужно сделать?"
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
              Создать подзадачу
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}