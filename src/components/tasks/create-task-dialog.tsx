"use client";

import { useState } from "react";
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

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps) {
  const { addTask, currentEnergy } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [energyLevel, setEnergyLevel] = useState(currentEnergy ?? 3);
  const [dueDateStart, setDueDateStart] = useState("");
  const [dueDateEnd, setDueDateEnd] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Введите название задачи");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          energyLevel,
          dueDateStart: dueDateStart || undefined,
          dueDateEnd: dueDateEnd || undefined,
        }),
      });

      const data: ApiResponse<Task> = await response.json();

      if (data.success && data.data) {
        addTask(data.data);
        toast.success("Задача создана! 🎉");
        // Reset form
        setTitle("");
        setDescription("");
        setPriority("medium");
        setEnergyLevel(currentEnergy ?? 3);
        setDueDateStart("");
        setDueDateEnd("");
        onOpenChange(false);
      } else {
        toast.error(data.error?.message || "Ошибка создания задачи");
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
            <DialogTitle>Новая задача</DialogTitle>
            <DialogDescription>
              Создайте новую задачу. Обязательно только название.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Название <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Что нужно сделать?"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
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
                  <Label htmlFor="dateStart" className="text-xs text-muted-foreground">
                    От
                  </Label>
                  <Input
                    id="dateStart"
                    type="date"
                    value={dueDateStart}
                    onChange={(e) => setDueDateStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dateEnd" className="text-xs text-muted-foreground">
                    До
                  </Label>
                  <Input
                    id="dateEnd"
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
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
