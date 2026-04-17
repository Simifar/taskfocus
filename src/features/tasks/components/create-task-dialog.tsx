"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/features/dashboard/store";
import { ApiResponse, Task, StatsResponse } from "@/shared/types";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { Calendar } from "@/shared/ui/calendar";
import { Loader2, Calendar as CalendarIcon, Battery, BatteryLow, BatteryMedium, BatteryFull } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedDate?: Date;
  categories: string[];
  currentCategory?: string;
}

export function CreateTaskDialog({ open, onOpenChange, preSelectedDate, categories, currentCategory }: CreateTaskDialogProps) {
  const { addTask, setStats, currentEnergy } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [energyLevel, setEnergyLevel] = useState(currentEnergy || 3);
  const [category, setCategory] = useState<string>(currentCategory || "");
  const [dueDateStart, setDueDateStart] = useState<Date | undefined>(preSelectedDate || new Date());
  const [dueDateEnd, setDueDateEnd] = useState<Date | undefined>(preSelectedDate || new Date());

  // Иконки энергии
  const getEnergyIcon = (level: number) => {
    if (level <= 1) return <BatteryLow className="h-4 w-4" />;
    if (level <= 2) return <BatteryMedium className="h-4 w-4" />;
    if (level <= 3) return <Battery className="h-4 w-4" />;
    return <BatteryFull className="h-4 w-4" />;
  };

  // Цвета энергии
  const getEnergyColor = (level: number) => {
    if (level <= 2) return "bg-green-100 hover:bg-green-200 text-green-900 dark:bg-green-900/40 dark:hover:bg-green-800/50 dark:text-green-200";
    if (level === 3) return "bg-yellow-100 hover:bg-yellow-200 text-yellow-900 dark:bg-yellow-900/40 dark:hover:bg-yellow-800/50 dark:text-yellow-200";
    return "bg-red-100 hover:bg-red-200 text-red-900 dark:bg-red-900/40 dark:hover:bg-red-800/50 dark:text-red-200";
  };

  // Update dates when dialog opens or preSelectedDate changes
  useEffect(() => {
    if (open) {
      if (preSelectedDate === undefined) {
        // For inbox tasks, no dates
        setDueDateStart(undefined);
        setDueDateEnd(undefined);
      } else {
        // For dated tasks
        setDueDateStart(preSelectedDate);
        setDueDateEnd(preSelectedDate);
      }
      setCategory(currentCategory || "");
    }
  }, [open, preSelectedDate, currentCategory]);

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
          category: category || undefined,
          dueDateStart: dueDateStart ? dueDateStart.toISOString() : undefined,
          dueDateEnd: dueDateEnd ? dueDateEnd.toISOString() : undefined,
        }),
      });

      const data: ApiResponse<Task> = await response.json();

      if (data.success && data.data) {
        addTask(data.data);
        toast.success("Задача создана! 🎉");
        
        // Обновляем статистику
        try {
          const statsResponse = await fetch("/api/stats");
          const statsData: ApiResponse<StatsResponse> = await statsResponse.json();
          if (statsData.success && statsData.data) {
            setStats(statsData.data);
          }
        } catch (error) {
          console.error("Failed to update stats:", error);
        }
        
        // Reset form
        setTitle("");
        setDescription("");
        setPriority("medium");
        setEnergyLevel(currentEnergy || 3);
        if (preSelectedDate === undefined) {
          setDueDateStart(undefined);
          setDueDateEnd(undefined);
        } else {
          setDueDateStart(preSelectedDate || new Date());
          setDueDateEnd(preSelectedDate || new Date());
        }
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
            {/* Title */}
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
                className="text-base"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Дополнительная информация..."
                rows={2}
              />
            </div>

            {/* Energy Level - Buttons */}
            <div className="space-y-2">
              <Label>Уровень энергии</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEnergyLevel(level)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1",
                      energyLevel === level
                        ? "bg-emerald-600 text-white shadow-md"
                        : getEnergyColor(level)
                    )}
                  >
                    {getEnergyIcon(level)}
                    <span>{level}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {energyLevel <= 2 && "Для рутинных дел, которые не требуют большой энергии"}
                {energyLevel === 3 && "Сбалансированные задачи среднего уровня"}
                {energyLevel >= 4 && "Для важных дел, которые требуют полной концентрации"}
              </p>
            </div>

            {/* Project / Category */}
            <div className="space-y-2">
              <Label>List / Project</Label>
              <Select
                value={category === "" ? "__none__" : category}
                onValueChange={(v) => setCategory(v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Без списка" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Без списка</SelectItem>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Приоритет</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as "low" | "medium" | "high")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Низкий</SelectItem>
                  <SelectItem value="medium">🟡 Средний</SelectItem>
                  <SelectItem value="high">🔴 Высокий</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Мягкий дедлайн</Label>
              <p className="text-xs text-muted-foreground">Выберите период, когда нужно выполнить задачу</p>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="dateStart" className="text-sm text-muted-foreground">
                    От
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDateStart && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDateStart ? format(dueDateStart, "dd MMM", { locale: ru }) : "Выбрать дату"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDateStart}
                        onSelect={setDueDateStart}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        locale={ru}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="dateEnd" className="text-sm text-muted-foreground">
                    До
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDateEnd && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDateEnd ? format(dueDateEnd, "dd MMM", { locale: ru }) : "Выбрать дату"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDateEnd}
                        onSelect={setDueDateEnd}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        locale={ru}
                      />
                    </PopoverContent>
                  </Popover>
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
