"use client";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";
import {
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Zap,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface EnergyStatusProps {
  currentEnergy: number | null;
  onEnergyChange: (level: number | null) => void;
  isLoading?: boolean;
}

const ENERGY_OPTIONS = [
  {
    level: 1,
    title: "Лёгкая",
    description: "Для простых и знакомых задач",
    color: "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
  },
  {
    level: 2,
    title: "Рутина",
    description: "Хорошо для обычных дел",
    color: "text-lime-700 bg-lime-100 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800",
  },
  {
    level: 3,
    title: "Сбалансированная",
    description: "Оптимально для большинства задач",
    color: "text-yellow-700 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
  },
  {
    level: 4,
    title: "Фокус",
    description: "Для важных и сложных задач",
    color: "text-orange-700 bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
  },
  {
    level: 5,
    title: "Пиковая",
    description: "Максимальная энергия для больших дел",
    color: "text-red-700 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  },
];

const ENERGY_DESCRIPTIONS = {
  1: "Лёгкие задачи, которые можно сделать даже при усталости",
  2: "Повседневные дела без сильного напряжения",
  3: "Сбалансированная работа на комфортном уровне",
  4: "Глубокая концентрация на важных задачах",
  5: "Пиковая продуктивность и большие проекты",
};

const ENERGY_COLORS = {
  1: "bg-green-500",
  2: "bg-lime-500",
  3: "bg-yellow-500",
  4: "bg-orange-500",
  5: "bg-red-500",
};

const ENERGY_BG_COLORS = {
  1: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
  2: "bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800",
  3: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
  4: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
  5: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
};

function getEnergyIcon(level: number) {
  if (level <= 1) return <BatteryLow className="h-5 w-5" />;
  if (level <= 2) return <BatteryMedium className="h-5 w-5" />;
  if (level <= 3) return <Battery className="h-5 w-5" />;
  if (level <= 4) return <BatteryFull className="h-5 w-5" />;
  return <BatteryFull className="h-5 w-5" />;
}

export function EnergyStatus({
  currentEnergy,
  onEnergyChange,
  isLoading = false,
}: EnergyStatusProps) {
  if (currentEnergy === null) {
    return (
      <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader className="pb-6">
          <CardTitle className="text-headline">Как вы себя чувствуете?</CardTitle>
          <p className="text-body text-muted-foreground mt-2">
            Выберите уровень энергии, чтобы сфокусироваться на подходящих задачах
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {ENERGY_OPTIONS.map((option) => (
              <button
                key={option.level}
                onClick={() => onEnergyChange(option.level)}
                disabled={isLoading}
                className={cn(
                  "group flex flex-col gap-3 rounded-2xl border-2 p-5 text-left transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                  option.color,
                  "hover:shadow-lg"
                )}
              >
                {/* Icon and level */}
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-slate-900/50">
                    {getEnergyIcon(option.level)}
                  </div>
                  <span className="text-lg font-bold opacity-70">{option.level}</span>
                </div>
                
                {/* Text content */}
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-sm leading-snug">{option.title}</p>
                  <p className="text-xs leading-relaxed opacity-80 break-words">
                    {option.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentage = (currentEnergy / 5) * 100;
  const bgColorClass = ENERGY_BG_COLORS[currentEnergy as keyof typeof ENERGY_BG_COLORS];
  const currentOption = ENERGY_OPTIONS.find((o) => o.level === currentEnergy);

  return (
    <Card className={cn("mb-6 border-2", bgColorClass)}>
      <CardHeader className="pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-3 text-title mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-slate-900/50">
                {getEnergyIcon(currentEnergy)}
              </div>
              <span>Ваша энергия</span>
            </CardTitle>
            <p className="text-subtitle text-muted-foreground">
              {currentOption?.title} ({currentEnergy}/5)
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEnergyChange(null)}
            disabled={isLoading}
            className="whitespace-nowrap"
          >
            Сбросить
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-white/50 dark:bg-slate-900/20 p-3 border border-dashed border-muted/40">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {ENERGY_DESCRIPTIONS[currentEnergy as keyof typeof ENERGY_DESCRIPTIONS]}
          </p>
        </div>

        {/* Energy meter */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span>Уровень энергии</span>
            <span>{currentEnergy}/5</span>
          </div>
          <Progress value={percentage} className="h-3 rounded-full" />
        </div>

        {/* Quick level selector */}
        <div className="flex gap-2 justify-center flex-wrap pt-2">
          {ENERGY_OPTIONS.map((option) => (
            <Button
              key={option.level}
              onClick={() => onEnergyChange(option.level)}
              variant={currentEnergy === option.level ? "default" : "outline"}
              size="sm"
              disabled={isLoading}
              className={cn(
                "rounded-full h-9 w-9 p-0 transition-all",
                currentEnergy === option.level && "ring-2 ring-offset-2"
              )}
            >
              <span className="font-semibold">{option.level}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

