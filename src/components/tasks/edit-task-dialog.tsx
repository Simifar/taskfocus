"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { ApiResponse, Task } from "@/types";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps) {
  const { updateTask } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(task.priority);
  const [energyLevel, setEnergyLevel] = useState(task.energyLevel);
  const [dueDateStart, setDueDateStart] = useState(
    task.dueDateStart ? new Date(task.dueDateStart).toISOString().split("T")[0] : ""
  );
  const [dueDateEnd, setDueDateEnd] = useState(
    task.dueDateEnd ? new Date(task.dueDateEnd).toISOString().split("T")[0] : ""
  );

  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setEnergyLevel(task.energyLevel);
      setDueDateStart(
        task.dueDateStart ? new Date(task.dueDateStart).toISOString().split("T")[0] : ""
      );
      setDueDateEnd(
        task.dueDateEnd ? new Date(task.dueDateEnd).toISOString().split("T")[0] : ""
      );
    }
  }, [open, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Введите название задачи");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          energyLevel,
          dueDateStart: dueDateStart || null,
          dueDateEnd: dueDateEnd || null,
        }),
      });

      const data: ApiResponse<Task> = await response.json();

      if (data.success && data.data) {
        updateTask(task.id, data.data);
        toast.success("Задача обновлена");
        onOpenChange(false);
      } else {
        toast.error(data.error?.message || "Ошибка обновления задачи");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Редактировать задачу</DialogTitle>
            <DialogDescription>
              Измените параметры задачи.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">
                Название <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Что нужно сделать?"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Дополнительная информация..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Приоритет</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as "low" | "medium" | "high")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Уровень энергии</Label>
                <Select
                  value={energyLevel.toString()}
                  onValueChange={(v) => setEnergyLevel(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 — Очень низкий</SelectItem>
                    <SelectItem value="2">2 — Низкий</SelectItem>
                    <SelectItem value="3">3 — Средний</SelectItem>
                    <SelectItem value="4">4 — Высокий</SelectItem>
                    <SelectItem value="5">5 — Очень высокий</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Мягкий дедлайн (диапазон дат)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="edit-dateStart" className="text-xs text-muted-foreground">
                    От
                  </Label>
                  <Input
                    id="edit-dateStart"
                    type="date"
                    value={dueDateStart}
                    onChange={(e) => setDueDateStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-dateEnd" className="text-xs text-muted-foreground">
                    До
                  </Label>
                  <Input
                    id="edit-dateEnd"
                    type="date"
                    value={dueDateEnd}
                    onChange={(e) => setDueDateEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
