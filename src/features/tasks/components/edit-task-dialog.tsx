"use client";

import { useState, useEffect } from "react";
import { useUpdateTask } from "@/features/tasks/hooks";
import { useCategories } from "@/features/categories/hooks";
import { ApiError } from "@/shared/lib/fetcher";
import type { Task } from "@/shared/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps) {
  const { data: categories = [] } = useCategories();
  const updateTask = useUpdateTask();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(task.priority);
  const [energyLevel, setEnergyLevel] = useState(task.energyLevel);
  const [categoryId, setCategoryId] = useState<string>(task.categoryId ?? "");
  const [dueDateStart, setDueDateStart] = useState(
    task.dueDateStart ? new Date(task.dueDateStart).toISOString().split("T")[0] : "",
  );
  const [dueDateEnd, setDueDateEnd] = useState(
    task.dueDateEnd ? new Date(task.dueDateEnd).toISOString().split("T")[0] : "",
  );

  useEffect(() => {
    if (!open) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority);
    setEnergyLevel(task.energyLevel);
    setCategoryId(task.categoryId ?? "");
    setDueDateStart(task.dueDateStart ? new Date(task.dueDateStart).toISOString().split("T")[0] : "");
    setDueDateEnd(task.dueDateEnd ? new Date(task.dueDateEnd).toISOString().split("T")[0] : "");
  }, [open, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Введите название задачи");
      return;
    }

    try {
      await updateTask.mutateAsync({
        id: task.id,
        input: {
          title: title.trim(),
          description: description.trim() || null,
          priority,
          energyLevel,
          categoryId: categoryId || null,
          dueDateStart: dueDateStart ? new Date(dueDateStart).toISOString() : null,
          dueDateEnd: dueDateEnd ? new Date(dueDateEnd).toISOString() : null,
        },
      });
      toast.success("Задача обновлена");
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Ошибка соединения";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Редактировать задачу</DialogTitle>
            <DialogDescription>Измените параметры задачи.</DialogDescription>
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
                <Label>List / Project</Label>
                <Select
                  value={categoryId === "" ? "__none__" : categoryId}
                  onValueChange={(v) => setCategoryId(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Без списка" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Без списка</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Уровень энергии</Label>
                <Select
                  value={energyLevel.toString()}
                  onValueChange={(v) => setEnergyLevel(parseInt(v, 10))}
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
                  <Label htmlFor="edit-dateStart" className="text-xs text-muted-foreground">От</Label>
                  <Input
                    id="edit-dateStart"
                    type="date"
                    value={dueDateStart}
                    onChange={(e) => setDueDateStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-dateEnd" className="text-xs text-muted-foreground">До</Label>
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
            <Button type="submit" disabled={updateTask.isPending}>
              {updateTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
